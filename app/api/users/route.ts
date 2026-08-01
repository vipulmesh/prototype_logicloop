import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""

  if (!name) {
    return NextResponse.json({ error: "A name is required." }, { status: 400 })
  }

  const user = await prisma.user.upsert({
    where: { name },
    update: {},
    create: { name },
    select: { id: true, name: true },
  })

  return NextResponse.json({ user })
}
