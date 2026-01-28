import { NextRequest, NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { AICoachResponse } from "@/lib/types";

// POST: AIコーチから，ユーザーが目標や計画を入力する際に、適切な質問、例、批判的フィードバックを提供
export async function POST(request: NextRequest) {
  try {
    if (!model) {
      return NextResponse.json(
        { error: "AI機能が利用できません" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { targetNode, goalPath, field, nodeType, nodeGuide, parentContext } =
      body;
    console.log(body);

    // コンテキストを構築（最小限に）
    const context = `
あなたは目標達成をサポートするコーチです。
ユーザーが目標や計画を入力する際に、適切な質問、例、批判的フィードバックを提供してください。

## 現在の入力状況
- フィールド: ${field}
- ノード種別: ${nodeType || "(未指定)"}
- 入力内容: ${targetNode || "(未入力)"}
- 目標の文脈: ${goalPath || "(なし)"}
${parentContext ? `- 親ノードの文脈: ${parentContext}` : ""}
${nodeGuide ? `\n## このノードで書くべき内容\n${nodeGuide}\n` : ""}

## 出力形式（JSON）
以下の形式で回答してください。日本語で出力してください。

{
  "questions": [
    {"id": "q1", "text": "考えるべき質問"}
  ],
  "examples": [
    {"field": "${field}", "text": "具体的な例文"}
  ],
  "critic": {
    "level": "info|warning|error",
    "messages": [
      {"code": "コード", "text": "指摘内容"}
    ]
  }
}

## 指針
- 質問は1-2個、本質的なものに絞る
- 例は具体的で参考になるものを1-2個
- 批判は建設的に、改善方法を示す
- criticのlevelは問題の深刻度に応じて設定（info=参考、warning=改善推奨、error=必須修正）
- 入力がない場合はcriticはnullにする
- 目標の文脈に合わない内容は指摘する
`;

    const result = await model.generateContent(context);
    const response = result.response;
    const text = response.text();

    // JSONを抽出してパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AIの応答を解析できませんでした" },
        { status: 500 },
      );
    }

    const aiResponse: AICoachResponse = JSON.parse(jsonMatch[0]);

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error("AIコーチエラー:", error);
    return NextResponse.json(
      { error: "AI処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
