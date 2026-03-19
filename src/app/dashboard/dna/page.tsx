"use client"

import { useState, useEffect } from "react"
import { Dna, Loader2, TrendingUp } from "lucide-react"

interface ClientDNA {
  id: string
  name: string
  category: string
  totalTrends: number
  activatedTrends: number
  avgScore: number
  topFormats: { format: string; count: number }[]
  topTags: { tag: string; count: number }[]
  bestPerforming: { name: string; score: number; result: string | null } | null
  hitRate: number
}

export default function DNAPage() {
  const [clients, setClients] = useState<ClientDNA[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dna")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-rufus-purple animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Dna className="w-6 h-6 text-rufus-purple" />
          Trend DNA
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Perfil de qué tipo de tendencias funcionan mejor para cada cliente
        </p>
      </div>

      {clients.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          Activá tendencias y guardá resultados para que el Trend DNA se construya.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-rufus-card border border-rufus-border rounded-xl p-5">
            {/* Client header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{client.name}</h3>
                <span className="text-xs text-gray-500">{client.category}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                client.hitRate >= 50 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
              }`}>
                <span className="text-lg font-bold leading-none">{client.hitRate}%</span>
                <span className="text-[8px] uppercase opacity-70">hit rate</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <span className="text-lg font-bold text-white">{client.totalTrends}</span>
                <span className="text-[10px] text-gray-500 block uppercase">Asignadas</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-green-400">{client.activatedTrends}</span>
                <span className="text-[10px] text-gray-500 block uppercase">Activadas</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-yellow-400">{client.avgScore.toFixed(1)}</span>
                <span className="text-[10px] text-gray-500 block uppercase">Score prom</span>
              </div>
            </div>

            {/* What works */}
            {client.topFormats.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] text-gray-500 uppercase block mb-1">Formatos que funcionan</span>
                <div className="flex gap-1.5">
                  {client.topFormats.map((f) => (
                    <span key={f.format} className="text-xs bg-rufus-purple/15 text-rufus-purple-light px-2 py-0.5 rounded">
                      {f.format} ({f.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {client.topTags.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] text-gray-500 uppercase block mb-1">Tags con mejor resultado</span>
                <div className="flex flex-wrap gap-1">
                  {client.topTags.map((t) => (
                    <span key={t.tag} className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">
                      #{t.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Best performing */}
            {client.bestPerforming && (
              <div className="mt-3 pt-3 border-t border-rufus-border">
                <span className="text-[10px] text-gray-500 uppercase block mb-1">Mejor resultado</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-white">{client.bestPerforming.name}</span>
                </div>
                {client.bestPerforming.result && (
                  <p className="text-xs text-gray-500 mt-1 ml-5">📊 {client.bestPerforming.result}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
