"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, ArrowRight, ArrowLeft, Rocket, Check } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

const templates = [
  { id: "blank", name: "Blank", icon: "📄", desc: "Start from scratch" },
  { id: "meeting", name: "Meeting Notes", icon: "📝", desc: "Document meetings" },
  { id: "project", name: "Project Plan", icon: "🎯", desc: "Plan your project" },
  { id: "spec", name: "Tech Spec", icon: "⚙️", desc: "Technical requirements" },
];

export function FirstDocumentStep() {
  const { document, setDocument, nextStep, prevStep, completeOnboarding, workspace } =
    useOnboardingStore();
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [isCompleting, setIsCompleting] = useState(false);

  const isValid = document.title.trim().length >= 1;

  const handleComplete = async () => {
    setIsCompleting(true);
    await new Promise((r) => setTimeout(r, 1500));
    completeOnboarding();
    nextStep();
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
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10"
          >
            <FileText className="h-8 w-8 text-emerald-400" />
          </motion.div>
          <h2 className="mb-2 text-3xl font-bold">Create Your First Document</h2>
          <p className="text-muted-foreground">
            Every great workspace starts with a great document.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Title</CardTitle>
            <CardDescription>Give your document a name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              placeholder={
                selectedTemplate === "meeting"
                  ? "Weekly Standup - June 12"
                  : selectedTemplate === "project"
                    ? "Q3 Product Roadmap"
                    : selectedTemplate === "spec"
                      ? "API Design Specification"
                      : "Getting Started with " + (workspace.name || "My Workspace")
              }
              value={document.title}
              onChange={(e) => setDocument({ title: e.target.value })}
              autoFocus
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Choose a template</p>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((template, i) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                      selectedTemplate === template.id
                        ? "bg-white/10 ring-2 ring-white/20"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xl">{template.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.desc}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="ml-auto h-4 w-4 text-emerald-400" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={prevStep} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!isValid || isCompleting}
            className="group gap-2 bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-lg shadow-primary/25 hover:opacity-90"
          >
            {isCompleting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Rocket className="h-4 w-4" />
                </motion.div>
                Launching...
              </>
            ) : (
              <>
                Launch Workspace
                <Rocket className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
