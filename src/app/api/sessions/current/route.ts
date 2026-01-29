import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueAccessToken, generateRefreshToken, hashRefreshToken } from "@/lib/auth/tokens";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  try {
    const refreshRaw = req.cookies.get("refresh_token")?.value;
    if (!refreshRaw) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const refreshHash = hashRefreshToken(refreshRaw);

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { refreshHash },
        select: { id: true, userId: true, expiresAt: true, revokedAt: true },
      });

      if (!session) {
        return { ok: false as const };
      }

      if (session.revokedAt) {
        return { ok: false as const };
      }

      if (session.expiresAt.getTime() <= Date.now()) {
        return { ok: false as const };
      }

      const user = await tx.user.findUnique({
        where: { id: session.userId },
        select: { id: true },
      });
      if (!user) {
        return { ok: false as const };
      }

      const now = new Date();
      await tx.session.update({
        where: { id: session.id },
        data: { revokedAt: now },
      });

      const newRefreshRaw = generateRefreshToken();
      const newRefreshHash = hashRefreshToken(newRefreshRaw);
      const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

      await tx.session.create({
        data: {
          userId: session.userId,
          refreshHash: newRefreshHash,
          expiresAt: newExpiresAt,
        },
      });

      return {
        ok: true as const,
        userId: session.userId,
        newRefreshRaw,
      };
    });

    if (!result.ok) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const accessToken = await issueAccessToken(result.userId);

    const res = NextResponse.json({ ok: true }, { status: 200 });
    setAuthCookies(res, accessToken, result.newRefreshRaw);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const refreshRaw = req.cookies.get("refresh_token")?.value;

    if (refreshRaw) {
      const refreshHash = hashRefreshToken(refreshRaw);
      
      await prisma.session.updateMany({
        where: {
          refreshHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    const res = NextResponse.json({ ok: true }, { status: 200 });
    clearAuthCookies(res);
    return res;
  } catch (e) {
    console.error(e);

    const res = NextResponse.json({ ok: true }, { status: 200 });
    clearAuthCookies(res);
    return res;
  }
}
