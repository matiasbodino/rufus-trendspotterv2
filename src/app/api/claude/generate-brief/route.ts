import { NextRequest, NextResponse } from "next/server"
import { generateBrief } from "@/lib/claude"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      trendName,
      trendDescription,
      trendManifestation,
      trendWhyNow,
      clientName,
      clientCategory,
      format,
    } = body

    if (!trendName || !clientName || !format) {
      return NextResponse.json(
        { error: "trendName, clientName, and format are required" },
        { status: 400 }
      )
    }

    const brief = await generateBrief({
      trendName,
      trendDescription: trendDescription || "",
      trendManifestation: trendManifestation || "",
      trendWhyNow: trendWhyNow || "",
      clientName,
      clientCategory: clientCategory || "",
      format,
    })

    return NextResponse.json({ brief })
  } catch (error) {
    console.error("Generate brief error:", error)
    return NextResponse.json(
      { error: "Failed to generate brief" },
      { status: 500 }
    )
  }
}
