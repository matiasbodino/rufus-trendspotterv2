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

  try {
    const where: Record<string, unknown> = {}
    if (platform) where.platform = platform
    if (status) where.status = status
    if (market) where.market = market
    if (clientId) {
      where.trendClients = { some: { clientId } }
    }

    const dbTrends = await prisma.trend.findMany({
      where,
      include: {
        trendClients: {
          include: { client: true },
        },
      },
      orderBy: { score: "desc" },
    })

    const trends: TrendCard[] = dbTrends.map((t) => ({
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
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status required" },
        { status: 400 }
      )
    }

    const updated = await prisma.trend.update({
      where: { id },
      data: { status },
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
