"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store";
import { joinWorkspace } from "@/lib/workspace";
import { Link2, Loader2, CheckCircle2, AlertCircle, LogIn, ArrowRight, Sparkles } from "lucide-react";

export default function JoinWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { isAuthenticated, isLoading: authLoading, initializeAuth } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("");

  const performJoin = async () => {
    setStatus("loading");
    try {
      const member = await joinWorkspace(token);
      setStatus("done");
      setMessage("You joined the workspace successfully!");
      setTimeout(() => router.push("/workspaces"), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join workspace";
      setStatus("error");
      setMessage(msg);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && token) {
      performJoin();
    }
  }, [authLoading, isAuthenticated, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-border-subtle bg-surface-sunken backdrop-blur-xl">
          <CardContent className="p-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-border-subtle">
              <Link2 className="h-8 w-8 text-indigo-400" />
            </div>

            <h1 className="mb-2 text-center text-2xl font-bold text-foreground">
              Join Project
            </h1>
            <p className="mb-8 text-center text-sm text-muted-foreground">
              You&apos;ve been invited to collaborate on a project in SyncSpace EDU.
            </p>

            {!authLoading && !isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                  <p className="text-sm text-foreground">
                    You need to sign in to join this project. Sign in or create an account, then
                    return to this link to continue.
                  </p>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    localStorage.setItem("pendingJoinWorkspace", token);
                    router.push("/login?redirect=/join/" + token);
                  }}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In to Join
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {status === "loading" && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Joining workspace...</p>
                  </div>
                )}

                {status === "done" && (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                    <p className="text-center text-sm font-medium text-foreground">{message}</p>
                    <p className="text-xs text-muted-foreground">Redirecting to your projects...</p>
                  </div>
                )}

                {status === "error" && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <p className="text-sm text-foreground">{message}</p>
                    </div>
                    <Button variant="outline" className="w-full gap-2" onClick={() => router.push("/workspaces")}>
                      Go to My Projects
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
