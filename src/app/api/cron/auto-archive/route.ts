export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()
    let archived = 0

    // URGENTE → archive after 48hrs
    const urgentCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const urgentResult = await prisma.trend.updateMany({
      where: {
        activationWindow: "URGENTE",
        status: { in: ["NEW", "EVALUATING"] },
        createdAt: { lt: urgentCutoff },
      },
      data: {
        status: "ARCHIVED",
        statusChangedBy: "auto-archive",
        statusChangedAt: now,
      },
    })
    archived += urgentResult.count

    // NORMAL → archive after 7 days
    const normalCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const normalResult = await prisma.trend.updateMany({
      where: {
        activationWindow: "NORMAL",
        status: { in: ["NEW", "EVALUATING"] },
        createdAt: { lt: normalCutoff },
      },
      data: {
        status: "ARCHIVED",
        statusChangedBy: "auto-archive",
        statusChangedAt: now,
      },
    })
    archived += normalResult.count

    // PUEDE ESPERAR → archive after 14 days
    const waitCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const waitResult = await prisma.trend.updateMany({
      where: {
        activationWindow: "PUEDE ESPERAR",
        status: { in: ["NEW", "EVALUATING"] },
        createdAt: { lt: waitCutoff },
      },
      data: {
        status: "ARCHIVED",
        statusChangedBy: "auto-archive",
        statusChangedAt: now,
      },
    })
    archived += waitResult.count

    return NextResponse.json({
      archived,
      details: {
        urgente: urgentResult.count,
        normal: normalResult.count,
        puedeEsperar: waitResult.count,
      },
    })
  } catch (error) {
    console.error("Auto-archive error:", error)
    return NextResponse.json({ error: "Failed to auto-archive" }, { status: 500 })
  }
}
