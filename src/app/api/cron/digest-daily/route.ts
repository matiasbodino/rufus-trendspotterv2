export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { sendDailyDigest } from "@/lib/slack"
import { prisma } from "@/lib/prisma"
import { TrendCard, Platform, Market, ActivationWindow, BriefFormat, ClientFit } from "@/lib/types"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const dbTrends = await prisma.trend.findMany({
      where: {
        createdAt: { gte: since },
      },
      include: {
        trendClients: {
          include: { client: true },
        },
      },
      orderBy: { score: "desc" },
      take: 5,
    })

    const topTrends: TrendCard[] = dbTrends.map((t) => ({
      id: t.id,
      name: t.name,
      platform: t.platform as Platform,
      score: t.score,
      growthSpeed: t.growthSpeed,
      activationWindow: t.activationWindow as ActivationWindow,
      categoryFit: t.categoryFit,
      description: t.description,
      manifestation: t.manifestation,
      examples: t.examples || "",
      whyNow: t.whyNow,
      recommendedFormat: t.recommendedFormat as BriefFormat,
      status: t.status as "NEW" | "EVALUATING" | "ACTIVATED" | "DISCARDED",
      market: t.market as Market,
      clients: t.trendClients.map(
        (tc): ClientFit => ({
          id: tc.client.id,
          name: tc.client.name,
          category: tc.client.category,
        })
      ),
      createdAt: t.createdAt.toISOString(),
    }))

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
