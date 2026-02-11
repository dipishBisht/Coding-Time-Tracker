import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import Tracking from "@/models/Tracking";
import { withCors } from "@/lib/cors";

/**
 * POST /api/track
 *
 * Body: {
 *   userId: string,
 *   date: string,
 *   totalSeconds: number,
 *   languages: { typescript: 1800, javascript: 900 }
 * }
 *
 * Headers: {
 *   Authorization: "Bearer <token>"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Extract and validate token
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return withCors(
        NextResponse.json(
          { error: "Missing or invalid Authorization header" },
          { status: 401 },
        ),
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.length < 16) {
      return withCors(
        NextResponse.json({ error: "Invalid token format" }, { status: 401 }),
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return withCors(
        NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 },
        ),
      );
    }

    const { userId, date, totalSeconds, languages } = body;

    // Validate required fields
    if (!userId || typeof userId !== "string") {
      return withCors(
        NextResponse.json(
          { error: "userId is required and must be a string" },
          { status: 400 },
        ),
      );
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return withCors(
        NextResponse.json(
          { error: "date is required and must be in YYYY-MM-DD format" },
          { status: 400 },
        ),
      );
    }

    if (typeof totalSeconds !== "number" || totalSeconds < 0) {
      return withCors(
        NextResponse.json(
          { error: "totalSeconds must be a non-negative number" },
          { status: 400 },
        ),
      );
    }

    if (!languages || typeof languages !== "object") {
      return withCors(
        NextResponse.json(
          { error: "languages is required and must be an object" },
          { status: 400 },
        ),
      );
    }

    // Validate language seconds
    for (const [lang, seconds] of Object.entries(languages)) {
      if (typeof seconds !== "number" || seconds < 0) {
        return withCors(
          NextResponse.json(
            { error: `Invalid seconds value for language: ${lang}` },
            { status: 400 },
          ),
        );
      }
    }

    // Connect to database
    await connectToDatabase();

    // Verify user and token
    let user = await User.findOne({ userId, token });

    if (!user) {
      // First-time user OR invalid token
      // Check if userId exists with different token
      const existingUser = await User.findOne({ userId });

      if (existingUser) {
        // User exists but token doesn't match
        return withCors(
          NextResponse.json(
            { error: "Invalid token for this user" },
            { status: 403 },
          ),
        );
      }

      // Register new user
      user = await User.create({
        userId,
        token,
      });

      console.log(`[API] Registered new user: ${userId}`);
    }

    // Merge tracking data
    const tracking = await Tracking.mergeTrackingData(
      userId,
      date,
      totalSeconds,
      languages,
    );

    console.log(
      `[API] Synced ${userId} / ${date}: +${totalSeconds}s (total: ${tracking.totalSeconds}s)`,
    );

    // Return success response
    return withCors(
      NextResponse.json({
        success: true,
        userId: tracking.userId,
        date: tracking.date,
        totalSeconds: tracking.totalSeconds,
        languages:
          tracking.languages instanceof Map
            ? Object.fromEntries(tracking.languages)
            : tracking.languages,
        formattedDuration: tracking.formatDuration(),
      }),
    );
  } catch (error) {
    console.error("[API] Track endpoint error:", error);

    // Mongoose validation errors
    if (error instanceof Error && error.name === "ValidationError") {
      return withCors(
        NextResponse.json(
          { error: "Validation error", details: error.message },
          { status: 400 },
        ),
      );
    }

    // Duplicate key error (shouldn't happen with mergeTrackingData, but just in case)
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return withCors(
        NextResponse.json(
          { error: "Duplicate entry detected" },
          { status: 409 },
        ),
      );
    }

    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    );
  }
}
