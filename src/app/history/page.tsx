import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Code2, Home, ArrowRight, History } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/");
  }

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: (session.user as any).id },
    include: { feedback: true },
    orderBy: { createdAt: 'desc' }
  });

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

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-200 dark:bg-zinc-800 p-3 rounded-full">
            <History className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Session History</h1>
            <p className="text-muted-foreground mt-1">Review your past interviews and track your progress.</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-xl font-semibold mb-2">No interviews yet</h3>
              <p className="text-muted-foreground mb-6">Start your first mock interview to get AI feedback.</p>
              <Link href="/" className={buttonVariants({ variant: "default" })}>Start an Interview</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((s: any) => (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{s.role}</h3>
                        <span className="px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400">
                          {s.level}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {s.interviewType} • {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      {s.status === "COMPLETED" && s.feedback ? (
                        <div className="text-center">
                          <div className="text-xs font-medium text-muted-foreground uppercase mb-0.5">Score</div>
                          <div className="text-2xl font-bold text-blue-600">{s.feedback.overallScore}/10</div>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                          In Progress
                        </div>
                      )}
                      <Link 
                        href={s.status === "COMPLETED" ? `/feedback/${s.id}` : `/interview/${s.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        {s.status === "COMPLETED" ? "View Feedback" : "Resume"} <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
