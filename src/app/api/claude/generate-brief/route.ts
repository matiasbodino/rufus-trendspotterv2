import { NextRequest, NextResponse } from "next/server"
import { generateBrief } from "@/lib/claude"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      trendId,
      trendName,
      trendDescription,
      trendManifestation,
      trendWhyNow,
      clientId,
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

    // Save brief to DB if trendId provided
    if (trendId) {
      try {
        await prisma.brief.create({
          data: {
            trendId,
            clientId: clientId || null,
            format,
            content: brief,
          },
        })
      } catch (err) {
        console.error("Failed to save brief to DB:", err)
      }
    }

    return NextResponse.json({ brief })
  } catch (error) {
    console.error("Generate brief error:", error)
    return NextResponse.json(
      { error: "Failed to generate brief" },
      { status: 500 }
    )
  }
}
