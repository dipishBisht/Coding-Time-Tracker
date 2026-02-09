'use client';
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-primary/5 blur-3xl" />

      <div className="container relative py-24 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card text-sm text-muted-foreground mb-8">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
              Now tracking 10+ languages
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6"
          >
            Track Your Coding Time.{" "}
            <span className="gradient-text">Automatically.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A lightweight VS Code extension that monitors your daily coding
            activity and syncs it to a beautiful dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="gap-2 text-base px-8" asChild>
              <Link href="/docs/quick-start">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base px-8"
              asChild
            >
              <Link href="/dashboard/demo">
                <Play className="h-4 w-4" />
                View Demo
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Code editor mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 md:mt-20 max-w-4xl mx-auto"
        >
          <div className="rounded-xl border bg-card overflow-hidden card-elevated">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-accent/60" />
                <div className="w-3 h-3 rounded-full bg-primary/40" />
              </div>
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                main.ts — CodingTime
              </span>
            </div>
            {/* Code lines */}
            <div className="p-5 font-mono text-sm space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground/50 w-6 text-right text-xs">
                  1
                </span>
                <span>
                  <span className="text-primary">import</span> {"{"} trackTime{" "}
                  {"}"} <span className="text-primary">from</span>{" "}
                  <span className="text-accent">&apos;./tracker&apos;</span>;
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground/50 w-6 text-right text-xs">
                  2
                </span>
                <span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground/50 w-6 text-right text-xs">
                  3
                </span>
                <span>
                  <span className="text-primary">const</span> session ={" "}
                  <span className="text-primary">await</span> trackTime({"{"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground/50 w-6 text-right text-xs">
                  4
                </span>
                <span className="pl-6">
                  language: <span className="text-accent">&apos;typescript&apos;</span>,
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground/50 w-6 text-right text-xs">
                  5
                </span>
                <span className="pl-6">
                  duration: <span className="text-accent">&apos;2h 45m&apos;</span>,
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground/50 w-6 text-right text-xs">
                  6
                </span>
                <span>{"}"});</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground/50 w-6 text-right text-xs">
                  7
                </span>
                <span></span>
              </div>
              <div className="flex items-center gap-3 bg-primary/5 rounded -mx-2 px-2 py-0.5">
                <span className="text-muted-foreground/50 w-6 text-right text-xs">
                  8
                </span>
                <span className="text-muted-foreground">
                  Synced to dashboard — 2h 45m today
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
