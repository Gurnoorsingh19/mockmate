"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, LogOut, Code2, MessagesSquare, Briefcase, Lightbulb, Award, Flame } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("Frontend Engineer");
  const [level, setLevel] = useState("mid");
  const [interviewType, setInterviewType] = useState("technical");

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/interview/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, level, interviewType }),
      });
      const data = await res.json();
      if (res.ok && data.sessionId) {
        router.push(`/interview/${data.sessionId}`);
      } else {
        alert("Failed to start: " + data.error);
      }
    } catch (error) {
      alert("Error starting interview.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[30rem] h-[30rem] bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="mb-8 text-center space-y-2 z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-600/20">
              <Code2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl text-zinc-900 dark:text-zinc-100">
            MockMate
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mt-4">
            Ace your next interview with AI-powered practice sessions tailored to your role.
          </p>
        </div>
        <Card className="w-full max-w-md shadow-2xl border-white/40 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl z-10">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to start your practice session</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => signIn()} className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" size="lg">
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <header className="border-b border-white/20 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm sticky top-0 z-20">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
              MockMate
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
              {session.user?.email}
            </span>
            <Link href="/history" className={buttonVariants({ variant: "ghost" })}>History</Link>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex justify-center z-10 relative">
        <Card className="w-full max-w-lg shadow-2xl border-white/40 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-2xl">Configure Your Interview</CardTitle>
            <CardDescription>
              Tell us what you're interviewing for and we'll tailor the questions.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleStart}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role">Target Role</Label>
                <Input
                  id="role"
                  placeholder="e.g. Frontend Engineer, Product Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="h-12 text-base bg-white dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Experience Level</Label>
                <Select value={level} onValueChange={(val) => val && setLevel(val)}>
                  <SelectTrigger id="level" className="h-12 text-base bg-white dark:bg-zinc-950">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="staff">Staff/Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Interview Type</Label>
                <Select value={interviewType} onValueChange={(val) => val && setInterviewType(val)}>
                  <SelectTrigger id="type" className="h-auto py-3 text-base bg-white dark:bg-zinc-950">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">
                      <div className="flex items-center gap-3 py-1">
                        <Code2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Technical / Skill-Based</span>
                          <span className="text-xs text-muted-foreground hidden sm:block">Tests hard skills, coding, or practical knowledge</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="case">
                      <div className="flex items-center gap-3 py-1">
                        <Briefcase className="w-5 h-5 text-blue-500 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Case Interviews</span>
                          <span className="text-xs text-muted-foreground hidden sm:block">Solve a simulated business problem</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="behavioral">
                      <div className="flex items-center gap-3 py-1">
                        <MessagesSquare className="w-5 h-5 text-purple-500 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Behavioral</span>
                          <span className="text-xs text-muted-foreground hidden sm:block">Evaluates past actions to predict future habits</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="situational">
                      <div className="flex items-center gap-3 py-1">
                        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Situational</span>
                          <span className="text-xs text-muted-foreground hidden sm:block">Hypothetical workplace problems</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="competency">
                      <div className="flex items-center gap-3 py-1">
                        <Award className="w-5 h-5 text-indigo-500 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Competency-Based</span>
                          <span className="text-xs text-muted-foreground hidden sm:block">Scores specific traits or proficiencies</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="stress">
                      <div className="flex items-center gap-3 py-1">
                        <Flame className="w-5 h-5 text-red-500 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Stress Interviews</span>
                          <span className="text-xs text-muted-foreground hidden sm:block">React in high-anxiety environments</span>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Preparing Interview...
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
