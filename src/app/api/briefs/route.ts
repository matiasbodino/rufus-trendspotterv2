import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const today = searchParams.get("today")

  try {
    const where: Record<string, unknown> = {}

    if (today === "true") {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      where.createdAt = { gte: startOfDay }
    }

    const briefs = await prisma.brief.findMany({
      where,
      include: {
        trend: true,
        client: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const packs = briefs.map((b) => ({
      id: b.id,
      trend: {
        name: b.trend.name,
        score: b.trend.score,
        description: b.trend.description,
        creativeAngle: (b.trend as any).creativeAngle || null,
        platform: b.trend.platform,
      },
      client: b.client
        ? { name: b.client.name, category: b.client.category }
        : { name: "General", category: "general" },
      format: b.format,
      content: b.content,
      createdAt: b.createdAt.toISOString(),
    }))

    return NextResponse.json({ packs, total: packs.length })
  } catch (error) {
    console.error("GET /api/briefs error:", error)
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 })
  }
}
