import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Add/remove client fit for a trend
export async function POST(req: NextRequest) {
  try {
    const { trendId, clientId, fitLevel, fitReason, addedBy } = await req.json()
    if (!trendId || !clientId) {
      return NextResponse.json({ error: "trendId and clientId required" }, { status: 400 })
    }

    const trendClient = await prisma.trendClient.upsert({
      where: { trendId_clientId: { trendId, clientId } },
      create: {
        trendId,
        clientId,
        fitLevel: fitLevel || "MEDIUM",
        fitReason: fitReason || null,
        addedBy: addedBy || "manual",
      },
      update: {
        fitLevel: fitLevel || "MEDIUM",
        fitReason: fitReason || undefined,
      },
      include: { client: true },
    })

    return NextResponse.json({ trendClient })
  } catch (error) {
    console.error("POST /api/trends/fit error:", error)
    return NextResponse.json({ error: "Failed to update fit" }, { status: 500 })
  }
}

// Remove client fit
export async function DELETE(req: NextRequest) {
  try {
    const { trendId, clientId } = await req.json()
    if (!trendId || !clientId) {
      return NextResponse.json({ error: "trendId and clientId required" }, { status: 400 })
    }

    await prisma.trendClient.delete({
      where: { trendId_clientId: { trendId, clientId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/trends/fit error:", error)
    return NextResponse.json({ error: "Failed to remove fit" }, { status: 500 })
  }
}
