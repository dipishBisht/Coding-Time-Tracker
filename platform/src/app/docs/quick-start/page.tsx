import Link from "next/link";
import CodeBlock from "@/components/docs/code-block";
import { Check } from "lucide-react";

export default function QuickStart() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
          ~5 min
        </span>
        Quick Start Guide
      </div>

      <h1>Quick Start</h1>
      <p>Get from zero to tracking in 5 minutes. No account needed.</p>

      {/* Step 1 */}
      <div className="flex gap-4 mt-10">
        <div className="step-number">1</div>
        <div className="flex-1">
          <h2 className="mt-0">Install the Extension</h2>
          <p>
            Download the <code>.vsix</code> file and install it via terminal:
          </p>
          <CodeBlock
            language="bash"
            title="Terminal"
            code={`# Download from releases page, then:
code --install-extension coding-time-tracker-0.1.0.vsix`}
          />
          <p>Restart VS Code after installation.</p>
          <div className="flex items-center gap-2 text-sm text-primary mt-2">
            <Check className="h-4 w-4" />
            <span>Extension installed</span>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex gap-4 mt-10">
        <div className="step-number">2</div>
        <div className="flex-1">
          <h2 className="mt-0">Generate Your Token</h2>
          <ol>
            <li>
              Press <code>Ctrl+Shift+P</code> (Windows/Linux) or{" "}
              <code>Cmd+Shift+P</code> (Mac)
            </li>
            <li>
              Type: <strong>&quot;Coding Time: Configure API&quot;</strong>
            </li>
            <li>
              Click <strong>&quot;Generate New Token&quot;</strong>
            </li>
            <li>Copy your token and save it somewhere safe</li>
          </ol>
          <div className="flex items-center gap-2 text-sm text-primary mt-2">
            <Check className="h-4 w-4" />
            <span>Token generated</span>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="flex gap-4 mt-10">
        <div className="step-number">3</div>
        <div className="flex-1">
          <h2 className="mt-0">Start Coding</h2>
          <p>
            Open any file and start typing. The extension tracks automatically —
            no action needed!
          </p>
          <div className="flex items-center gap-2 text-sm text-primary mt-2">
            <Check className="h-4 w-4" />
            <span>Tracking active</span>
          </div>
        </div>
      </div>

      {/* Step 4 */}
      <div className="flex gap-4 mt-10">
        <div className="step-number">4</div>
        <div className="flex-1">
          <h2 className="mt-0">View Your Stats</h2>
          <ol>
            <li>
              Press <code>Ctrl+Shift+P</code> again
            </li>
            <li>
              Type:{" "}
              <strong>&quot;Coding Time: Show Today&apos;s Stats&quot;</strong>
            </li>
            <li>Copy your User ID</li>
            <li>
              Visit your{" "}
              <Link href="/dashboard/YOUR_USER_ID" className="text-primary underline">
                dashboard
              </Link>
            </li>
          </ol>
          <CodeBlock
            language="text"
            title="Dashboard URL"
            code="https://time-in-code.vercel.app/dashboard/YOUR_USER_ID"
          />
        </div>
      </div>

      {/* Next steps */}
      <div className="mt-12 p-6 rounded-xl border bg-muted/30">
        <h3>What&apos;s Next?</h3>
        <ul className="space-y-2 mt-3">
          <li>
            <Link
              href="/docs/api-reference"
              className="text-primary hover:underline"
            >
              View API Reference
            </Link>
          </li>
          <li>
            <Link href="/docs/embedding" className="text-primary hover:underline">
              Embed stats in your portfolio
            </Link>
          </li>
          <li>
            <Link
              href="/docs/troubleshooting"
              className="text-primary hover:underline"
            >
              Troubleshooting
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
