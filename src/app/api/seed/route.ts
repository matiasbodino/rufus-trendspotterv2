export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CLIENTS = [
  { name: "MercadoLibre", category: "ecommerce", market: "ARG" },
  { name: "Danone", category: "food_bev", market: "ARG" },
  { name: "Disney", category: "entretenimiento", market: "ARG" },
  { name: "Rappi", category: "delivery", market: "ARG" },
  { name: "Despegar", category: "travel", market: "ARG" },
  { name: "PedidosYa", category: "delivery", market: "ARG" },
  { name: "CCU", category: "food_bev", market: "ARG" },
  { name: "NaranjaX", category: "fintech", market: "ARG" },
]

export async function POST() {
  try {
    const results = []

    for (const client of CLIENTS) {
      const created = await prisma.client.upsert({
        where: { id: client.name.toLowerCase().replace(/\s/g, "-") },
        update: { name: client.name, category: client.category, market: client.market },
        create: {
          id: client.name.toLowerCase().replace(/\s/g, "-"),
          name: client.name,
          category: client.category,
          market: client.market,
          active: true,
        },
      })
      results.push(created)
    }

    return NextResponse.json({
      message: `${results.length} clients seeded`,
      clients: results,
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "Failed to seed clients", details: String(error) },
      { status: 500 }
    )
  }
}
