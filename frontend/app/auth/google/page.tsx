"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getRedirectResult, signInWithRedirect } from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type Status = "idle" | "redirecting" | "success" | "sending" | "error";

function pickRedirectUrl(params: URLSearchParams): string | null {
  return params.get("redirect_uri") || params.get("redirect") || null;
}

async function redirectToAppWithCode(mobileRedirectUri: string) {
  const user = auth.currentUser;
  if (!user) return false;
  const res = await fetch(`${API_BASE}/auth/mobile-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firebaseUid: user.uid,
      email: user.email ?? undefined,
      name: user.displayName ?? undefined,
      redirect_uri: mobileRedirectUri,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string; message?: string }).error ||
        (data as { error?: string; message?: string }).message ||
        "Could not complete sign-in for app."
    );
  }
  const { code } = data as { code?: string };
  if (!code) {
    throw new Error("Server did not provide an authentication code.");
  }
  const sep = mobileRedirectUri.includes("?") ? "&" : "?";
  window.location.href = `${mobileRedirectUri}${sep}code=${encodeURIComponent(code)}`;
  return true;
}

export default function GoogleAuthPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const mobileRedirect = useMemo(
    () => pickRedirectUrl(searchParams),
    [searchParams]
  );

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        // 1) Always call getRedirectResult first (one-time read after return from Google)
        const result = await getRedirectResult(auth);

        if (result?.user) {
          if (mobileRedirect) {
            if (mounted) setStatus("sending");
            await redirectToAppWithCode(mobileRedirect);
            return;
          }
          if (mounted) setStatus("success");
          return;
        }

        // 2) Already signed in (e.g. from a previous visit or WebView where getRedirectResult was null)
        if (auth.currentUser && mobileRedirect) {
          if (mounted) setStatus("sending");
          await redirectToAppWithCode(mobileRedirect);
          return;
        }

        // 3) In WebViews, getRedirectResult sometimes returns null after return from Google;
        //    give auth a moment to hydrate then check currentUser once.
        if (mobileRedirect && result === null) {
          await new Promise((r) => setTimeout(r, 800));
          if (!mounted) return;
          if (auth.currentUser) {
            setStatus("sending");
            await redirectToAppWithCode(mobileRedirect);
            return;
          }
        }

        // 4) Not signed in: redirect to Google
        if (mounted) {
          setStatus("redirecting");
          await signInWithRedirect(auth, googleProvider);
        }
      } catch (err) {
        if (!mounted) return;
        setStatus("error");
        setError((err as Error).message);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [mobileRedirect]);

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Continue with Google</h1>
        {status === "redirecting" && (
          <p className="text-sm text-[var(--muted)]">
            Redirecting to Google sign-in...
          </p>
        )}
        {status === "sending" && (
          <p className="text-sm text-[var(--muted)]">
            Signed in. Sending you back to the app…
          </p>
        )}
        {status === "success" && (
          <p className="text-sm text-[var(--muted)]">
            Signed in. You can return to the app.
          </p>
        )}
        {status === "error" && (
          <div className="text-sm text-red-400">
            <p>Google sign-in failed.</p>
            {error ? <p>{error}</p> : null}
          </div>
        )}
        {status === "idle" && (
          <p className="text-sm text-[var(--muted)]">Preparing sign-in...</p>
        )}
      </div>
    </main>
  );
}
