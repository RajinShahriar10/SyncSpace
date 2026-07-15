"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, ArrowRight, ArrowLeft, X, Mail, UserPlus, SkipForward } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

export function InviteTeamStep() {
  const { invite, addInviteEmail, removeInviteEmail, nextStep, prevStep } = useOnboardingStore();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleAdd = () => {
    if (!email.trim()) return;
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (invite.emails.includes(email)) {
      setError("This email is already added");
      return;
    }
    addInviteEmail(email);
    setEmail("");
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10"
          >
            <Users className="h-8 w-8 text-secondary" />
          </motion.div>
          <h2 className="mb-2 text-3xl font-bold">Invite Your Group</h2>
          <p className="text-muted-foreground">
            Collaboration is better together. Add your group members.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Group Members</CardTitle>
            <CardDescription>Enter email addresses to send invitations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="classmate@university.edu"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleAdd} size="lg" variant="secondary" className="shrink-0 gap-1">
                <UserPlus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {error}
              </motion.p>
            )}

            <AnimatePresence mode="popLayout">
              {invite.emails.map((em) => (
                <motion.div
                  key={em}
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  layout
                  className="glass flex items-center justify-between rounded-lg px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {em[0].toUpperCase()}
                    </div>
                    <span className="text-sm">{em}</span>
                  </div>
                  <button
                    onClick={() => removeInviteEmail(em)}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {invite.emails.length === 0 && (
              <div className="rounded-lg border border-dashed border-white/10 py-8 text-center">
                <UserPlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No group members added yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={prevStep} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={nextStep} className="gap-2 text-muted-foreground">
              <SkipForward className="h-4 w-4" />
              Skip for now
            </Button>
            <Button onClick={nextStep} className="group gap-2">
              Continue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
