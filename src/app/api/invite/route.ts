import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// POST /api/invite — admin generates invite codes
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { count = 1 } = await req.json().catch(() => ({}));
  const codes = [];

  for (let i = 0; i < Math.min(count, 20); i++) {
    const code = randomBytes(4).toString("hex").toUpperCase(); // e.g. "A3F9B21C"
    const invite = await prisma.inviteCode.create({ data: { code } });
    codes.push(invite.code);
  }

  return NextResponse.json({ codes }, { status: 201 });
}

// GET /api/invite — admin lists all codes
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(codes);
}
