"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

export function CreateWorkspaceStep() {
  const { workspace, setWorkspace, nextStep, prevStep } = useOnboardingStore();
  const [touched, setTouched] = useState(false);

  const slug = workspace.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const isValid = workspace.name.trim().length >= 2;

  const handleSlugPreview = (name: string) => {
    setWorkspace({ name, slug });
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
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
          >
            <Building2 className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="mb-2 text-3xl font-bold">Create Your Project</h2>
          <p className="text-muted-foreground">
            This is where your group will come together to collaborate.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Give your project a name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="ws-name" className="text-sm font-medium">
                Project Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="ws-name"
                placeholder="CS401 Final Project"
                value={workspace.name}
                onChange={(e) => handleSlugPreview(e.target.value)}
                onBlur={() => setTouched(true)}
                autoFocus
              />
              {touched && !isValid && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive"
                >
                  Name must be at least 2 characters
                </motion.p>
              )}
              {workspace.name && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Check className="h-3 w-3 text-emerald-400" />
                  syncspace.app/{slug}
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="ws-desc" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="ws-desc"
                placeholder="What's this project about?"
                value={workspace.description}
                onChange={(e) => setWorkspace({ description: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={prevStep} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={!isValid}
            className="group gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
