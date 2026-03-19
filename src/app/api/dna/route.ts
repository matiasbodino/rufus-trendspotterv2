import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const dbClients = await prisma.client.findMany({
      where: { active: true },
      include: {
        trendClients: {
          include: {
            trend: {
              include: { briefs: true },
            },
          },
        },
      },
    })

    const clients = dbClients.map((client) => {
      const trends = client.trendClients.map((tc) => tc.trend)
      const activated = trends.filter((t) => t.status === "ACTIVATED")
      const discarded = trends.filter((t) => t.status === "DISCARDED")
      const totalDecided = activated.length + discarded.length

      // Format counts from briefs
      const formatCounts: Record<string, number> = {}
      trends.forEach((t) => {
        t.briefs.forEach((b) => {
          formatCounts[b.format] = (formatCounts[b.format] || 0) + 1
        })
      })
      const topFormats = Object.entries(formatCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([format, count]) => ({ format, count }))

      // Tag counts from activated trends
      const tagCounts: Record<string, number> = {}
      activated.forEach((t) => {
        const tags = (t as any).tags || []
        tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }))

      // Best performing (highest score activated with result)
      const withResults = activated.filter((t) => (t as any).result)
      const best = withResults.length > 0
        ? withResults.sort((a, b) => b.score - a.score)[0]
        : activated.sort((a, b) => b.score - a.score)[0] || null

      return {
        id: client.id,
        name: client.name,
        category: client.category,
        totalTrends: trends.length,
        activatedTrends: activated.length,
        avgScore: trends.length > 0
          ? trends.reduce((sum, t) => sum + t.score, 0) / trends.length
          : 0,
        topFormats,
        topTags,
        bestPerforming: best
          ? { name: best.name, score: best.score, result: (best as any).result || null }
          : null,
        hitRate: totalDecided > 0 ? Math.round((activated.length / totalDecided) * 100) : 0,
      }
    })

    // Only return clients that have at least 1 trend associated
    const active = clients.filter((c) => c.totalTrends > 0)

    return NextResponse.json({ clients: active })
  } catch (error) {
    console.error("DNA error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
