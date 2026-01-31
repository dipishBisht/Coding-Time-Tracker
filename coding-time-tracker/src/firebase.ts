import admin from "firebase-admin";
import * as vscode from "vscode";
import { IDayData, IFirebaseConfig, IQueuedUpdate } from "./types.js";

/**
 * Manages Firebase Firestore operations
 */
export class FirebaseManager {
  private db: admin.firestore.Firestore | null = null;
  private initialized = false;
  private offlineQueue: IQueuedUpdate[] = [];
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * CRITICAL: Initialize Firebase Admin SDK
   * This must be called before any Firebase operations
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if already initialized
      if (this.initialized) {
        return true;
      }

      // Get stored config from VS Code secrets
      const config = await this.getStoredConfig();

      if (!config) {
        console.log("[Firebase] No config found. User needs to configure.");
        return false;
      }

      // Initialize Firebase Admin
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.projectId,
            clientEmail: config.clientEmail,
            privateKey: config.privateKey.replace(/\\n/g, "\n"),
          }),
        });
      }

      this.db = admin.firestore();
      this.initialized = true;

      console.log("[Firebase] Initialized successfully");

      // Process any queued offline updates
      await this.processOfflineQueue();

      return true;
    } catch (error) {
      console.error("[Firebase] Initialization failed:", error);
      vscode.window.showErrorMessage(
        "Failed to initialize Firebase. Please reconfigure.",
      );
      return false;
    }
  }

  /**
   * CRITICAL: Store Firebase configuration
   * Called during first-run setup
   */
  async configure(serviceAccountJson: string): Promise<boolean> {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);

      // Validate required fields
      if (
        !serviceAccount.project_id ||
        !serviceAccount.private_key ||
        !serviceAccount.client_email
      ) {
        throw new Error(
          "Invalid service account JSON. Missing required fields.",
        );
      }

      const config: IFirebaseConfig = {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      };

      // Store in VS Code secrets (encrypted storage)
      await this.context.secrets.store(
        "firebase_config",
        JSON.stringify(config),
      );

      console.log("[Firebase] Configuration stored successfully");

      // Initialize with new config
      this.initialized = false;
      return await this.initialize();
    } catch (error) {
      console.error("[Firebase] Configuration failed:", error);
      vscode.window.showErrorMessage(
        `Failed to configure Firebase: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return false;
    }
  }

  /**
   * Get stored Firebase configuration from secrets
   */
  private async getStoredConfig(): Promise<IFirebaseConfig | null> {
    try {
      const configJson = await this.context.secrets.get("firebase_config");
      if (!configJson) {
        return null;
      }
      return JSON.parse(configJson);
    } catch (error) {
      console.error("[Firebase] Failed to retrieve config:", error);
      return null;
    }
  }

  /**
   * Check if Firebase is configured
   */
  async isConfigured(): Promise<boolean> {
    const config = await this.getStoredConfig();
    return config !== null;
  }

  /**
   * CRITICAL: Write daily data to Firestore
   * Uses merge strategy to increment existing data
   */
  async writeDayData(userId: string, data: IDayData): Promise<boolean> {
    if (!this.initialized || !this.db) {
      console.log("[Firebase] Not initialized. Queueing update for later.");
      this.queueOfflineUpdate(userId, data);
      return false;
    }

    try {
      const docRef = this.db
        .collection("users")
        .doc(userId)
        .collection("days")
        .doc(data.date);

      // Get existing data
      const doc = await docRef.get();

      if (doc.exists) {
        // MERGE: Increment existing values
        const existingData = doc.data() as IDayData;

        const mergedLanguages: Record<string, number> = {
          ...existingData.languages,
        };
        for (const [lang, seconds] of Object.entries(data.languages)) {
          mergedLanguages[lang] = (mergedLanguages[lang] || 0) + seconds;
        }

        const updatedData: IDayData = {
          date: data.date,
          totalSeconds: existingData.totalSeconds + data.totalSeconds,
          languages: mergedLanguages,
        };

        await docRef.set(updatedData);
        console.log(`[Firebase] Updated ${data.date}: +${data.totalSeconds}s`);
      } else {
        // NEW: Create new document
        await docRef.set(data);
        console.log(`[Firebase] Created ${data.date}: ${data.totalSeconds}s`);
      }

      return true;
    } catch (error) {
      console.error("[Firebase] Write failed:", error);

      // If network error, queue for retry
      if (this.isNetworkError(error)) {
        this.queueOfflineUpdate(userId, data);
      }

      return false;
    }
  }

  /**
   * Queue an update for when we're back online
   */
  private queueOfflineUpdate(userId: string, data: IDayData): void {
    this.offlineQueue.push({
      userId,
      date: data.date,
      data,
      timestamp: Date.now(),
    });

    console.log(
      `[Firebase] Queued offline update. Queue size: ${this.offlineQueue.length}`,
    );
  }

  /**
   * Process all queued offline updates
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    console.log(
      `[Firebase] Processing ${this.offlineQueue.length} queued updates...`,
    );

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const update of queue) {
      const success = await this.writeDayData(update.userId, update.data);
      if (!success) {
        // Re-queue if still failing
        this.offlineQueue.push(update);
      }
    }

    if (this.offlineQueue.length > 0) {
      console.log(
        `[Firebase] ${this.offlineQueue.length} updates still queued.`,
      );
    }
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    const message = error?.message?.toLowerCase() || "";
    return (
      message.includes("network") ||
      message.includes("enotfound") ||
      message.includes("timeout") ||
      message.includes("econnrefused")
    );
  }

  /**
   * Get statistics for a date range (OPTIONAL - for debugging)
   */
  async getDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<IDayData[]> {
    if (!this.initialized || !this.db) {
      return [];
    }

    try {
      const snapshot = await this.db
        .collection("users")
        .doc(userId)
        .collection("days")
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy("date", "asc")
        .get();

      return snapshot.docs.map((doc) => doc.data() as IDayData);
    } catch (error) {
      console.error("[Firebase] Failed to get date range:", error);
      return [];
    }
  }

  /**
   * Cleanup on extension deactivation
   */
  async dispose(): Promise<void> {
    // Process any remaining queued updates
    if (this.offlineQueue.length > 0) {
      console.log("[Firebase] Processing remaining queue before shutdown...");
      await this.processOfflineQueue();
    }

    // Delete the app instance
    if (this.initialized) {
      await admin.app().delete();
      console.log("[Firebase] Disconnected");
    }
  }
}
