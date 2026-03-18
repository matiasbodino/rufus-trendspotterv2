import { NextRequest, NextResponse } from "next/server"
import { MOCK_TRENDS } from "@/lib/mock-data"
import { TrendStatus, Platform, Market } from "@/lib/types"

// In-memory store (replace with DB later)
let trends = [...MOCK_TRENDS]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform = searchParams.get("platform") as Platform | null
  const status = searchParams.get("status") as TrendStatus | null
  const market = searchParams.get("market") as Market | null
  const clientId = searchParams.get("clientId")

  let filtered = [...trends]

  if (platform) filtered = filtered.filter((t) => t.platform === platform)
  if (status) filtered = filtered.filter((t) => t.status === status)
  if (market) filtered = filtered.filter((t) => t.market === market)
  if (clientId)
    filtered = filtered.filter((t) =>
      t.clients.some((c) => c.id === clientId)
    )

  filtered.sort((a, b) => b.score - a.score)

  return NextResponse.json({ trends: filtered, total: filtered.length })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json(
      { error: "id and status required" },
      { status: 400 }
    )
  }

  const idx = trends.findIndex((t) => t.id === id)
  if (idx === -1) {
    return NextResponse.json({ error: "Trend not found" }, { status: 404 })
  }

  trends[idx] = { ...trends[idx], status }

  return NextResponse.json({ trend: trends[idx] })
}
