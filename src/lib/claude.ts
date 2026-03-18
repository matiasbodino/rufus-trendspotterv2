import Anthropic from "@anthropic-ai/sdk"

// Use lazy init to ensure .env is loaded first by Next.js
let _anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    // Read directly from .env, bypassing any overrides
    const fs = require("fs")
    const path = require("path")
    const envPath = path.resolve(process.cwd(), ".env")
    let apiKey = process.env.ANTHROPIC_API_KEY || ""

    try {
      const envContent = fs.readFileSync(envPath, "utf-8")
      const match = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m)
      if (match) {
        apiKey = match[1].trim()
      }
    } catch {}

    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

// Use getter to ensure lazy initialization
const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return (getAnthropicClient() as any)[prop]
  },
})

const RUFUS_CLIENTS = `Clientes activos de Rufus Social:
- MercadoLibre (ecommerce)
- Danone (food & bev)
- Disney (entretenimiento)
- Rappi (delivery)
- Despegar (travel)
- PedidosYa (delivery)
- CCU (food & bev)
- NaranjaX (fintech)`

export interface QualifyResult {
  califica: boolean
  score: number
  growthSpeed: number
  categoryFit: number
  ventana: "URGENTE" | "NORMAL" | "PUEDE_ESPERAR"
  clientes_fit: string[]
  razon: string
}

export interface TrendCardResult {
  name: string
  description: string
  manifestation: string
  examples: string
  whyNow: string
  recommendedFormat: "ESTATICA" | "UGC" | "AD" | "VIDEO_ANIMADO"
}

export async function qualifySignal(signal: {
  title: string
  description: string
  platform: string
  metrics: Record<string, unknown>
  market: string
}): Promise<QualifyResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `Eres el motor de análisis de tendencias de Rufus Social, una agencia de performance creativo en LATAM. Tu trabajo es evaluar si una señal detectada en redes sociales califica como tendencia accionable para los clientes de la agencia.

${RUFUS_CLIENTS}

Criterios de calificación:
1. Velocidad de crecimiento (1-10): ¿cuánto creció en las últimas 24/48hs?
2. Ventana de activación: URGENTE (<48hs) / NORMAL (<1 semana) / PUEDE_ESPERAR
3. Fit de categoría con clientes activos (1-10): ¿qué tan relevante es para las industrias de los clientes?

El score final es el promedio ponderado: growthSpeed * 0.4 + categoryFit * 0.4 + ventanaScore * 0.2
Donde ventanaScore: URGENTE=10, NORMAL=6, PUEDE_ESPERAR=3

Devuelve SOLO un JSON válido sin markdown, sin backticks, sin explicación adicional.`,
    messages: [
      {
        role: "user",
        content: `Evalúa esta señal detectada en ${signal.platform} (mercado: ${signal.market}):

Título: ${signal.title}
Descripción: ${signal.description}
Métricas: ${JSON.stringify(signal.metrics)}

Devuelve JSON con este formato exacto:
{"califica": boolean, "score": number, "growthSpeed": number, "categoryFit": number, "ventana": "URGENTE"|"NORMAL"|"PUEDE_ESPERAR", "clientes_fit": ["NombreCliente1", "NombreCliente2"], "razon": "explicación breve"}`,
      },
    ],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return JSON.parse(text) as QualifyResult
}

export async function generateTrendCard(signal: {
  title: string
  description: string
  platform: string
  metrics: Record<string, unknown>
  market: string
  qualification: QualifyResult
}): Promise<TrendCardResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `Eres el Creative Strategist de Rufus Social. Tu trabajo es convertir señales de tendencia en fichas creativas accionables.

Tono: creativo, directo, accionable. No datos — insights. Escribí en español rioplatense pero profesional.

${RUFUS_CLIENTS}`,
    messages: [
      {
        role: "user",
        content: `Generá la ficha de tendencia para esta señal:

Plataforma: ${signal.platform}
Mercado: ${signal.market}
Título original: ${signal.title}
Descripción: ${signal.description}
Métricas: ${JSON.stringify(signal.metrics)}
Score: ${signal.qualification.score}
Ventana: ${signal.qualification.ventana}
Clientes con fit: ${signal.qualification.clientes_fit.join(", ")}

Devuelve SOLO un JSON válido sin markdown ni backticks con este formato:
{"name": "nombre creativo de la tendencia", "description": "qué es y por qué importa (2-3 oraciones)", "manifestation": "cómo se manifiesta: formato, audio, estética, narrativa (2-3 oraciones)", "examples": "ejemplos reales o referencias concretas", "whyNow": "por qué es relevante AHORA (contexto cultural del momento)", "recommendedFormat": "ESTATICA"|"UGC"|"AD"|"VIDEO_ANIMADO"}`,
      },
    ],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return JSON.parse(text) as TrendCardResult
}

export async function generateBrief(params: {
  trendName: string
  trendDescription: string
  trendManifestation: string
  trendWhyNow: string
  clientName: string
  clientCategory: string
  format: "ESTATICA" | "UGC" | "AD" | "VIDEO_ANIMADO"
}): Promise<string> {
  const formatInstructions: Record<string, string> = {
    ESTATICA: `Generá un brief de ESTÁTICA con:
- Concepto visual en una línea
- Referencia de estética (mood, paleta, composición)
- Copy principal (headline)
- Copy secundario (bajada)
- Call to action
- Formato y dimensiones recomendadas`,
    UGC: `Generá un brief de UGC con:
- Perfil del creator ideal (edad, estilo, tono)
- Escenario y contexto
- Hook de apertura (primeros 3 segundos)
- Guión conversacional (estructura, no textual)
- Entregables esperados (duración, formato, cantidad de variantes)`,
    AD: `Generá un brief de AD con:
- Objetivo de campaña
- Mensaje central
- Estructura del ad (hook / desarrollo / CTA con tiempos)
- Variantes de copy (A/B)
- Formato recomendado por plataforma`,
    VIDEO_ANIMADO: `Generá un brief de VIDEO ANIMADO con:
- Concepto y narrativa
- Estructura de escenas (escena por escena)
- Texto en pantalla por escena
- Ritmo y duración estimada
- Audio / música sugerida`,
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `Eres el Creative Strategist de Rufus Social. Generás briefs creativos listos para producción.

Tono: profesional pero creativo. Cada sección debe ser concreta y accionable — el equipo de producción tiene que poder ejecutar sin preguntas.

Escribí en español. Usá el nombre del cliente en el brief.`,
    messages: [
      {
        role: "user",
        content: `Generá un brief creativo para:

TENDENCIA: ${params.trendName}
Descripción: ${params.trendDescription}
Manifestación: ${params.trendManifestation}
Por qué ahora: ${params.trendWhyNow}

CLIENTE: ${params.clientName} (${params.clientCategory})
FORMATO: ${params.format}

${formatInstructions[params.format]}

Devolvé el brief como texto plano formateado, listo para copiar y usar. No uses JSON, devolvé texto directo.`,
      },
    ],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return text
}
