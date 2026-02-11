import CodeBlock from "@/components/docs/code-block";

export default function ApiReference() {
  return (
    <div>
      <h1>API Reference</h1>
      <p>All available endpoints for the Coding Time Tracker API.</p>

      <div className="mt-6 p-4 rounded-lg border bg-muted/30 text-sm">
        <strong>Base URL:</strong> <code>https://time-in-code.vercel.app</code>
      </div>

      {/* POST /api/track */}
      <h2>POST /api/track</h2>
      <p>Submit tracking data from the VS Code extension.</p>

      <h3>Request</h3>
      <CodeBlock
        title="POST /api/track"
        code={`POST /api/track
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "userId": "abc-123",
  "date": "2026-02-01",
  "totalSeconds": 600,
  "languages": {
    "typescript": 600
  }
}`}
      />

      <h3>Response (200)</h3>
      <CodeBlock
        language="json"
        title="Success"
        code={`{
  "success": true,
  "userId": "abc-123",
  "date": "2026-02-01",
  "totalSeconds": 600,
  "languages": {
    "typescript": 600
  },
  "formattedDuration": "10m"
}`}
      />

      <h3>Error Codes</h3>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-3">
                <code>400</code>
              </td>
              <td className="px-4 py-3">Invalid request body</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-3">
                <code>401</code>
              </td>
              <td className="px-4 py-3">Invalid or missing token</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-3">
                <code>403</code>
              </td>
              <td className="px-4 py-3">Token mismatch with userId</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* GET /api/stats/:userId */}
      <h2>GET /api/stats/:userId</h2>
      <p>
        Retrieve tracking stats for a user. Public endpoint — no authentication
        required.
      </p>

      <h3>Request</h3>
      <CodeBlock
        title="GET /api/stats/:userId"
        code={`GET /api/stats/abc-123?startDate=2026-02-01&endDate=2026-02-12&limit=30`}
      />

      <h3>Parameters</h3>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold">Param</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-3">
                <code>userId</code>
              </td>
              <td className="px-4 py-3">string</td>
              <td className="px-4 py-3">User ID (path param)</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-3">
                <code>startDate</code>
              </td>
              <td className="px-4 py-3">string</td>
              <td className="px-4 py-3">YYYY-MM-DD filter start</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-3">
                <code>endDate</code>
              </td>
              <td className="px-4 py-3">string</td>
              <td className="px-4 py-3">YYYY-MM-DD filter end</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-3">
                <code>limit</code>
              </td>
              <td className="px-4 py-3">number</td>
              <td className="px-4 py-3">Days to return (default: 30)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Response (200)</h3>
      <CodeBlock
        language="json"
        title="Success"
        code={`{
  "userId": "abc-123",
  "userName": "John Doe",
  "data": [
    {
      "date": "2026-02-01",
      "totalSeconds": 3600,
      "languages": { "typescript": 2400 },
      "formattedDuration": "1h"
    }
  ],
  "totalSeconds": 86400,
  "totalDays": 30,
  "averageSecondsPerDay": 2880,
  "formattedAverage": "48m"
}`}
      />

      {/* Get /api/dashboard/:userId */}
      <h2>GET /api/dashboard/:userId</h2>
      <p>Returns full dashboard analytics for charts and insights.</p>

      <h3>Request</h3>
      <CodeBlock
        title="GET /api/dashboard/:userId"
        code="GET /api/dashboard/abc-123?days=30"
      />

      <h3>Parameters</h3>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold">Param</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-3">
                <code>days</code>
              </td>
              <td className="px-4 py-3">number</td>
              <td className="px-4 py-3">
                Range to analyze (default 30, max 365)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Response (200)</h3>
      <CodeBlock
        language="json"
        title="Success"
        code={`{
  "userId": "abc-123",
  "userName": "John",
  "hasData": true,

  "overview": {
    "totalHours": 42,
    "totalMinutes": 15,
    "totalSeconds": 152100,
    "totalDays": 18,
    "averageHoursPerDay": 2.3,
    "formattedTotal": "42h 15m"
  },

  "charts": {
    "dailyTrend": [],
    "languageBreakdown": [],
    "dayOfWeekPattern": []
  },

  "recentActivity": [],

  "achievements": {
    "currentStreak": 5,
    "longestStreak": 12,
    "peakDay": {
      "date": "2026-02-10",
      "hours": 6.2
    }
  }
}`}
      />

      {/* Rate Limits */}
      {/* <h2>Rate Limits</h2>
      <p>API requests are rate-limited to prevent abuse:</p>
      <ul>
        <li>
          <code>POST /api/track</code> — 60 requests/minute per token
        </li>
        <li>
          <code>GET /api/stats</code> — 120 requests/minute per IP
        </li>
      </ul> */}
    </div>
  );
}
