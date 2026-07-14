"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuthStore } from "@/store";
import { storeTokens } from "@/lib/auth";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setError } = useAuthStore();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setError(error === "access_denied" ? "GitHub sign-in was cancelled" : error);
      router.push("/login");
      return;
    }

    if (!code) {
      router.push("/login");
      return;
    }

    const exchangeCode = async () => {
      try {
        setStatus("Signing in with GitHub...");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: code }),
        });

        const data = await response.json();

        if (data.success) {
          storeTokens(data.data.accessToken, data.data.refreshToken);
          useAuthStore.setState({
            user: data.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          router.push("/dashboard");
        } else {
          setError(data.message || "GitHub sign-in failed");
          router.push("/login");
        }
      } catch {
        setError("GitHub sign-in failed. Please try again.");
        router.push("/login");
      }
    };

    exchangeCode();
  }, [searchParams, router, setError]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
