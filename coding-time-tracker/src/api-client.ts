/**
 * api-client.ts
 */

import * as vscode from "vscode";
import { IDayData, IQueuedUpdate } from "./types";
import axios from "axios";

/** The key where we store the API endpoint in VS Code settings */
const SECRETS_KEY_API_ENDPOINT = "coding_time_tracker_api_endpoint";
const SECRETS_KEY_USER_TOKEN = "coding_time_tracker_user_token";

export const API_ENDPOINT = "https://your-api.vercel.app/api/";

export class ApiClient {
  private context: vscode.ExtensionContext;
  private apiEndpoint: string = API_ENDPOINT;
  private userToken: string | null = null;
  private initialized = false;

  // In-memory offline queue
  private offlineQueue: IQueuedUpdate[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Initialize by loading stored config.
   * Returns false if not configured yet (first run).
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    // Load endpoint (or use default)
    const storedEndpoint = await this.context.secrets.get(
      SECRETS_KEY_API_ENDPOINT,
    );
    if (storedEndpoint) {
      this.apiEndpoint = storedEndpoint;
    }

    this.userToken = (await this.context.secrets.get(SECRETS_KEY_USER_TOKEN))!;

    if (!this.userToken) {
      console.log("[ApiClient] No user token found. Needs first-run setup.");
      return false;
    }

    this.initialized = true;
    console.log("[ApiClient] Initialized successfully.");

    // Drain any queued updates
    await this.drainOfflineQueue();

    return true;
  }

  /**
   * First-run configuration.
   * Generates or accepts a user token, stores it, and initializes.
   */
  async configure(userProvidedToken?: string): Promise<boolean> {
    try {
      const token = userProvidedToken || this.generateToken();

      await this.context.secrets.store(SECRETS_KEY_USER_TOKEN, token);
      console.log("[ApiClient] User token stored.");

      this.initialized = false;
      return await this.initialize();
    } catch (error) {
      console.error("[ApiClient] Configuration failed:", error);
      vscode.window.showErrorMessage(
        `API setup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return false;
    }
  }

  /**
   * Check if configured.
   */
  async isConfigured(): Promise<boolean> {
    const token = await this.context.secrets.get(SECRETS_KEY_USER_TOKEN);
    return token !== null;
  }

  /**
   * Get the current user token.
   */
  async getUserToken(): Promise<string | null> {
    return (await this.context.secrets.get(SECRETS_KEY_USER_TOKEN)) || null;
  }

  /**
   * Post tracking data API.
   */
  async writeDayData(userId: string, data: IDayData): Promise<boolean> {
    if (!this.initialized || !this.userToken) {
      console.log("[ApiClient] Not initialized — queueing update.");
      this.enqueue(userId, data);
      return false;
    }

    try {
      const response = await axios.post(
        `${this.apiEndpoint}/track`,
        {
          userId,
          date: data.date,
          totalSeconds: data.totalSeconds,
          languages: data.languages,
        },
        {
          headers: {
            Authorization: `Bearer ${this.userToken}`,
          },
        },
      );

      if (!response.data) {
        throw new Error(`API returned ${response.status}: ${response.data.message}`);
      }

      console.log(
        `[ApiClient] Synced ${data.date}: +${data.totalSeconds}s (server total: ${response.data.totalSeconds}s)`,
      );

      return true;
    } catch (error) {
      console.error("[ApiClient] Write failed:", error);

      // Queue for retry if it looks like a network error
      if (this.looksLikeNetworkError(error)) {
        this.enqueue(userId, data);
        console.log("[ApiClient] Queued for retry (network error).");
      }

      return false;
    }
  }

  // Cleanup ───────────────────────────────────────────────────────

  /**
   * Drain offline queue before shutdown.
   */
  async dispose(): Promise<void> {
    if (this.offlineQueue.length > 0) {
      console.log("[ApiClient] Draining offline queue before shutdown...");
      await this.drainOfflineQueue();
    }
  }

  // Token Generation ────────────────────────────────────────────

  /**
   * Generate a secure random token for the user.
   */
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  // Offline Queue ────────────────────────────────────────────────

  private enqueue(userId: string, data: IDayData): void {
    this.offlineQueue.push({
      userId,
      date: data.date,
      data,
      timestamp: Date.now(),
    });
    console.log(`[ApiClient] Offline queue size: ${this.offlineQueue.length}`);
  }

  private async drainOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    console.log(
      `[ApiClient] Draining ${this.offlineQueue.length} queued update(s)...`,
    );

    const batch = this.offlineQueue;
    this.offlineQueue = [];

    for (const item of batch) {
      await this.writeDayData(item.userId, item.data);
    }

    if (this.offlineQueue.length > 0) {
      console.log(
        `[ApiClient] ${this.offlineQueue.length} item(s) still queued.`,
      );
    } else {
      console.log("[ApiClient] Queue fully drained.");
    }
  }

  // Error Classification ─────────────────────────────────────────

  private looksLikeNetworkError(error: unknown): boolean {
    const msg = (
      error instanceof Error ? error.message : String(error)
    ).toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("enotfound") ||
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      msg.includes("timeout")
    );
  }
}
