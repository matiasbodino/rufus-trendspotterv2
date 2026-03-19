import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ clients })
  } catch (error) {
    console.error("GET /api/clients error:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const client = await prisma.client.create({
      data: {
        name: body.name,
        category: body.category || "",
        market: body.market || "ARG",
        slackChannelId: body.slackChannelId || null,
        audienceAge: body.audienceAge || null,
        audienceInterests: body.audienceInterests || null,
        toneOfVoice: body.toneOfVoice || null,
        brandTerritory: body.brandTerritory || null,
        prohibitedTopics: body.prohibitedTopics || null,
        contentExamples: body.contentExamples || null,
        activePlatforms: body.activePlatforms || [],
        brandContext: body.brandContext || null,
      },
    })
    return NextResponse.json({ client })
  } catch (error) {
    console.error("POST /api/clients error:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const client = await prisma.client.update({
      where: { id },
      data,
    })
    return NextResponse.json({ client })
  } catch (error) {
    console.error("PUT /api/clients error:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}
