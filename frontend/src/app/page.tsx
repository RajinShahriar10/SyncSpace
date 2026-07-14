import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />

      <main className="relative z-10 flex flex-col items-center gap-8 text-center">
        <div className="glass-strong rounded-2xl px-6 py-2 text-sm text-muted-foreground">
          Enterprise Real-Time Collaboration Platform
        </div>

        <h1 className="text-6xl font-bold tracking-tight sm:text-8xl">
          <span className="gradient-text">SyncSpace</span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          The unified collaborative workspace. Documents, boards, messaging, and real-time
          collaboration — all in one premium platform.
        </p>

        <div className="flex gap-4">
          <Link href="/login">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10"
            >
              Create Account
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-sm text-muted-foreground">
          <div className="glass rounded-xl px-8 py-6">
            <div className="text-2xl font-bold text-primary">Real-Time</div>
            <div>Live collaboration</div>
          </div>
          <div className="glass rounded-xl px-8 py-6">
            <div className="text-2xl font-bold text-secondary">Unified</div>
            <div>All tools in one place</div>
          </div>
          <div className="glass rounded-xl px-8 py-6">
            <div className="text-2xl font-bold text-accent">Secure</div>
            <div>Enterprise-grade</div>
          </div>
        </div>
      </main>
    </div>
  );
}
