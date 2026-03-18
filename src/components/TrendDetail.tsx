"use client"

import { useState } from "react"
import {
  TrendCard,
  PLATFORM_LABELS,
  STATUS_CONFIG,
  WINDOW_CONFIG,
  FORMAT_LABELS,
  BriefFormat,
  TrendStatus,
} from "@/lib/types"
import {
  X,
  TrendingUp,
  Clock,
  Users,
  FileText,
  Sparkles,
  ChevronDown,
} from "lucide-react"

interface TrendDetailProps {
  trend: TrendCard
  onClose: () => void
  onStatusChange: (trendId: string, status: TrendStatus) => void
}

export default function TrendDetail({
  trend,
  onClose,
  onStatusChange,
}: TrendDetailProps) {
  const [generating, setGenerating] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<BriefFormat | null>(
    trend.recommendedFormat
  )
  const [brief, setBrief] = useState<string | null>(null)
  const [showFormatDropdown, setShowFormatDropdown] = useState(false)

  const statusCfg = STATUS_CONFIG[trend.status]
  const windowCfg = WINDOW_CONFIG[trend.activationWindow]

  const [selectedClient, setSelectedClient] = useState(
    trend.clients[0] || null
  )

  const handleGenerateBrief = async () => {
    if (!selectedFormat || !selectedClient) return
    setGenerating(true)
    setBrief(null)

    try {
      const res = await fetch("/api/claude/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trendName: trend.name,
          trendDescription: trend.description,
          trendManifestation: trend.manifestation,
          trendWhyNow: trend.whyNow,
          clientName: selectedClient.name,
          clientCategory: selectedClient.category,
          format: selectedFormat,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBrief(data.brief)
      } else {
        // Fallback to mock
        setBrief(getMockBrief(trend, selectedFormat))
      }
    } catch {
      setBrief(getMockBrief(trend, selectedFormat))
    }

    setGenerating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-rufus-bg border-l border-rufus-border overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-rufus-bg/95 backdrop-blur-sm border-b border-rufus-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.color}`}>
              {statusCfg.emoji} {statusCfg.label}
            </span>
            <span className="text-xs text-gray-500">
              {PLATFORM_LABELS[trend.platform]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Title + Score */}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {trend.name}
              </h2>
              <p className="text-gray-400">{trend.description}</p>
            </div>
            <div
              className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                trend.score >= 8
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              <span className="text-2xl font-bold leading-none">
                {trend.score.toFixed(1)}
              </span>
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                score
              </span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: TrendingUp,
                label: "Crecimiento",
                value: trend.growthSpeed,
              },
              {
                icon: Clock,
                label: "Ventana",
                value: null,
                text: windowCfg.label,
                color: windowCfg.color,
              },
              { icon: Users, label: "Fit categoría", value: trend.categoryFit },
            ].map((m, i) => (
              <div
                key={i}
                className="bg-rufus-card rounded-lg p-3 border border-rufus-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase">
                    {m.label}
                  </span>
                </div>
                {m.value !== null ? (
                  <span className="text-lg font-bold text-white">
                    {(m.value as number).toFixed(1)}
                    <span className="text-sm text-gray-500">/10</span>
                  </span>
                ) : (
                  <span className={`text-sm font-medium ${m.color}`}>
                    {m.text}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Sections */}
          <Section title="Cómo se manifiesta" content={trend.manifestation} />
          {trend.examples && (
            <Section title="Ejemplos reales" content={trend.examples} />
          )}
          <Section title="Por qué importa ahora" content={trend.whyNow} />

          {/* Client fit */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Fit de cliente
            </h3>
            <div className="flex flex-wrap gap-2">
              {trend.clients.map((c) => (
                <span
                  key={c.id}
                  className="bg-rufus-purple/15 text-rufus-purple-light px-3 py-1.5 rounded-lg text-sm"
                >
                  {c.name}
                  <span className="text-gray-500 ml-1 text-xs">
                    ({c.category})
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Status changer */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Cambiar estado
            </h3>
            <div className="flex gap-2">
              {(Object.keys(STATUS_CONFIG) as TrendStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s]
                const isActive = trend.status === s
                return (
                  <button
                    key={s}
                    onClick={() => onStatusChange(trend.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      isActive
                        ? `${cfg.color} border-current`
                        : "border-rufus-border text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Brief Generator */}
          <div className="bg-rufus-card rounded-xl border border-rufus-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-rufus-purple" />
              <h3 className="text-white font-semibold">Generar Brief Creativo</h3>
            </div>

            {/* Client selector */}
            {trend.clients.length > 1 && (
              <div className="flex gap-2 mb-3">
                {trend.clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClient(c)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      selectedClient?.id === c.id
                        ? "bg-rufus-purple/20 text-rufus-purple-light border-rufus-purple/50"
                        : "border-rufus-border text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 mb-4">
              {/* Format selector */}
              <div className="relative flex-1">
                <button
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                  className="w-full flex items-center justify-between bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2.5 text-sm text-gray-300"
                >
                  {selectedFormat
                    ? FORMAT_LABELS[selectedFormat]
                    : "Elegir formato"}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showFormatDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-rufus-card border border-rufus-border rounded-lg overflow-hidden z-10">
                    {(Object.keys(FORMAT_LABELS) as BriefFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          setSelectedFormat(f)
                          setShowFormatDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                          selectedFormat === f
                            ? "text-rufus-purple-light"
                            : "text-gray-400"
                        }`}
                      >
                        {FORMAT_LABELS[f]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerateBrief}
                disabled={!selectedFormat || !selectedClient || generating}
                className="bg-rufus-purple hover:bg-rufus-purple-dark text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generar Brief
                  </>
                )}
              </button>
            </div>

            {/* Brief output */}
            {brief && (
              <div className="bg-rufus-bg rounded-lg p-4 border border-rufus-border">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {brief}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">
        {title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed">{content}</p>
    </div>
  )
}

function getMockBrief(trend: TrendCard, format: BriefFormat): string {
  const client = trend.clients[0]?.name || "Cliente"

  const briefs: Record<BriefFormat, string> = {
    ESTATICA: `BRIEF ESTÁTICA — ${trend.name.toUpperCase()}
Cliente: ${client}

CONCEPTO VISUAL
${trend.name} adaptado a la identidad visual de ${client}.

REFERENCIA DE ESTÉTICA
Mood: ${trend.manifestation.split(".")[0]}.
Paleta: Colores de marca ${client} + tonos neutros.
Composición: Centrada, con espacio para copy.

COPY PRINCIPAL
[Copy principal basado en la tendencia]

COPY SECUNDARIO
[Copy secundario con CTA]

CALL TO ACTION
[CTA relevante para ${client}]

FORMATO RECOMENDADO
1080x1080 (Feed) + 1080x1920 (Story)`,

    UGC: `BRIEF UGC — ${trend.name.toUpperCase()}
Cliente: ${client}

PERFIL DEL CREATOR
Edad: 22-30 años | Estilo: Auténtico, relatable
Tono: Natural, como si le hablara a un amigo.

ESCENARIO
${trend.manifestation.split(".")[0]}.

HOOK DE APERTURA (primeros 3 segundos)
"${trend.name}..." — arrancar directo con la tendencia.

GUIÓN CONVERSACIONAL
1. Hook: Conectar con la tendencia
2. Desarrollo: Mostrar el producto/servicio de ${client}
3. Cierre: CTA natural, sin forzar

ENTREGABLES
Duración: 15-30 segundos
Formato: Vertical 9:16
Variantes: 2 (con y sin texto en pantalla)`,

    AD: `BRIEF AD — ${trend.name.toUpperCase()}
Cliente: ${client}

OBJETIVO DE CAMPAÑA
Awareness + Consideration

MENSAJE CENTRAL
${client} se sube a "${trend.name}" de forma relevante.

ESTRUCTURA DEL AD
Hook (0-3s): Elemento de la tendencia que frena el scroll
Desarrollo (3-12s): Conexión con la propuesta de ${client}
CTA (12-15s): Acción clara y medible

VARIANTES DE COPY
A: [Copy directo, tendencia explícita]
B: [Copy sutil, tendencia implícita]

FORMATO RECOMENDADO
Reel/TikTok (9:16) + Feed (1:1)
Duración: 15 segundos`,

    VIDEO_ANIMADO: `BRIEF VIDEO ANIMADO — ${trend.name.toUpperCase()}
Cliente: ${client}

CONCEPTO Y NARRATIVA
Animación que traduce "${trend.name}" al universo visual de ${client}.

ESTRUCTURA DE ESCENAS
Escena 1 (0-3s): Setup — presentar el contexto de la tendencia
Escena 2 (3-8s): Desarrollo — conectar con ${client}
Escena 3 (8-12s): Payoff — resolución + branding
Escena 4 (12-15s): CTA animado

TEXTO EN PANTALLA
Escena 1: "${trend.name}"
Escena 2: [Beneficio de ${client}]
Escena 3: [Tagline]

RITMO Y DURACIÓN
15 segundos | Ritmo dinámico, cortes cada 2-3s

AUDIO / MÚSICA SUGERIDA
${trend.manifestation.includes("audio") ? "Audio trending de la tendencia" : "Música upbeat, libre de derechos"}`,
  }

  return briefs[format]
}
