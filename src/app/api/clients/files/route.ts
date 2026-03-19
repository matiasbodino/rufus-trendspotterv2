import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = "brand-files"

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET_NAME)
  if (!data) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false })
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const clientId = formData.get("clientId") as string

    if (!file || !clientId) {
      return NextResponse.json({ error: "file and clientId required" }, { status: 400 })
    }

    await ensureBucket()

    const buffer = Buffer.from(await file.arrayBuffer())
    const storagePath = `${clientId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Extract text from file for Claude context
    let extractedText: string | null = null
    if (file.type === "application/pdf" || file.type.includes("text") || file.name.endsWith(".md")) {
      // For text files, read directly
      extractedText = new TextDecoder().decode(buffer)
    }
    // For PDFs and other formats, we store them and let Claude read via Supabase URL later

    const clientFile = await prisma.clientFile.create({
      data: {
        clientId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storagePath,
        extractedText,
      },
    })

    return NextResponse.json({ file: clientFile })
  } catch (error) {
    console.error("POST /api/clients/files error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get("clientId")

    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 })
    }

    const files = await prisma.clientFile.findMany({
      where: { clientId },
      orderBy: { uploadedAt: "desc" },
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error("GET /api/clients/files error:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 })
    }

    const file = await prisma.clientFile.findUnique({ where: { id: fileId } })
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete from Supabase Storage
    await supabase.storage.from(BUCKET_NAME).remove([file.storagePath])

    // Delete from DB
    await prisma.clientFile.delete({ where: { id: fileId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/clients/files error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
