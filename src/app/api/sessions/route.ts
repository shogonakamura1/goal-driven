import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { issueAccessToken, generateRefreshToken, hashRefreshToken } from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";
import { LoginRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  console.log("AAA")
  try {
    const body = (await req.json()) as Partial<LoginRequest>;
    const email = body.email?.trim();
    const password = body.password;

    console.log("A")

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, name: true },
    });

    console.log("B");

    if (!user) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    console.log("C");

    const refreshRaw = generateRefreshToken();
    const refreshHash = hashRefreshToken(refreshRaw);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshHash,
        expiresAt,
      },
    });

    console.log("D");

    const accessToken = await issueAccessToken(user.id);

    const res = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 200 }
    );

    setAuthCookies(res, accessToken, refreshRaw);

    console.log("E");

    return res;
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
