'use client';
import { motion } from "motion/react";
import { Timer, Code2, Lock } from "lucide-react";

const features = [
  {
    icon: Timer,
    title: "Automatic Tracking",
    description: "Detects when you're coding. Pauses when idle. Zero configuration required.",
  },
  {
    icon: Code2,
    title: "Language Breakdown",
    description: "See exactly how much time you spend in TypeScript, Python, CSS, and more.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Your code stays private. Only time and language data is tracked. Nothing else.",
  },
];

export default function Features() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to understand your coding habits
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, powerful, and designed to stay out of your way.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl border bg-card p-8 card-elevated group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
