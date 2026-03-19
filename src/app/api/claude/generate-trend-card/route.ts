export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { generateTrendCard } from "@/lib/claude"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, platform, metrics, market, qualification } = body

    if (!title || !platform || !qualification) {
      return NextResponse.json(
        { error: "title, platform, and qualification are required" },
        { status: 400 }
      )
    }

    const result = await generateTrendCard({
      title,
      description: description || "",
      platform,
      metrics: metrics || {},
      market: market || "ARG",
      qualification,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Generate trend card error:", error)
    return NextResponse.json(
      { error: "Failed to generate trend card" },
      { status: 500 }
    )
  }
}
