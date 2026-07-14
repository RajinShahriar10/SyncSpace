"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Palette, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

const accentColors = [
  { name: "Indigo", value: "#6366F1", gradient: "from-indigo-500 to-indigo-600" },
  { name: "Purple", value: "#8B5CF6", gradient: "from-violet-500 to-purple-600" },
  { name: "Cyan", value: "#06B6D4", gradient: "from-cyan-500 to-teal-500" },
  { name: "Emerald", value: "#10B981", gradient: "from-emerald-500 to-green-500" },
  { name: "Rose", value: "#F43F5E", gradient: "from-rose-500 to-pink-500" },
  { name: "Amber", value: "#F59E0B", gradient: "from-amber-500 to-orange-500" },
];

const styles = [
  {
    id: "minimal" as const,
    name: "Minimal",
    desc: "Clean and focused",
    preview: "rounded-lg border border-white/10 bg-white/5 p-3",
  },
  {
    id: "modern" as const,
    name: "Modern",
    desc: "Glass and gradients",
    preview: "glass rounded-xl p-3",
  },
  {
    id: "bold" as const,
    name: "Bold",
    desc: "Strong and vibrant",
    preview: "rounded-xl bg-white/10 p-3 border border-white/15 shadow-lg",
  },
];

export function ThemeStep() {
  const { theme, setTheme, nextStep, prevStep } = useOnboardingStore();

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
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10"
          >
            <Palette className="h-8 w-8 text-accent" />
          </motion.div>
          <h2 className="mb-2 text-3xl font-bold">Choose Your Style</h2>
          <p className="text-muted-foreground">
            Personalize how your workspace looks and feels.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accent Color</CardTitle>
            <CardDescription>Pick a color that represents your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {accentColors.map((color, i) => (
                <motion.button
                  key={color.value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme({ accent: color.value })}
                  className={`relative flex flex-col items-center gap-2 rounded-xl p-4 transition-all ${
                    theme.accent === color.value
                      ? "bg-white/10 ring-2 ring-white/20"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full bg-gradient-to-br ${color.gradient} shadow-lg`}
                    style={{ boxShadow: `0 4px 20px ${color.value}40` }}
                  />
                  <span className="text-xs font-medium">{color.name}</span>
                  {theme.accent === color.value && (
                    <motion.div
                      layoutId="accent-check"
                      className="absolute right-2 top-2"
                    >
                      <Check className="h-4 w-4 text-emerald-400" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Interface Style</CardTitle>
            <CardDescription>Choose the overall design language</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {styles.map((style, i) => (
                <motion.button
                  key={style.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTheme({ style: style.id })}
                  className={`relative flex flex-col items-center gap-2 rounded-xl p-4 transition-all ${
                    theme.style === style.id
                      ? "bg-white/10 ring-2 ring-white/20"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className={style.preview}>
                    <div
                      className="h-2 w-16 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                  <span className="text-sm font-medium">{style.name}</span>
                  <span className="text-xs text-muted-foreground">{style.desc}</span>
                  {theme.style === style.id && (
                    <motion.div
                      layoutId="style-check"
                      className="absolute right-2 top-2"
                    >
                      <Check className="h-4 w-4 text-emerald-400" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={prevStep} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={nextStep} className="group gap-2">
            Continue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
