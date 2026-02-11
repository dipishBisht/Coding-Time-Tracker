import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Tracking, { ITracking } from "@/models/Tracking";
import User from "@/models/User";
import { withCors } from "@/lib/cors";

/**
 * GET /api/dashboard/:userId
 *
 * Query params:
 *   - days (optional): Number of days to analyze (default: 30, max: 365)
 *
 * Returns comprehensive dashboard statistics including:
 * - Total hours and days tracked
 * - Daily trend data (for line charts)
 * - Language breakdown (for pie/bar charts)
 * - Recent activity table
 * - Streaks and milestones
 * - Peak coding times
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // Validate userId
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      return withCors(
        NextResponse.json(
          { error: "Invalid userId parameter" },
          { status: 400 },
        ),
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");

    let days = 30; // default
    if (daysParam) {
      const parsed = parseInt(daysParam, 10);
      if (isNaN(parsed) || parsed < 1) {
        return withCors(
          NextResponse.json(
            { error: "days must be a positive number" },
            { status: 400 },
          ),
        );
      }
      days = Math.min(parsed, 365); // Cap at 365
    }

    // Connect to database
    await connectToDatabase();

    // Fetch user profile
    const user = await User.findOne({ userId }).select("name email createdAt");

    if (!user) {
      // User hasn't synced any data yet
      return withCors(
        NextResponse.json({
          userId,
          hasData: false,
          message:
            "No tracking data found for this user. Start coding with the extension installed!",
        }),
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    // Fetch tracking data
    const trackingData = await Tracking.find({
      userId,
      date: { $gte: startDateStr, $lte: endDateStr },
    })
      .sort({ date: 1 }) // Oldest first for chronological charts
      .lean();

    // If no data in range
    if (trackingData.length === 0) {
      return withCors(
        NextResponse.json({
          userId,
          userName: user.name,
          hasData: false,
          message: `No coding activity in the last ${days} days. Keep coding!`,
        }),
      );
    }

    // Calculate overview statistics
    const totalSeconds = trackingData.reduce(
      (sum, day) => sum + day.totalSeconds,
      0,
    );
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalDays = trackingData.length;
    const averageSecondsPerDay = Math.round(totalSeconds / totalDays);

    // Build daily trend chart data
    const dailyTrend = trackingData.map((day) => ({
      date: day.date,
      hours: parseFloat((day.totalSeconds / 3600).toFixed(2)),
      seconds: day.totalSeconds,
    }));

    // Calculate language breakdown
    const languageTotals = new Map<string, number>();

    trackingData.forEach((day) => {
      for (const [lang, seconds] of Object.entries(day.languages)) {
        languageTotals.set(
          lang,
          (languageTotals.get(lang) || 0) + (seconds as number),
        );
      }
    });

    // Convert to sorted array
    const languageBreakdown = Array.from(languageTotals.entries())
      .map(([language, seconds]) => ({
        language,
        seconds,
        hours: parseFloat((seconds / 3600).toFixed(2)),
        percentage: parseFloat(((seconds / totalSeconds) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.seconds - a.seconds); // Sort by time (most used first)

    // Recent activity (last 7 days)
    const recentActivity = trackingData
      .slice(-7) // Last 7 entries
      .reverse() // Newest first
      .map((day) => {
        const topLanguage = Object.entries(day.languages).sort(
          ([, a], [, b]) => (b as number) - (a as number),
        )[0];

        return {
          date: day.date,
          totalSeconds: day.totalSeconds,
          formattedTime: formatDuration(day.totalSeconds),
          topLanguage: topLanguage ? topLanguage[0] : "unknown",
          languageCount: Object.keys(day.languages).length,
        };
      });

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(trackingData);

    // Find peak coding day
    const peakDay = trackingData.reduce(
      (max, day) => (day.totalSeconds > max.totalSeconds ? day : max),
      trackingData[0],
    );

    // Calculate milestones
    const milestones = calculateMilestones(totalHours, totalDays);

    // Calculate day-of-week pattern
    const dayOfWeekPattern = calculateDayOfWeekPattern(trackingData);

    // Build comprehensive response
    return withCors(
      NextResponse.json({
        userId,
        userName: user.name || null,
        userEmail: user.email || null,
        joinDate: user.createdAt ? formatDate(new Date(user.createdAt)) : null,
        hasData: true,

        // Overview stats
        overview: {
          totalHours,
          totalMinutes,
          totalSeconds,
          totalDays,
          averageSecondsPerDay,
          averageHoursPerDay: parseFloat(
            (averageSecondsPerDay / 3600).toFixed(2),
          ),
          formattedTotal: `${totalHours}h ${totalMinutes}m`,
          formattedAverage: formatDuration(averageSecondsPerDay),
        },

        // Chart data
        charts: {
          dailyTrend, // For line chart
          languageBreakdown, // For pie/bar chart
          dayOfWeekPattern, // For heatmap/bar chart
        },

        // Recent activity
        recentActivity,

        // Achievements
        achievements: {
          currentStreak,
          longestStreak,
          peakDay: {
            date: peakDay.date,
            hours: parseFloat((peakDay.totalSeconds / 3600).toFixed(2)),
            formattedTime: formatDuration(peakDay.totalSeconds),
          },
          milestones,
        },

        // Meta
        dateRange: {
          start: startDateStr,
          end: endDateStr,
          days,
        },
      }),
    );
  } catch (error) {
    console.error("[API] Dashboard endpoint error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    );
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format seconds into human-readable duration
 */
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}

