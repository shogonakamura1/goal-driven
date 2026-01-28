import { NextRequest, NextResponse } from "next/server";
import { CreateUserRequest, UserResponse, ErrorResponse } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password"

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (existingUser) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "このメールアドレスは既に登録されています",
          code: "EMAIL_EXISTS"
        },
        { status: 409 }
      );
    }
    
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "名前とメールアドレスとパスワードは必須です",
          code: "VALIDATION_ERROR"
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "無効なメールアドレス表示です",
          code: "INVALID_EMAIL"
        },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(body.password);

    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashed,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })

    return NextResponse.json<UserResponse>(newUser, { status: 201 });

  } catch (error) {
    console.error("ユーザー作成エラー:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "リクエストボディの形式が不正です",
          code: "INVALID_JSON"
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ErrorResponse>(
      {
        error: "ユーザーの作成に失敗しました",
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}

