"use client";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const dailyData = [
  { date: "Feb 1", hours: 3.2 },
  { date: "Feb 2", hours: 4.1 },
  { date: "Feb 3", hours: 2.8 },
  { date: "Feb 4", hours: 5.0 },
  { date: "Feb 5", hours: 3.5 },
  { date: "Feb 6", hours: 4.8 },
  { date: "Feb 7", hours: 6.2 },
];

const languageData = [
  { name: "TypeScript", value: 42, color: "hsl(239 84% 67%)" },
  { name: "Python", value: 25, color: "hsl(263 70% 76%)" },
  { name: "CSS", value: 15, color: "hsl(200 70% 60%)" },
  { name: "Go", value: 10, color: "hsl(160 60% 50%)" },
  { name: "Other", value: 8, color: "hsl(220 13% 80%)" },
];

export default function StatsPreview() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See your stats come to life
          </h2>
          <p className="text-lg text-muted-foreground">
            Beautiful charts that visualize your coding activity.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto"
        >
          {/* Bar chart */}
          <div className="rounded-xl border bg-card p-6 card-elevated">
            <h3 className="font-semibold mb-1">Daily Activity</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Hours coded this week
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid hsl(220 13% 91%)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar
                  dataKey="hours"
                  fill="hsl(239 84% 67%)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="rounded-xl border bg-card p-6 card-elevated">
            <h3 className="font-semibold mb-1">Language Breakdown</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Top languages by time
            </p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(0 0% 100%)"
                  >
                    {languageData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5">
                {languageData.map((lang) => (
                  <div
                    key={lang.name}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: lang.color }}
                    />
                    <span className="text-muted-foreground">{lang.name}</span>
                    <span className="font-medium ml-auto">{lang.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
