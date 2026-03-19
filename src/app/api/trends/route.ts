import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TrendCard, ClientFit, Platform, Market, ActivationWindow, BriefFormat } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform = searchParams.get("platform")
  const status = searchParams.get("status")
  const market = searchParams.get("market")
  const clientId = searchParams.get("clientId")
  const archived = searchParams.get("archived") === "true"
  const sort = searchParams.get("sort") || "score"

  try {
    const where: Record<string, unknown> = {}
    if (platform) where.platform = platform
    if (market) where.market = market
    if (clientId) {
      where.trendClients = { some: { clientId } }
    }

    if (archived) {
      // Show only archived trends
      where.status = "ARCHIVED"
    } else if (status) {
      where.status = status
    } else {
      // By default, exclude archived and discarded from feed
      where.status = { notIn: ["ARCHIVED", "DISCARDED"] }
    }

    // Sort options
    let orderBy: Record<string, string> = { score: "desc" }
    if (sort === "newest") orderBy = { createdAt: "desc" }
    if (sort === "urgent") orderBy = { activationWindow: "asc" }

    const dbTrends = await prisma.trend.findMany({
      where,
      include: {
        trendClients: {
          include: { client: true },
        },
      },
      orderBy,
    })

    const trends: TrendCard[] = dbTrends.map((t) => ({
      id: t.id,
      name: t.name,
      platform: t.platform as Platform,
      score: t.score,
      growthSpeed: t.growthSpeed,
      activationWindow: t.activationWindow as ActivationWindow,
      durability: (t as any).durability || "DAYS",
      categoryFit: t.categoryFit,
      description: t.description,
      manifestation: t.manifestation,
      examples: t.examples || "",
      whyNow: t.whyNow,
      recommendedFormat: t.recommendedFormat as BriefFormat,
      creativeAngle: (t as any).creativeAngle || null,
      tags: (t as any).tags || [],
      result: (t as any).result || null,
      resultBy: (t as any).resultBy || null,
      status: t.status as "NEW" | "EVALUATING" | "ACTIVATED" | "DISCARDED",
      statusChangedBy: (t as any).statusChangedBy || null,
      statusChangedAt: (t as any).statusChangedAt?.toISOString() || null,
      market: t.market as Market,
      clients: t.trendClients.map(
        (tc): ClientFit => ({
          id: tc.client.id,
          name: tc.client.name,
          category: tc.client.category,
          fitLevel: (tc as any).fitLevel || "MEDIUM",
          fitReason: (tc as any).fitReason || undefined,
        })
      ),
      createdAt: t.createdAt.toISOString(),
    }))

    return NextResponse.json({ trends, total: trends.length })
  } catch (error) {
    console.error("GET /api/trends error:", error)
    return NextResponse.json(
      { error: "Failed to fetch trends", details: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, result, resultBy, changedBy } = body

    if (!id) {
      return NextResponse.json(
        { error: "id required" },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (status) {
      data.status = status
      data.statusChangedBy = changedBy || null
      data.statusChangedAt = new Date()
    }
    if (result !== undefined) data.result = result
    if (resultBy) data.resultBy = resultBy

    const updated = await prisma.trend.update({
      where: { id },
      data,
      include: {
        trendClients: {
          include: { client: true },
        },
      },
    })

    return NextResponse.json({
      trend: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
      },
    })
  } catch (error) {
    console.error("PATCH /api/trends error:", error)
    return NextResponse.json(
      { error: "Failed to update trend" },
      { status: 500 }
    )
  }
}
