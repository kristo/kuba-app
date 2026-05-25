import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { name, email, password, inviteCode } = await req.json();

  if (!name || !email || !password || !inviteCode) {
    return NextResponse.json({ error: "Wszystkie pola są wymagane." }, { status: 400 });
  }

  const invite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
  if (!invite) {
    return NextResponse.json({ error: "Nieprawidłowy kod zaproszenia." }, { status: 400 });
  }
  if (invite.usedBy) {
    return NextResponse.json({ error: "Kod zaproszenia został już wykorzystany." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Konto z tym e-mailem już istnieje." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await prisma.inviteCode.update({
    where: { code: inviteCode },
    data: { usedBy: user.id, usedAt: new Date() },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
