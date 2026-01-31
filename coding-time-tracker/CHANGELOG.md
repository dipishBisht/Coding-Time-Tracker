# Changelog

All notable changes to this extension will be documented here.

## [0.0.1] - 2026-02-01

### Added

- Automatic coding time tracking triggered by text edits and editor switches
- Idle detection with a 60-second timeout — tracking pauses automatically when you stop typing
- Per-language time breakdown using VS Code's built-in `languageId` (e.g. `typescript`, `javascript`, `python`)
- Firebase Firestore sync every 10 minutes via the Admin SDK
- First-run setup flow that asks for a Firebase service account JSON and stores it securely using the VS Code Secrets API
- Persistent local user ID generated on first activation and stored in `globalState`
- Offline-safe write queue — if Firebase is unreachable, updates are held in memory and retried on the next sync
- Midnight rollover handling — coding past midnight correctly splits time into the right calendar day
- `Coding Time: Configure Firebase` command to (re)configure credentials at any time
- `Coding Time: Show Today's Stats` command that displays your user ID and the Firestore path to today's document