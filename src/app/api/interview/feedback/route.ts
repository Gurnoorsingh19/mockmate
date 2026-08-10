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

    const { sessionId } = await req.json();

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          include: { answers: true },
          orderBy: [{ order: 'asc' }, { isFollowup: 'asc' }]
        }
      }
    });

    if (!interviewSession || interviewSession.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (interviewSession.status === "COMPLETED") {
      return NextResponse.json({ message: "Already completed" });
    }

    const answeredQuestions = interviewSession.questions.filter((q: any) => q.answers && q.answers.length > 0);
    
    let transcript = "The candidate ended the interview before answering any questions.";
    if (answeredQuestions.length > 0) {
      transcript = answeredQuestions.map((q: any) => {
        const answer = q.answers[0].text;
        return `Q: ${q.text}\nA: ${answer}`;
      }).join("\n\n");
    }

    const prompt = `You are an expert interviewer evaluating a candidate for a ${interviewSession.level} ${interviewSession.role} role.
Interview Type: ${interviewSession.interviewType}

Transcript:
${transcript}

Provide a structured evaluation in JSON format:
{
  "overallScore": <number out of 10>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "perQuestionFeedback": [
    {
      "question": "<The question text>",
      "feedback": "<Detailed feedback on their answer>",
      "modelAnswer": "<An example of a great answer if their answer was weak, else null>"
    }
  ]
}
Output MUST be strictly valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            perQuestionFeedback: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  feedback: { type: Type.STRING },
                  modelAnswer: { type: Type.STRING, nullable: true }
                }
              }
            }
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    let feedbackData;
    
    try {
      feedbackData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse AI feedback:", responseText);
      return NextResponse.json({ error: "AI feedback parsing failed" }, { status: 500 });
    }

    // Save feedback
    await prisma.feedback.create({
      data: {
        sessionId,
        overallScore: feedbackData.overallScore,
        strengths: JSON.stringify(feedbackData.strengths),
        improvements: JSON.stringify(feedbackData.improvements),
        perQuestionFeedback: JSON.stringify(feedbackData.perQuestionFeedback),
      }
    });

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
