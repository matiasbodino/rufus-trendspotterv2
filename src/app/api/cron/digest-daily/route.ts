import { NextRequest, NextResponse } from "next/server"
import { sendDailyDigest } from "@/lib/slack"
import { MOCK_TRENDS } from "@/lib/mock-data"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // TODO: Replace with DB query for real trends from last 24h
    // For now uses mock data sorted by score
    const topTrends = [...MOCK_TRENDS]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    const sent = await sendDailyDigest(topTrends)

    return NextResponse.json({
      sent,
      trendCount: topTrends.length,
      trends: topTrends.map((t) => t.name),
    })
  } catch (error) {
    console.error("Digest cron error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
