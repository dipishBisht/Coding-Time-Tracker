# Time In Code Extension

A VS Code extension that automatically tracks how long you code each day and syncs your data to a centralized API.

---

## Features

**Automatic tracking** — Starts when you type, pauses after 60s of idle  
**Per-language breakdown** — See time spent in TypeScript, JavaScript, Python, etc.  
**Privacy-focused** — Data stored by user ID only (no personal info)  
**Offline-safe** — Queues updates when network is down  
**Clean shutdown** — Flushes and syncs before VS Code closes  
**Token-based auth** — No passwords, no Firebase setup  

---

## Installation

### Option 1: Install from .vsix (Recommended)

1. Download the latest `time-in-code-x.x.x.vsix` from [Releases](https://github.com/dipishBisht/Time-In-Code/releases)
2. Open VS Code
3. Run this command:
   ```bash
   code --install-extension time-in-code-0.1.0.vsix
   ```
4. Restart VS Code

### Option 2: Build from Source

```bash
git clone https://github.com/dipishBisht/Time-In-Code
cd time-in-code
npm install
npm run compile

# Package it
npm install -g @vscode/vsce
vsce package

# Install
code --install-extension ./time-in-code-0.1.0.vsix
```

---

## First-Run Setup

1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type: **"Coding Time: Configure API"**
4. Click **"Generate New Token"**
5. Save your token somewhere safe (you'll need it to view stats)

**That's it!** The extension will now track your coding time automatically.

---

## Commands

Access these via Command Palette (`Ctrl+Shift+P`):

| Command | What It Does |
|---|---|
| **Coding Time: Configure API** | Generate or update your authentication token |
| **Coding Time: Show Today's Stats** | Display your user ID and link to view stats |
| **Coding Time: Show Token** | Retrieve your token if you lost it |

---

## How It Works

### Tracking Logic

```
You start typing
       │
       ▼
Tracker starts session timer
       │
       ▼
You stop typing for 60+ seconds
       │
       ▼
Tracker flushes session time to today's accumulator
       │
       ▼
Every 20 minutes
       │
       ▼
Extension sends accumulated data to API
       │
       ▼
API merges your data into MongoDB
```

### What Gets Tracked

- **Time:** Seconds spent actively coding (idle time excluded)
- **Date:** Local date (YYYY-MM-DD)
- **Languages:** VS Code's `languageId` (e.g., `typescript`, `python`, `markdown`)

### What Does NOT Get Tracked

- ❌ File names or paths
- ❌ Code content
- ❌ Project names
- ❌ Personal information

---

## Configuration

### Default Behavior

| Setting | Value | Description |
|---|---|---|
| Idle timeout | 60 seconds | Time before tracking pauses |
| Sync interval | 20 minutes | How often data is sent to API |
| API endpoint | `https://time-in-code.vercel.app/api` | Where data is sent |

### Changing the API Endpoint

If you're self-hosting the API, update this line in `src/api-client.ts`:

```typescript
const DEFAULT_API_ENDPOINT = 'https://time-in-code.vercel.app/api';
```

Then recompile and reinstall:

```bash
npm run compile
vsce package
code --install-extension ./time-in-code-0.1.0.vsix
```

---

## Data Schema

The extension sends this JSON to the API every 20 minutes:

```json
{
  "userId": "abc-123-def-456",
  "date": "2026-02-01",
  "totalSeconds": 600,
  "languages": {
    "typescript": 400,
    "javascript": 200
  }
}
```

- **userId**: Auto-generated UUID (stored locally in VS Code)
- **date**: Local date in YYYY-MM-DD format
- **totalSeconds**: Total seconds coded that day (cumulative)
- **languages**: Breakdown by VS Code language ID

---

## Viewing Your Stats

### In Your Browser

1. Run: **"Coding Time: Show Today's Stats"**
2. Copy your user ID
3. Visit: `https://time-in-code.vercel.app/api/stats/YOUR_USER_ID`

### On Your Portfolio

Add this to your website:

```tsx
fetch('https://time-in-code.vercel.app/api/stats/YOUR_USER_ID?limit=30')
  .then(res => res.json())
  .then(data => {
    console.log(`Total hours: ${data.totalSeconds / 3600}`);
  });
```

---

## Troubleshooting

### Extension doesn't activate

**Check:**
1. Is `activationEvents` set to `["onStartupFinished"]` in `package.json`?
2. Did you run `npm run compile`?
3. Do you see any errors in the Output panel (View → Output → "Extension Host")?

**Fix:**
```bash
npm run compile
# Restart VS Code
```

---

### Data not syncing

**Check:**
1. Open Debug Console (`Ctrl+Shift+Y` in the Extension Development Host)
2. Look for `[ApiClient]` logs
3. Common issues:
   - Invalid token → Run "Configure API" again
   - Wrong API endpoint → Check `DEFAULT_API_ENDPOINT` in `api-client.ts`
   - Network down → Data will queue and retry automatically

**Test the API manually:**
```bash
curl -X POST https://time-in-code.vercel.app/api/track \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-123",
    "date": "2026-02-01",
    "totalSeconds": 60,
    "languages": { "typescript": 60 }
  }'
```

---

### Time looks wrong

**Check:**
1. Are you coding in multiple VS Code windows? Each window tracks separately.
2. Did you code past midnight? The extension handles rollover — check both days.
3. Idle detection: If you stop typing for 60s, time pauses. This is intentional.

---

### Lost my token

Run: **"Coding Time: Show Token"**

If that fails, your token is stored in VS Code's encrypted secrets. Reconfigure:
1. Run **"Coding Time: Configure API"**
2. Choose **"Generate New Token"**
3. Old data remains tied to your user ID

---

## Privacy & Data

### What Gets Stored

- **User ID**: A random UUID generated on your machine
- **Date**: The day you coded
- **Seconds**: Time spent coding
- **Languages**: Which languages you used

### What's Public

- **Stats endpoint**: Anyone can view your stats if they know your user ID
- **User ID is NOT secret**: It's safe to share (like a GitHub username)

### What's Private

- **Token**: Used to write data (keep this secret)
- **No personal info**: No names, emails, code, file paths

### Deleting Your Data

Contact the API administrator or open an issue. Provide your user ID.

---

## Development

### Project Structure

```
coding-time-tracker/
├── src/
│   ├── extension.ts       # Entry point
│   ├── api-client.ts      # API communication
│   ├── tracker.ts         # Time tracking logic
│   ├── types.ts           # TypeScript interfaces
│   └── utils.ts           # Helper functions
├── package.json           # Extension manifest
├── tsconfig.json          # TypeScript config
└── README.md              # This file
```

### Key Files

| File | Purpose |
|---|---|
| `extension.ts` | Activates extension, registers commands, handles cleanup |
| `tracker.ts` | Detects activity, accumulates time, handles idle timeout |
| `api-client.ts` | Sends data to API, handles offline queue |
| `types.ts` | Shared TypeScript interfaces |
| `utils.ts` | Date helpers, user ID generation, formatting |

### Building

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-recompile on save)
npm run watch

# Lint
npm run lint

# Package as .vsix
vsce package
```

### Testing

Press **F5** to launch the Extension Development Host. This opens a new VS Code window with your extension loaded. Make changes, recompile, and reload the window to test.

**Debug logs:** Check the Debug Console in your *development* window (not the host).

---

## Architecture Details

### Activity Detection

The tracker listens to two VS Code events:
- `onDidChangeTextDocument` — Fires when you type
- `onDidChangeActiveTextEditor` — Fires when you switch files

Both reset the idle timer.

### Idle Detection

A heartbeat timer runs every 1 second. If 60 seconds pass without activity, the current session flushes and tracking pauses.

### Time Accumulation

Time is accumulated in **chunks**:
1. Session starts when you type
2. Session ends when you go idle
3. Duration = `lastActivityTime - sessionStartTime`

**Why not continuous?** To avoid counting idle time. If you step away for coffee, those minutes don't count.

### Sync Strategy

Every 20 minutes, accumulated data is sent to the API. The API **merges** (not overwrites):

```typescript
// If today already has 3600 seconds and you send 600 more:
existing.totalSeconds += incoming.totalSeconds;  // 3600 + 600 = 4200
```

### Offline Queue

If the API write fails due to network error, the data is pushed onto an in-memory queue. On the next sync, the queue is drained. Data is safe even if you lose connection mid-coding.

### Midnight Rollover

When the date changes (you code past midnight), the extension:
1. Immediately syncs the old day's data
2. Resets the accumulator for the new day

No time is lost.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test thoroughly (press F5, code for a while, check logs)
5. Submit a PR

---

## License

MIT

---

## Support

- **Issues:** [GitHub Issues](https://github.com/dipishBisht/Time-In-Code/issues)
- **API docs:** See the main repo README
- **Questions:** Start a [Discussion](https://github.com/dipishBisht/Time-In-Code/discussions)