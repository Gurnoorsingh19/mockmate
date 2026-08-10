import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import InterviewClient from "./InterviewClient";

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/");
  }

  const { id } = await params;

  const interviewSession = await prisma.interviewSession.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: [{ order: 'asc' }, { isFollowup: 'asc' }]
      }
    }
  });

  if (!interviewSession || interviewSession.userId !== (session.user as any).id) {
    redirect("/");
  }

  if (interviewSession.status === "COMPLETED") {
    redirect(`/feedback/${id}`);
  }

  return <InterviewClient initialSession={interviewSession} />;
}
