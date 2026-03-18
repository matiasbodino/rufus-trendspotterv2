import { NextRequest, NextResponse } from "next/server"
import { qualifySignal } from "@/lib/claude"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, platform, metrics, market } = body

    if (!title || !platform) {
      return NextResponse.json(
        { error: "title and platform are required" },
        { status: 400 }
      )
    }

    const result = await qualifySignal({
      title,
      description: description || "",
      platform,
      metrics: metrics || {},
      market: market || "ARG",
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Qualify error:", error)
    return NextResponse.json(
      { error: "Failed to qualify signal" },
      { status: 500 }
    )
  }
}
