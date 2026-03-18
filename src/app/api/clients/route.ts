import { NextResponse } from "next/server"
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
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}
