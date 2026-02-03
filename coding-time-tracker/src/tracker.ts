import * as vscode from "vscode";
import { IDayData } from "./types";
import { getCurrentDate, getCurrentLanguage } from "./utils";
import { ApiClient } from "./api-client";

/**
 * CONSTANTS
 */

/** Seconds of silence before we consider the user idle. */
const IDLE_TIMEOUT_MS = 60 * 1000;

/** How often the heartbeat fires to check for idle. */
const HEARTBEAT_INTERVAL_MS = 1 * 1000;

/** How often we flush accumulated time to Firestore. */
const SYNC_INTERVAL_MS = 20 * 60 * 1000;

/**
 * TRACKER CLASS
 */

export class Tracker {
  private readonly apiClient: ApiClient;
  private readonly userId: string;

  private isTracking = false;
  private sessionStartTime: number | null = null;
  private lastActivityTime = 0;
  private currentLanguage = "unknown";
  private currentDate: string;
  private todayData: IDayData;

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private disposables: vscode.Disposable[] = [];

  constructor(apiClient: ApiClient, userId: string) {
    this.apiClient = apiClient;
    this.userId = userId;
    this.currentDate = getCurrentDate();
    this.todayData = this.emptyDayData();
  }

  // PUBLIC API

  /**
   * Start the tracker. Call this once from extension.ts activate().
   */
  start(): void {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(
        this.onDocumentChange.bind(this),
      ),
      vscode.window.onDidChangeActiveTextEditor(this.onEditorChange.bind(this)),
    );

    this.heartbeatTimer = setInterval(
      this.onHeartbeat.bind(this),
      HEARTBEAT_INTERVAL_MS,
    );

    this.syncTimer = setInterval(this.onSyncTick.bind(this), SYNC_INTERVAL_MS);

    console.log("[Tracker] Started.");
  }

  /**
   * Flushes any in-progress session before stopping.
   */
  async stop(): Promise<void> {
    // Clear timers first so nothing fires while we flush
    this.clearTimers();

    // Flush any active session so we don't lose time
    this.flushCurrentSession();

    // Do a final sync so nothing is lost
    await this.syncToApi();

    // Dispose of event listeners
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];

    console.log("[Tracker] Stopped.");
  }

  // EVENT HANDLERS

  /**
   * Fires on every keystroke / edit in any open document.
   */
  private onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    // Ignore non-file documents (like the terminal, output panel, etc.)
    if (event.document.uri.scheme !== "file") {
      return;
    }

    // Ignore documents with no actual changes (e.g. formatting-only events)
    if (event.contentChanges.length === 0) {
      return;
    }

    this.recordActivity();
  }

  /**
   * Fires when the user switches between editor tabs.
   * We treat this as activity too — the user is engaged.
   */
  private onEditorChange(editor: vscode.TextEditor | undefined): void {
    if (!editor) {
      return; // All editors closed — not active
    }

    // Only track file editors, not terminal/output
    if (editor.document.uri.scheme !== "file") {
      return;
    }

    this.recordActivity();
  }

  // CORE TRACKING LOGIC

  /**
   * Called on every detected activity.
   */
  private recordActivity(): void {
    this.lastActivityTime = Date.now();
    this.currentLanguage = getCurrentLanguage();

    if (!this.isTracking) {
      this.sessionStartTime = Date.now();
      this.isTracking = true;
      console.log(
        `[Tracker] Tracking started. Language: ${this.currentLanguage}`,
      );
    }
  }

  /**
   * Fires every second. Checks if user has been idle too long.
   */
  private onHeartbeat(): void {
    if (!this.isTracking) {
      return; // Nothing to check — we're already idle
    }

    const idleMs = Date.now() - this.lastActivityTime;

    if (idleMs >= IDLE_TIMEOUT_MS) {
      console.log("[Tracker] Idle timeout reached. Flushing session.");
      this.flushCurrentSession();
    }
  }

  /**
   * Flush the current active session into todayData.
   * This calculates how long the user was active and adds it
   * to the correct language bucket in todayData.
   */
  private flushCurrentSession(): void {
    if (!this.isTracking || !this.sessionStartTime) {
      return;
    }

    const creditUpTo = this.lastActivityTime;
    const durationMs = creditUpTo - this.sessionStartTime;
    const durationSeconds = Math.floor(durationMs / 1000);

    // Reset session state immediately
    this.isTracking = false;
    this.sessionStartTime = null;

    if (durationSeconds <= 0) {
      return;
    }

    // Check for midnight rollover BEFORE accumulating
    this.checkDateRollover();

    // Accumulate
    this.todayData.totalSeconds += durationSeconds;
    this.todayData.languages[this.currentLanguage] =
      (this.todayData.languages[this.currentLanguage] || 0) + durationSeconds;

    console.log(
      `[Tracker] Flushed ${durationSeconds}s of ${this.currentLanguage}. ` +
        `Today total: ${this.todayData.totalSeconds}s`,
    );
  }

  /**
   * Fires every 20 minutes
   */
  private async onSyncTick(): Promise<void> {
    // If user is actively coding, flush their current session first
    // so we don't miss time that's accumulated but not yet flushed.
    this.flushCurrentSession();

    await this.syncToApi();
  }

  /**
   * Write todayData, then reset the local accumulator.
   */
  private async syncToApi(): Promise<void> {
    if (this.todayData.totalSeconds === 0) {
      return;
    }

    console.log(
      `[Tracker] Syncing ${this.todayData.totalSeconds}s.`,
    );

    const success = await this.apiClient.writeDayData(this.userId, this.todayData);


    if (success) {
      // Reset accumulator after successful write, Only reset on success. If write
      // fails, we keep the data and it will be included in the next sync attempt.
      this.todayData = this.emptyDayData();
      console.log("[Tracker] Sync OK. Accumulator reset.");
    } else {
      console.log(
        "[Tracker] Sync failed. Accumulator preserved for next tick.",
      );
    }
  }

  // MIDNIGHT ROLLOVER

  /**
   * Detects if the date has changed
   * If so, syncs current day's data immediately and resets for the new day.
   */
  private checkDateRollover(): void {
    const today = getCurrentDate();

    if (today === this.currentDate) {
      return;
    }

    console.log(`[Tracker] Date rollover: ${this.currentDate} → ${today}`);

    // Fire-and-forget write of the old day.
    // If this fails, FirebaseManager will queue it for retry.
    // We can't await here cleanly (we're inside a synchronous flush),
    // but data safety is guaranteed by the offline queue.
    this.apiClient.writeDayData(this.userId, this.todayData);

    // Reset for the new day
    this.currentDate = today;
    this.todayData = this.emptyDayData();
  }

  // HELPERS

  private emptyDayData(): IDayData {
    return {
      date: this.currentDate,
      totalSeconds: 0,
      languages: {},
    };
  }

  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}
