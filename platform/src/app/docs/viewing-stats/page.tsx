import Link from "next/link";

export default function ViewingStats() {
  return (
    <div>
      <h1>Viewing Your Stats</h1>
      <p>There are two ways to view your coding activity data.</p>

      <h2>1. In VS Code</h2>
      <ol>
        <li>
          Press <code>Ctrl+Shift+P</code> (or <code>Cmd+Shift+P</code> on Mac)
        </li>
        <li>
          Type:{" "}
          <strong>&quot;Coding Time: Show Today&apos;s Stats&quot;</strong>
        </li>
        <li>
          A notification will show your total time and top language for today
        </li>
      </ol>

      <h2>2. On the Web Dashboard</h2>
      <p>
        Visit your personalized dashboard to see charts, language breakdowns,
        and historical data:
      </p>
      <div className="my-4 p-4 rounded-lg border bg-muted/30">
        <code className="text-sm">
          https://time-in-code.vercel.app/dashboard/YOUR_USER_ID
        </code>
      </div>
      <p>
        Don&apos;t know your User ID? Run{" "}
        <strong>&quot;Coding Time: Show Today&apos;s Stats&quot;</strong> in VS
        Code — it&apos;s displayed in the output.
      </p>
      <p>
        <Link href="/dashboard/YOUR_USER_ID" className="text-primary hover:underline">
          View a demo dashboard →
        </Link>
      </p>

      <h2>Dashboard Features</h2>
      <ul>
        <li>
          <strong>Total hours</strong> — Cumulative coding time
        </li>
        <li>
          <strong>Daily trend</strong> — Line chart of coding time over 30 days
        </li>
        <li>
          <strong>Language breakdown</strong> — Pie chart of time per language
        </li>
        <li>
          <strong>Recent activity</strong> — Table of last 7 days
        </li>
      </ul>
    </div>
  );
}
