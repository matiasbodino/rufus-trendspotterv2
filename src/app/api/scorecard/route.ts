import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // This week's trends
    const thisWeekTrends = await prisma.trend.findMany({
      where: { createdAt: { gte: oneWeekAgo } },
    })

    // Last week's trends
    const lastWeekActivated = await prisma.trend.count({
      where: {
        status: "ACTIVATED",
        createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
      },
    })

    // This week activated
    const thisWeekActivated = thisWeekTrends.filter((t) => t.status === "ACTIVATED")
    const thisWeekDiscarded = thisWeekTrends.filter((t) => t.status === "DISCARDED")

    // Briefs this week
    const briefCount = await prisma.brief.count({
      where: { createdAt: { gte: oneWeekAgo } },
    })

    // Hit rate
    const totalDecided = thisWeekActivated.length + thisWeekDiscarded.length
    const hitRate = totalDecided > 0 ? Math.round((thisWeekActivated.length / totalDecided) * 100) : 0

    // Avg score
    const avgScore = thisWeekTrends.length > 0
      ? thisWeekTrends.reduce((sum, t) => sum + t.score, 0) / thisWeekTrends.length
      : 0

    // Top platform
    const platformCounts: Record<string, number> = {}
    thisWeekTrends.forEach((t) => {
      platformCounts[t.platform] = (platformCounts[t.platform] || 0) + 1
    })
    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ""

    const platformLabels: Record<string, string> = {
      tiktok: "TikTok", instagram: "Instagram", pinterest: "Pinterest",
      google_trends: "Google Trends", x: "X", reddit: "Reddit",
    }

    // Top tags
    const tagCounts: Record<string, number> = {}
    thisWeekTrends.forEach((t) => {
      const tags = (t as any).tags || []
      tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }))

    // Activated trends with results
    const activatedTrends = thisWeekActivated.map((t) => ({
      name: t.name,
      result: (t as any).result || null,
      score: t.score,
    }))

    return NextResponse.json({
      totalDetected: thisWeekTrends.length,
      totalActivated: thisWeekActivated.length,
      totalDiscarded: thisWeekDiscarded.length,
      totalBriefs: briefCount,
      hitRate,
      avgScore,
      topPlatform: platformLabels[topPlatform] || topPlatform,
      topTags,
      activatedTrends,
      weeklyComparison: {
        thisWeek: thisWeekActivated.length,
        lastWeek: lastWeekActivated,
      },
    })
  } catch (error) {
    console.error("Scorecard error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
