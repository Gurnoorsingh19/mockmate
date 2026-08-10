import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, level, interviewType } = await req.json();

    if (!role || !level || !interviewType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are an expert technical interviewer.
Generate exactly 5 interview questions for a ${level} ${role} focusing on ${interviewType}.
The output MUST be a valid JSON array of strings.
Example: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        },
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    let questionsText: string[];
    
    try {
      questionsText = JSON.parse(responseText);
      if (!Array.isArray(questionsText) || questionsText.length !== 5) {
        throw new Error("Invalid format");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json({ error: "AI response parsing failed" }, { status: 500 });
    }

    // Create session in DB
    const interviewSession = await prisma.interviewSession.create({
      data: {
        userId: (session.user as any).id,
        role,
        level,
        interviewType,
        questions: {
          create: questionsText.map((text, index) => ({
            text,
            order: index,
          }))
        }
      },
    });

    return NextResponse.json({ sessionId: interviewSession.id });
  } catch (error: any) {
    console.error("Generate questions error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
