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

    const { sessionId, questionId, answerText } = await req.json();

    if (!sessionId || !questionId || !answerText) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await prisma.answer.create({
      data: {
        questionId,
        text: answerText,
      }
    });

    const currentQuestion = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!currentQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const prompt = `You are an expert interviewer. 
The user was asked: "${currentQuestion.text}"
The user answered: "${answerText}"

Decide if you need to ask ONE follow-up question to probe deeper, clarify, or if their answer was sufficient.
If you want to ask a follow-up, output a JSON object like: {"followup": "Your follow-up question here"}
If no follow-up is needed, output: {"followup": null}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            followup: {
              type: Type.STRING,
              nullable: true,
            }
          },
        }
      }
    });

    const responseText = response.text;
    let result: { followup: string | null } = { followup: null };
    
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse AI followup:", responseText);
      }
    }

    if (result.followup && !currentQuestion.isFollowup) {
      const newQuestion = await prisma.question.create({
        data: {
          sessionId,
          text: result.followup,
          order: currentQuestion.order,
          isFollowup: true,
        }
      });
      return NextResponse.json({ nextQuestion: newQuestion });
    }

    return NextResponse.json({ next: true });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
