import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateBrief } from "@/lib/claude"

/**
 * Daily Creative Pack Generator
 * Picks the top 3 NEW trends, matches them with the best-fit client,
 * and pre-generates briefs so the creative team arrives to ready-to-use material.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get top 3 NEW trends by score from last 48h
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000)
    const topTrends = await prisma.trend.findMany({
      where: {
        status: "NEW",
        createdAt: { gte: since },
      },
      include: {
        trendClients: { include: { client: true } },
        briefs: true,
      },
      orderBy: { score: "desc" },
      take: 3,
    })

    if (topTrends.length === 0) {
      return NextResponse.json({ message: "No new trends to pack", packs: 0 })
    }

    // Get all active clients as fallback
    const allClients = await prisma.client.findMany({ where: { active: true } })

    const packs = []

    for (const trend of topTrends) {
      // Skip if brief already exists
      if (trend.briefs.length > 0) continue

      // Pick best client: first from fit, or first active client
      const fitClient = trend.trendClients[0]?.client || allClients[0]
      if (!fitClient) continue

      // Use recommended format or default to UGC
      const format = (trend.recommendedFormat as "ESTATICA" | "UGC" | "AD" | "VIDEO_ANIMADO") || "UGC"

      try {
        const briefContent = await generateBrief({
          trendName: trend.name,
          trendDescription: trend.description,
          trendManifestation: trend.manifestation,
          trendWhyNow: trend.whyNow,
          clientName: fitClient.name,
          clientCategory: fitClient.category,
          format,
        })

        // Save brief to DB
        await prisma.brief.create({
          data: {
            trendId: trend.id,
            clientId: fitClient.id,
            format,
            content: briefContent,
          },
        })

        packs.push({
          trend: trend.name,
          client: fitClient.name,
          format,
          score: trend.score,
        })

        // Rate limit
        await new Promise((r) => setTimeout(r, 2000))
      } catch (err) {
        console.error(`Failed to generate pack for "${trend.name}":`, err)
      }
    }

    return NextResponse.json({
      message: `Creative Pack generated: ${packs.length} briefs ready`,
      packs,
    })
  } catch (error) {
    console.error("Creative Pack cron error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
