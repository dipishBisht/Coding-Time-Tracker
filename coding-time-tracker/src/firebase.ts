import * as admin from "firebase-admin";
import * as vscode from "vscode";
import { IDayData, IFirebaseConfig, IQueuedUpdate } from "./types.js";
import { cert, deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/** The key used to store credentials in VS Code's encrypted secrets store */
const SECRETS_KEY = "coding_time_tracker_firebase_config";

export class FirebaseManager {
  private db: admin.firestore.Firestore | null = null;
  private initialized = false;
  private context: vscode.ExtensionContext;
  private offlineQueue: IQueuedUpdate[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Initialize the Admin SDK using stored credentials.
   * Returns false if no credentials are stored yet (first run).
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    const config = await this.getStoredConfig();
    if (!config) {
      console.log("[Firebase] No stored config. Needs first-run setup.");
      return false;
    }

    try {
      const apps = getApps();
      if (apps.length > 0) {
        await deleteApp(apps[0]);
      }

      initializeApp({
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey.replace(/\\n/g, "\n"),
        }),
      });

      this.db = getFirestore();
      this.initialized = true;
      console.log("[Firebase] Initialized successfully.");

      await this.drainOfflineQueue();

      return true;
    } catch (error) {
      console.error("[Firebase] Initialization failed:", error);
      return false;
    }
  }

  /**
   * First-run configuration flow.
   * Accepts the raw service account JSON string, validates it, extracts the
   * three fields we need, and stores them in VS Code secrets.
   */
  async configure(serviceAccountJson: string): Promise<boolean> {
    try {
      const raw = JSON.parse(serviceAccountJson);

      // Validate that the three fields we actually need exist
      if (!raw.project_id || !raw.private_key || !raw.client_email) {
        throw new Error(
          "Service account JSON is missing required fields. " +
            "Expected: project_id, private_key, client_email.",
        );
      }

      // Store ONLY what we need — not the full JSON
      const config: IFirebaseConfig = {
        projectId: raw.project_id,
        clientEmail: raw.client_email,
        privateKey: raw.private_key,
      };

      await this.context.secrets.store(SECRETS_KEY, JSON.stringify(config));
      console.log("[Firebase] Credentials stored in secrets.");

      // Re-Initialization with the new config
      this.initialized = false;
      return await this.initialize();
    } catch (error) {
      console.error("[Firebase] Configure failed:", error);
      vscode.window.showErrorMessage(
        `Firebase setup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return false;
    }
  }

  /**
   * Returns true if credentials have been stored before.
   */
  async isConfigured(): Promise<boolean> {
    const config = await this.getStoredConfig();
    return config !== null;
  }

  // Data operations

  /**
   * Write a DayData payload to Firestore.
   *
   * Strategy: READ-THEN-MERGE.
   *   • If the document already exists, we ADD our seconds to whatever is
   *     already there. We never overwrite — this makes repeated syncs safe.
   *   • If it doesn't exist, we create it.
   *
   * On network failure: the update is pushed onto the offline queue and
   * will be retried the next time initialize() or writeDayData() succeeds.
   *
   * Returns true on success, false on failure.
   */
  async writeDayData(userId: string, data: IDayData): Promise<boolean> {
    if (!this.initialized || !this.db) {
      console.log("[Firebase] Not initialized — queueing update.");
      this.enqueue(userId, data);
      return false;
    }

    try {
      const docRef = this.db
        .collection("users")
        .doc(userId)
        .collection("days")
        .doc(data.date);

      const existing = await docRef.get();

      if (existing.exists) {
        const stored = existing.data() as IDayData;
        const merged = this.mergeDayData(stored, data);
        await docRef.set(merged);
        console.log(
          `[Firebase] Merged ${data.date}: +${data.totalSeconds}s (total now ${merged.totalSeconds}s)`,
        );
      } else {
        await docRef.set(data);
        console.log(`[Firebase] Created ${data.date}: ${data.totalSeconds}s`);
      }

      return true;
    } catch (error) {
      console.error("[Firebase] Write failed:", error);

      // Only queue for retry if it has a network problem.
      if (this.looksLikeNetworkError(error)) {
        this.enqueue(userId, data);
        console.log("[Firebase] Queued for retry (network error).");
      }

      return false;
    }
  }

  // PUBLIC: Cleanup

  /**
   * Called when the extension deactivates. Attempts one final drain of the
   * offline queue, then tears down the Admin SDK app.
   */
  async dispose(): Promise<void> {
    if (this.offlineQueue.length > 0) {
      console.log("[Firebase] Draining offline queue before shutdown...");
      await this.drainOfflineQueue();
    }

    if (this.initialized && admin.apps.length > 0) {
      await admin.app().delete();
      this.initialized = false;
      console.log("[Firebase] App deleted.");
    }
  }

  // PRIVATE: Credential storage

  private async getStoredConfig(): Promise<IFirebaseConfig | null> {
    try {
      const raw = await this.context.secrets.get(SECRETS_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as IFirebaseConfig;
    } catch {
      return null;
    }
  }

  // PRIVATE: Merge logic

  /**
   * Adds the seconds in `incoming` on top of `existing`.
   * This is how we make repeated syncs idempotent-safe:
   * the tracker resets its local accumulator after each successful write,
   * so each payload is a DELTA, not an absolute total.
   */
  private mergeDayData(existing: IDayData, incoming: IDayData): IDayData {
    const languages: Record<string, number> = { ...existing.languages };

    for (const [lang, seconds] of Object.entries(incoming.languages)) {
      languages[lang] = (languages[lang] || 0) + seconds;
    }

    return {
      date: existing.date,
      totalSeconds: existing.totalSeconds + incoming.totalSeconds,
      languages,
    };
  }

  // PRIVATE: Offline queue

  private enqueue(userId: string, data: IDayData): void {
    this.offlineQueue.push({
      userId,
      date: data.date,
      data,
      timestamp: Date.now(),
    });
    console.log(`[Firebase] Offline queue size: ${this.offlineQueue.length}`);
  }

  /**
   * Attempt to write every queued item. Items that fail again stay in the queue.
   */
  private async drainOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    console.log(
      `[Firebase] Draining ${this.offlineQueue.length} queued update(s)...`,
    );

    // Snapshot and clear — so items added during drain don't get double-processed
    const batch = this.offlineQueue;
    this.offlineQueue = [];

    for (const item of batch) {
      const success = await this.writeDayData(item.userId, item.data);
      if (!success) {
        // writeDayData already re-enqueued it if it was a network error,
        // so we don't need to manually push it back.
      }
    }

    if (this.offlineQueue.length > 0) {
      console.log(
        `[Firebase] ${this.offlineQueue.length} item(s) still queued after drain.`,
      );
    } else {
      console.log("[Firebase] Queue fully drained.");
    }
  }

  // PRIVATE: Error classification

  /**
   * If this error look like a transient network problem?
   * If yes, it's worth retrying. If no (auth, permissions), retrying is pointless.
   */
  private looksLikeNetworkError(error: unknown): boolean {
    const msg = (
      error instanceof Error ? error.message : String(error)
    ).toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("enotfound") ||
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      msg.includes("timeout") ||
      msg.includes("socket hang up")
    );
  }
}
