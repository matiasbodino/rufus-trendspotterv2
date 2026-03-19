import { NextRequest, NextResponse } from "next/server"
import { fetchRedditHot } from "@/lib/fetchers/reddit-public"
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
    const posts = await fetchRedditHot("ARG")
    console.log(`Fetched ${posts.length} Reddit hot posts`)

    const results = []
    for (const post of posts.slice(0, 8)) {
      const trend = await processSignal({
        id: post.id,
        title: post.title,
        description: post.description,
        platform: "reddit",
        metrics: {
          score: post.score,
          comments: post.comments,
          subreddit: post.subreddit,
        },
        market: "ARG",
        url: post.permalink,
      })

      if (trend) results.push(trend)
      await new Promise((r) => setTimeout(r, 1500))
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
