import { NextRequest, NextResponse } from "next/server"
import { fetchRedditTrending } from "@/lib/fetchers/reddit"
import { processSignal } from "@/lib/pipeline"

export async function GET(req: NextRequest) {
  // Verify cron secret in production
  const authHeader = req.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const posts = await fetchRedditTrending("ARG")
    console.log(`Fetched ${posts.length} Reddit posts`)

    const results = []
    for (const post of posts.slice(0, 5)) {
      const trend = await processSignal({
        id: post.id,
        title: post.title,
        description: post.selftext,
        platform: "reddit",
        metrics: {
          score: post.score,
          upvote_ratio: post.upvote_ratio,
          num_comments: post.num_comments,
        },
        market: "ARG",
        url: post.url,
      })

      if (trend) results.push(trend)

      // Rate limit Claude calls
      await new Promise((r) => setTimeout(r, 1000))
    }

    return NextResponse.json({
      fetched: posts.length,
      qualified: results.length,
      trends: results.map((t) => ({ name: t.name, score: t.score })),
    })
  } catch (error) {
    console.error("Reddit cron error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
