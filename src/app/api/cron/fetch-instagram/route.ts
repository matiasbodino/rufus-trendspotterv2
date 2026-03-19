export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { fetchInstagramTrends } from "@/lib/fetchers/instagram"
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
    const items = await fetchInstagramTrends()
    console.log(`Fetched ${items.length} Instagram hashtags`)

    const results = []
    for (const item of items.slice(0, 5)) {
      const trend = await processSignal({
        id: item.id,
        title: `#${item.name}`,
        description: `Hashtag #${item.name} con ${item.mediaCount.toLocaleString()} publicaciones en Instagram`,
        platform: "instagram",
        metrics: {
          mediaCount: item.mediaCount,
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
    console.error("Instagram cron error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
