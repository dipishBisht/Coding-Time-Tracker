import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";

/**
 * Get or create a unique user ID
 */
export async function getUserId(
  context: vscode.ExtensionContext,
): Promise<string> {
  const STORAGE_KEY = "coding_time_tracker_user_id";

  let userId = context.globalState.get<string>(STORAGE_KEY);

  if (!userId) {
    userId = uuidv4();
    await context.globalState.update(STORAGE_KEY, userId);
    console.log("[CodingTime] Generated new user ID:", userId);
  }

  return userId;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get language ID from active editor
 */
export function getCurrentLanguage(): string | null {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return null;
  }

  return editor.document.languageId;
}

/**
 * Format seconds to human-readable time ex: 3665 -> "1h 1m 5s"
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hrs > 0) {
    parts.push(`${hrs}h`);
  }
  if (mins > 0) {
    parts.push(`${mins}m`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(" ");
}
