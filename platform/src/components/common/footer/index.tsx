import { Timer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Quick Start", to: "/docs/quick-start" },
    { label: "API Reference", to: "/docs/api-reference" },
    { label: "Dashboard", to: "/dashboard/YOUR_USER_ID" },
  ],
  Documentation: [
    { label: "Installation", to: "/docs/installation" },
    { label: "Authentication", to: "/docs/authentication" },
    { label: "Embedding", to: "/docs/embedding" },
    { label: "Troubleshooting", to: "/docs/troubleshooting" },
  ],
  Community: [
    { label: "GitHub", to: "https://github.com", external: true },
    { label: "Privacy Policy", to: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border- bg-card">
      <div className="container py-16 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-lg"
            >
              <div className="flex relative h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Image
                  src="/images/logo.png"
                  alt="logo"
                  fill
                  className="w-full h-full"
                />
              </div>
              <span>Time in Code</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lightweight VS Code extension that tracks your coding time
              automatically.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {"external" in link ? (
                      <Link
                        href={link.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <Link
                        href={link.to}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Time in Code. Built with Next, MongoDB &
            VS Code API.
          </p>
        </div>
      </div>
    </footer>
  );
}
