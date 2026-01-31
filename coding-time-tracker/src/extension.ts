import * as vscode from "vscode";
import { FirebaseManager } from "./firebase.js";
import { getUserId } from "./utils.js";

let firebaseManager: FirebaseManager;

/**
 * Called when extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log("[CodingTime] Extension activated!");

  // Initialize Firebase Manager
  firebaseManager = new FirebaseManager(context);

  // Check if configured
  const isConfigured = await firebaseManager.isConfigured();

  if (!isConfigured) {
    // First run - prompt user to configure
    const result = await vscode.window.showInformationMessage(
      "Coding Time Tracker needs Firebase configuration to sync your data.",
      "Configure Now",
      "Later",
    );

    if (result === "Configure Now") {
      await configureFirebase();
    } else {
      vscode.window.showWarningMessage(
        'Coding Time Tracker will not sync until configured. Run "Coding Time: Configure Firebase" when ready.',
      );
    }
  } else {
    // Initialize with stored config
    const initialized = await firebaseManager.initialize();
    if (initialized) {
      vscode.window.showInformationMessage(
        "Coding Time Tracker is now tracking!",
      );
    }
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "coding-time-tracker.configure",
      configureFirebase,
    ),

    vscode.commands.registerCommand("coding-time-tracker.showStats", showStats),
    vscode.commands.registerCommand("coding-time-tracker.testWrite", () =>
      testFirebaseWrite(context),
    ),
    vscode.commands.registerCommand("coding-time-tracker.reset", async () => {
      await context.secrets.delete("firebase_config");
      vscode.window.showInformationMessage(
        "🔥 Coding Time Tracker reset. Reload window to reconfigure.",
      );
    }),
    vscode.commands.registerCommand("coding-time-tracker.testWrite", () =>
      testFirebaseWrite(context),
    ),
  );

  // Add Firebase to disposables for cleanup
  context.subscriptions.push({
    dispose: () => firebaseManager.dispose(),
  });
}

/**
 * Configure Firebase credentials
 */
async function configureFirebase(): Promise<void> {
  const input = await vscode.window.showInputBox({
    prompt: "Paste your Firebase service account JSON (entire content)",
    placeHolder: '{ "type": "service_account", "project_id": "...", ... }',
    ignoreFocusOut: true,
    validateInput: (value) => {
      try {
        JSON.parse(value);
        return null; // Valid
      } catch {
        return "Invalid JSON format";
      }
    },
  });

  if (!input) {
    return;
  }

  const success = await firebaseManager.configure(input);

  if (success) {
    vscode.window.showInformationMessage(
      "✅ Firebase configured successfully!",
    );
  }
}

/**
 * TEMPORARY: Test Firebase write
 */
async function testFirebaseWrite(
  context: vscode.ExtensionContext,
): Promise<void> {
  const userId = await getUserId(context);

  const testData = {
    date: new Date().toISOString().split("T")[0],
    totalSeconds: 120, // 2 minutes
    languages: {
      typescript: 120,
    },
  };

  vscode.window.showInformationMessage("Writing test data to Firebase...");

  const success = await firebaseManager.writeDayData(userId, testData);

  if (success) {
    vscode.window.showInformationMessage(
      "✅ Test data written! Check Firebase Console.",
    );
  } else {
    vscode.window.showErrorMessage("❌ Failed to write test data.");
  }
}

/**
 * Show today's stats (OPTIONAL - for debugging)
 */
async function showStats(context?: vscode.ExtensionContext): Promise<void> {
  // We'll implement this later - for now just show a message
  vscode.window.showInformationMessage("Stats command - Coming soon!");
}

/**
 * Called when extension is deactivated
 */
export function deactivate() {
  console.log("[CodingTime] Extension deactivated!");
}
