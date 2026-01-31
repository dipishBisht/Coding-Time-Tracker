import * as vscode from "vscode";
import { FirebaseManager } from "./firebase.js";
import { Tracker } from "./tracker.js";
import { getUserId, getCurrentDate } from "./utils.js";

/**
 * MODULE-LEVEL STATE
 * These live for the entire lifetime of the extension.
 */
let firebase: FirebaseManager;
let tracker: Tracker | null = null;
let extensionContext: vscode.ExtensionContext;

/**
 * ACTIVATION
 */
export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  extensionContext = context;
  console.log("[CodingTime] Activating...");

  // ── 1. Firebase setup ───────────
  firebase = new FirebaseManager(context);
  const alreadyConfigured = await firebase.isConfigured();

  if (!alreadyConfigured) {
    const choice = await vscode.window.showInformationMessage(
      "Coding Time Tracker needs a Firebase service account to sync data.",
      "Configure Now",
      "Later",
    );

    if (choice === "Configure Now") {
      await runConfigureFlow();
    } else {
      vscode.window.showWarningMessage(
        "Tracking is paused until configured. " +
          'Run "Coding Time: Configure Firebase" from the Command Palette when ready.',
      );
    }
  } else {
    await firebase.initialize();
  }

  // ── 2. Start the tracker (only if Firebase is ready) ──
  if (await firebase.isConfigured()) {
    await startTracker();
  }

  // ── 3: Register Commands ─────────────
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "coding-time-tracker.configure",
      runConfigureFlow,
    ),
    vscode.commands.registerCommand("coding-time-tracker.showStats", showStats),
  );

  // ── 4: Register cleanup ──────────────
  context.subscriptions.push({
    dispose: async () => {
      if (tracker) {
        await tracker.stop();
      }
      await firebase.dispose();
      console.log("[CodingTime] Fully disposed.");
    },
  });

  console.log("[CodingTime] Activated.");
}

/**
 * DEACTIVATION
 */
export function deactivate() {
  console.log("[CodingTime] Extension deactivated.");
  // Cleanup is handled by the disposable registered above
  // This export exists because VS Code requires it.
}

// INTERNAL FUNCTIONS

/**
 * Create and start a Tracker.
 */
async function startTracker(): Promise<void> {
  const userId = await getUserId(extensionContext);
  tracker = new Tracker(firebase, userId);
  tracker.start();
  console.log("[CodingTime] Tracker started.");
}

/**
 * Run the Firebase configuration flow.
 * Prompts user for service account JSON, stores it, then starts tracker.
 */
async function runConfigureFlow(): Promise<void> {
  const input = await vscode.window.showInputBox({
    prompt: "Paste your Firebase service account JSON here",
    placeHolder: '{ "type": "service_account", ... }',
    ignoreFocusOut: true,
    validateInput: (value) => {
      try {
        const parsed = JSON.parse(value);
        if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
          return "Missing required fields: project_id, private_key, client_email";
        }
        return null; // Valid
      } catch {
        return "Invalid JSON. Paste the entire contents of your service account file.";
      }
    },
  });

  if (!input) {
    return;
  }

  const success = await firebase.configure(input);

  if (success) {
    vscode.window.showInformationMessage(
      "Firebase configured. Starting tracker...",
    );

    if (!tracker) {
      await startTracker();
    }
  } else {
    vscode.window.showErrorMessage(
      "Configuration failed. Open the Debug Console (Ctrl+Shift+J) for details.",
    );
  }
}

/**
 * Command handler: "Coding Time: Show Today's Stats"
 */
async function showStats(): Promise<void> {
  if (!tracker) {
    vscode.window.showWarningMessage(
      "Tracker is not running. Configure Firebase first.",
    );
    return;
  }

  const userId = await getUserId(extensionContext);
  const today = getCurrentDate();

  vscode.window.showInformationMessage(
    `User ID: ${userId}\n` +
      `Today: ${today}\n\n` +
      `To see your stats, go to:\n` +
      `Firebase Console → Firestore → users/${userId}/days/${today}`,
  );
}
