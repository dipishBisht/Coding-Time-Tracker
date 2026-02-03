import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Tracking from "@/models/Tracking";
import User from "@/models/User";

/**
 * GET /api/stats/:userId
 *
 * Query params:
 *   - startDate (optional): "YYYY-MM-DD"
 *   - endDate (optional): "YYYY-MM-DD"
 *   - limit (optional): number of days (default: 30, max: 365)
 *
 * Returns: {
 *   userId: string,
 *   userName?: string,
 *   data: [
 *     { date: "2026-02-01", totalSeconds: 14400, languages: {...}, formattedDuration: "4h" },
 *     ...
 *   ],
 *   totalSeconds: number,
 *   totalDays: number,
 *   averageSecondsPerDay: number
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // Validate userId
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid userId parameter" },
        { status: 400 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limitParam = searchParams.get("limit");

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (startDate && !dateRegex.test(startDate)) {
      return NextResponse.json(
        { error: "startDate must be in YYYY-MM-DD format" },
        { status: 400 },
      );
    }

    if (endDate && !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: "endDate must be in YYYY-MM-DD format" },
        { status: 400 },
      );
    }

    // Validate limit
    let limit = 30;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (isNaN(parsed) || parsed < 1) {
        return NextResponse.json(
          { error: "limit must be a positive number" },
          { status: 400 },
        );
      }
      limit = Math.min(parsed, 365);
    }

    // Connect to database
    await connectToDatabase();

    // Check if user exists
    const user = await User.findOne({ userId }).select("name email");

    if (!user) {
      // User doesn't exist yet (hasn't synced any data)
      return NextResponse.json({
        userId,
        data: [],
        totalSeconds: 0,
        totalDays: 0,
        averageSecondsPerDay: 0,
        message: "No data found for this user",
      });
    }

    // Build Mongoose query
    const query: any = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    //  Fetch tracking data
    const trackingDocs = await Tracking.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .select("-_id -__v")
      .lean();

    // Calculate aggregates
    const totalSeconds = trackingDocs.reduce(
      (sum, doc) => sum + doc.totalSeconds,
      0,
    );
    const totalDays = trackingDocs.length;
    const averageSecondsPerDay =
      totalDays > 0 ? Math.round(totalSeconds / totalDays) : 0;

    // Format response
    const data = trackingDocs.map((doc) => ({
      date: doc.date,
      totalSeconds: doc.totalSeconds,
      languages: doc.languages,
      formattedDuration: formatDuration(doc.totalSeconds),
    }));

    return NextResponse.json({
      userId,
      userName: user.name,
      data,
      totalSeconds,
      totalDays,
      averageSecondsPerDay,
      formattedAverage: formatDuration(averageSecondsPerDay),
    });
  } catch (error) {
    console.error("[API]  Stats endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper Functions

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
