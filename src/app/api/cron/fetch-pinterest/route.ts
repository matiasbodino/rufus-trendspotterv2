import { NextRequest, NextResponse } from "next/server"
import { fetchPinterestTrends } from "@/lib/fetchers/pinterest"
import { processSignal } from "@/lib/pipeline"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const items = await fetchPinterestTrends("ARG")
    console.log(`Fetched ${items.length} Pinterest trends`)

    const results = []
    for (const item of items.slice(0, 5)) {
      const trend = await processSignal({
        id: item.id,
        title: item.keyword,
        description: `Keyword "${item.keyword}" creciendo ${item.percentChange}% en Pinterest Argentina`,
        platform: "pinterest",
        metrics: {
          percentChange: item.percentChange,
        },
        market: "ARG",
        url: item.url,
      })

      if (trend) results.push(trend)
      await new Promise((r) => setTimeout(r, 1000))
    }

    return NextResponse.json({
      fetched: items.length,
      qualified: results.length,
      trends: results.map((t) => ({ name: t.name, score: t.score })),
    })
  } catch (error) {
    console.error("Pinterest cron error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
