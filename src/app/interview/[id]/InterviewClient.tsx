"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bot, User, Send, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InterviewClient({ initialSession }: { initialSession: any }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>(initialSession.questions);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'ai'|'user', content: string }[]>([]);

  // Initialize chat history with the first question
  useEffect(() => {
    if (questions.length > 0 && chatHistory.length === 0) {
      setChatHistory([{ role: 'ai', content: questions[0].text }]);
    }
  }, [questions, chatHistory]);

  const currentQuestion = questions[currentIdx];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading, finishing]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    const userAns = answer;
    setAnswer("");
    setLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', content: userAns }]);

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: initialSession.id,
          questionId: currentQuestion.id,
          answerText: userAns,
        })
      });

      const data = await res.json();
      
      if (data.nextQuestion) {
        // Insert follow-up question
        const newQuestions = [...questions];
        newQuestions.splice(currentIdx + 1, 0, data.nextQuestion);
        setQuestions(newQuestions);
        setCurrentIdx(currentIdx + 1);
        setChatHistory(prev => [...prev, { role: 'ai', content: data.nextQuestion.text }]);
      } else if (data.next) {
        if (currentIdx + 1 < questions.length) {
          setCurrentIdx(currentIdx + 1);
          setChatHistory(prev => [...prev, { role: 'ai', content: questions[currentIdx + 1].text }]);
        } else {
          handleFinish();
          return;
        }
      }
    } catch (e) {
      alert("Error submitting answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    setChatHistory(prev => [...prev, { role: 'ai', content: "That concludes the interview. Give me a moment to analyze your responses and generate your feedback report..." }]);
    try {
      await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: initialSession.id })
      });
      router.push(`/feedback/${initialSession.id}`);
    } catch (e) {
      alert("Error generating feedback");
      setFinishing(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50/50 dark:bg-zinc-950">
      <header className="border-b bg-white dark:bg-zinc-900 shadow-sm p-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-lg">MockMate</span>
          <Badge variant="outline" className="ml-2 hidden sm:inline-flex">
            {initialSession.role} • {initialSession.level}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-muted-foreground">
            Question {currentIdx + 1} of {questions.length}
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleFinish} 
            disabled={loading || finishing}
          >
            End Interview
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex justify-center p-4">
        <Card className="w-full max-w-4xl flex flex-col shadow-xl border-zinc-200 dark:border-zinc-800 h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                    {msg.role === 'ai' ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                    msg.role === 'ai' 
                      ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 rounded-tl-none' 
                      : 'bg-zinc-900 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-tr-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {(loading || finishing) && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none bg-zinc-100 dark:bg-zinc-800/50 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                    <span className="text-sm text-zinc-500">
                      {finishing ? "Analyzing responses..." : "Thinking..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border-t shrink-0 rounded-b-xl">
            <div className="flex gap-2">
              <Textarea 
                placeholder="Type your answer here..." 
                className="resize-none h-16 min-h-[64px]"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={loading || finishing}
              />
              <Button 
                onClick={handleSubmit} 
                disabled={!answer.trim() || loading || finishing}
                className="h-16 w-16 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Press Enter to send, Shift + Enter for new line.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
