import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Brak tokena lub hasła." }, { status: 400 });

  const pr = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!pr || pr.used || pr.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token nieprawidłowy lub wygasł." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: pr.userId }, data: { passwordHash: hashed } });
  await prisma.passwordResetToken.update({ where: { id: pr.id }, data: { used: true } });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
