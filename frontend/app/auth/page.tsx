"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleEmailAuth = async () => {
    setMessage(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(result.user, { displayName: name.trim() });
        }
        setMessage("Account created. You are signed in.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("Signed in successfully.");
      }
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setMessage(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setMessage("Signed in with Google.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <div className="mobile-only flex min-h-dvh flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">
              {mode === "signup" ? "Create account" : "Sign in"}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Use email/password or Google.
            </p>
          </div>

          {mode === "signup" ? (
            <input
              className="w-full rounded-md border border-[var(--border)] bg-transparent px-4 py-3 text-sm"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : null}

          <input
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-4 py-3 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
          />
          <input
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-4 py-3 text-sm"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full rounded-md border border-[var(--border)] bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--background)] disabled:opacity-60"
            onClick={handleEmailAuth}
            disabled={loading || !email || !password || (mode === "signup" && !name)}
            type="button"
          >
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <div className="flex items-center gap-3 text-[var(--muted)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <button
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-4 py-3 text-sm font-semibold disabled:opacity-60"
            onClick={handleGoogle}
            disabled={loading}
            type="button"
          >
            Continue with Google
          </button>

          {message ? (
            <p className="text-center text-sm text-[var(--muted)]">{message}</p>
          ) : null}

          <button
            className="text-center text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setMessage(null);
            }}
            type="button"
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "Need an account? Create one"}
          </button>
        </div>
      </div>
    </main>
  );
}
