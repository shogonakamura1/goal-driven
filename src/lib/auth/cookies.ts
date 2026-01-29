import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  res.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  res.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/sessions",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set("access_token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/sessions",
    maxAge: 0,
  });
}
