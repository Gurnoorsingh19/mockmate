import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Home, Code2 } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/");
  }

  const { id } = await params;

  const interviewSession = await prisma.interviewSession.findUnique({
    where: { id },
    include: {
      feedback: true,
      questions: {
        include: { answers: true },
        orderBy: [{ order: 'asc' }, { isFollowup: 'asc' }]
      }
    }
  });

  if (!interviewSession || interviewSession.userId !== (session.user as any).id) {
    redirect("/");
  }

  if (!interviewSession.feedback) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50 dark:bg-zinc-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Feedback not ready</h2>
          <p className="text-muted-foreground mb-4">Please complete the interview to get feedback.</p>
          <Link href={`/interview/${id}`} className={buttonVariants({ variant: "default" })}>Resume Interview</Link>
        </div>
      </div>
    );
  }

  const feedback = interviewSession.feedback;
  const strengths = JSON.parse(feedback.strengths);
  const improvements = JSON.parse(feedback.improvements);
  const perQuestionFeedback = JSON.parse(feedback.perQuestionFeedback);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50 dark:bg-zinc-950">
      <header className="border-b bg-white dark:bg-zinc-900 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">MockMate</span>
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Home className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interview Feedback</h1>
            <p className="text-muted-foreground mt-1">
              {interviewSession.role} • {interviewSession.level} • {interviewSession.interviewType}
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 px-6 py-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Overall Score</div>
              <div className="text-4xl font-extrabold text-blue-600">{feedback.overallScore}/10</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-green-100 dark:border-green-900/50 shadow-md">
            <CardHeader className="bg-green-50/50 dark:bg-green-900/20 rounded-t-xl border-b border-green-100 dark:border-green-900/50">
              <CardTitle className="flex items-center text-green-700 dark:text-green-500">
                <CheckCircle2 className="w-5 h-5 mr-2" /> Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {strengths.map((str: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-100 dark:border-amber-900/50 shadow-md">
            <CardHeader className="bg-amber-50/50 dark:bg-amber-900/20 rounded-t-xl border-b border-amber-100 dark:border-amber-900/50">
              <CardTitle className="flex items-center text-amber-700 dark:text-amber-500">
                <XCircle className="w-5 h-5 mr-2" /> Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {improvements.map((imp: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mt-12 mb-6">Detailed Q&A Analysis</h2>
        
        <div className="space-y-6">
          {interviewSession.questions.map((q: any, i: number) => {
            const qFeedback = perQuestionFeedback.find((pf: any) => pf.question === q.text) || perQuestionFeedback[i];
            const answer = q.answers[0]?.text || "No answer provided.";
            return (
              <Card key={q.id} className="shadow-sm overflow-hidden border-zinc-200 dark:border-zinc-800">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                      Q
                    </div>
                    <div className="font-medium">{q.text}</div>
                  </div>
                </div>
                <div className="p-4 border-b">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                      A
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{answer}</div>
                  </div>
                </div>
                {qFeedback && (
                  <div className="p-4 bg-blue-50/30 dark:bg-blue-950/20">
                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-2 uppercase tracking-wide">Feedback</h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">{qFeedback.feedback}</p>
                    
                    {qFeedback.modelAnswer && (
                      <div>
                        <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-500 mb-2 uppercase tracking-wide">Suggested Answer</h4>
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 italic">
                          {qFeedback.modelAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
