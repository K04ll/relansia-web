import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  const body = await req.formData();
  const text = String(body.get("text") ?? "");

  const prompt = `Améliore ce message marketing pour un e-commerce français, ton humain, clair et engageant :\n\n${text}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const improved = completion.choices[0]?.message?.content ?? text;
  return NextResponse.json({ improved });
}