/**
 * Calculate current and longest coding streaks
 */
function calculateStreaks(trackingData: ITracking[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (trackingData.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Sort by date to ensure chronological order
  const sorted = [...trackingData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].date);
    const currDate = new Date(sorted[i].date);

    // Calculate day difference
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      tempStreak++;
    } else {
      // Streak broken
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak (from most recent day)
  const today = new Date();
  const lastTrackedDate = new Date(sorted[sorted.length - 1].date);
  const daysSinceLastTrack = Math.floor(
    (today.getTime() - lastTrackedDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceLastTrack <= 1) {
    // Current streak is active
    currentStreak = tempStreak;
  } else {
    // Streak is broken
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
}

/**
 * Calculate milestone achievements based on total hours and days
 */
function calculateMilestones(
  totalHours: number,
  totalDays: number,
): Array<{
  title: string;
  achieved: boolean;
  progress?: number;
  target?: number;
}> {
  const milestones = [
    {
      title: "First Hour",
      achieved: totalHours >= 1,
      progress: totalHours >= 1 ? 1 : totalHours,
      target: 1,
    },
    {
      title: "10 Hours Coded",
      achieved: totalHours >= 10,
      progress: Math.min(totalHours, 10),
      target: 10,
    },
    {
      title: "100 Hours Coded",
      achieved: totalHours >= 100,
      progress: Math.min(totalHours, 100),
      target: 100,
    },
    {
      title: "1000 Hours Coded",
      achieved: totalHours >= 1000,
      progress: Math.min(totalHours, 1000),
      target: 1000,
    },
    {
      title: "7-Day Streak",
      achieved: totalDays >= 7,
      progress: Math.min(totalDays, 7),
      target: 7,
    },
    {
      title: "30-Day Streak",
      achieved: totalDays >= 30,
      progress: Math.min(totalDays, 30),
      target: 30,
    },
  ];

  return milestones;
}

/**
 * Calculate average coding time per day of the week
 */
function calculateDayOfWeekPattern(trackingData: ITracking[]): Array<{
  day: string;
  dayNumber: number;
  averageSeconds: number;
  averageHours: number;
  totalDays: number;
}> {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayTotals = new Map<number, { total: number; count: number }>();

  // Initialize all days
  for (let i = 0; i < 7; i++) {
    dayTotals.set(i, { total: 0, count: 0 });
  }

  // Aggregate by day of week
  trackingData.forEach((day) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    const current = dayTotals.get(dayOfWeek)!;
    dayTotals.set(dayOfWeek, {
      total: current.total + day.totalSeconds,
      count: current.count + 1,
    });
  });

  // Calculate averages
  return Array.from(dayTotals.entries()).map(
    ([dayNumber, { total, count }]) => ({
      day: daysOfWeek[dayNumber],
      dayNumber,
      averageSeconds: count > 0 ? Math.round(total / count) : 0,
      averageHours:
        count > 0 ? parseFloat((total / count / 3600).toFixed(2)) : 0,
      totalDays: count,
    }),
  );
}
