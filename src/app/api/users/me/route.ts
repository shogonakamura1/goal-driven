import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/tokens";

export async function GET(req: NextRequest) {
  try {
    const access = req.cookies.get("access_token")?.value;

    if (!access) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { userId } = await verifyAccessToken(access);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
