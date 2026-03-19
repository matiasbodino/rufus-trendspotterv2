"use client"

import { useState, useEffect } from "react"
import { Sparkles, Loader2, Copy, Check, RefreshCw } from "lucide-react"

interface Pack {
  id: string
  trend: { name: string; score: number; description: string; creativeAngle: string | null; platform: string }
  client: { name: string; category: string }
  format: string
  content: string
  createdAt: string
}

export default function CreativePackPage() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchPacks()
  }, [])

  const fetchPacks = async () => {
    try {
      const res = await fetch("/api/briefs?today=true")
      const data = await res.json()
      setPacks(data.packs || [])
    } catch {
      setPacks([])
    } finally {
      setLoading(false)
    }
  }

  const generatePack = async () => {
    setGenerating(true)
    try {
      await fetch("/api/cron/creative-pack")
      await fetchPacks()
    } catch {}
    setGenerating(false)
  }

  const copyBrief = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-rufus-purple" />
            Creative Pack
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {today} — Briefs pre-generados listos para producción
          </p>
        </div>
        <button
          onClick={generatePack}
          disabled={generating}
          className="bg-rufus-purple hover:bg-rufus-purple-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
          ) : (
            <><RefreshCw className="w-4 h-4" /> Generar Pack</>
          )}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-rufus-purple animate-spin" />
        </div>
      )}

      {!loading && packs.length === 0 && (
        <div className="text-center py-20">
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No hay Creative Pack generado hoy todavía.</p>
          <button
            onClick={generatePack}
            disabled={generating}
            className="bg-rufus-purple hover:bg-rufus-purple-dark text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            Generar ahora
          </button>
        </div>
      )}

      {!loading && packs.length > 0 && (
        <div className="space-y-6">
          {packs.map((pack, i) => (
            <div key={pack.id} className="bg-rufus-card border border-rufus-border rounded-xl overflow-hidden">
              {/* Pack header */}
              <div className="bg-gradient-to-r from-rufus-purple/20 to-transparent p-5 border-b border-rufus-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-rufus-purple/30 text-rufus-purple-light px-2 py-0.5 rounded-full font-bold">
                        #{i + 1}
                      </span>
                      <span className="text-xs text-gray-500 uppercase">{pack.trend.platform}</span>
                      <span className={`text-xs font-bold ${
                        pack.trend.score >= 8 ? "text-green-400" : pack.trend.score >= 6 ? "text-yellow-400" : "text-gray-400"
                      }`}>
                        Score {pack.trend.score.toFixed(1)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{pack.trend.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{pack.trend.description}</p>
                    {pack.trend.creativeAngle && (
                      <p className="text-sm text-rufus-purple-light italic mt-2">💡 {pack.trend.creativeAngle}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className="text-xs text-gray-500 block">{pack.client.name}</span>
                    <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded mt-1 inline-block">{pack.format}</span>
                  </div>
                </div>
              </div>

              {/* Brief content */}
              <div className="p-5">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-80 overflow-y-auto">
                  {pack.content}
                </pre>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-rufus-border">
                  <button
                    onClick={() => copyBrief(pack.id, pack.content)}
                    className="text-xs text-rufus-purple-light hover:text-rufus-purple transition-colors flex items-center gap-1"
                  >
                    {copiedId === pack.id ? (
                      <><Check className="w-3.5 h-3.5" /> Copiado</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copiar brief</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
