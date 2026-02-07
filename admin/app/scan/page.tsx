"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rewardUser } from "@/lib/api";

const OFFERS = [
  { id: "double-points", label: "Double points" },
  { id: "500-off", label: "500 pts = $10 off" },
  { id: "free-karaoke", label: "Free karaoke hour" },
  { id: "free-shot", label: "200 pts = free shot" },
  { id: "happy-hour", label: "Happy hour 2×" },
];

export default function ScanPage() {
  const [decodedEmail, setDecodedEmail] = useState<string | null>(null);
  const [billAmount, setBillAmount] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<{ stop: () => Promise<void> } | null>(null);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      await html5QrRef.current.stop();
      html5QrRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || typeof window === "undefined") return;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5Qr = new Html5Qrcode("qr-reader");
      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.type === "member" && data.email) {
              setDecodedEmail(data.email);
              stopScanner();
            }
          } catch {
            setDecodedEmail(decodedText);
            stopScanner();
          }
        },
        () => {}
      );
      html5QrRef.current = html5Qr;
      setCameraActive(true);
    } catch (e) {
      setMessage("Camera not available. Use file or enter email.");
    }
  }, [stopScanner]);

  useEffect(() => {
    return () => {
      if (html5QrRef.current) html5QrRef.current.stop();
    };
  }, []);

  const handleFileScan = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || typeof window === "undefined") return;
      (async () => {
        try {
          const { Html5Qrcode } = await import("html5-qrcode");
          const html5Qr = new Html5Qrcode("qr-reader");
          const result = await html5Qr.scanFile(file, true);
          try {
            const data = JSON.parse(result);
            if (data.type === "member" && data.email) setDecodedEmail(data.email);
            else setDecodedEmail(result);
          } catch {
            setDecodedEmail(result);
          }
        } catch {
          setMessage("Could not read QR from file.");
        }
        e.target.value = "";
      })();
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = decodedEmail?.trim() || (e.target as HTMLFormElement).querySelector<HTMLInputElement>("input[name=email]")?.value?.trim();
    if (!email) {
      setMessage("Enter or scan a member email.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const amount = Number(billAmount);
      if (!(amount > 0)) {
        setMessage("Enter a valid bill amount.");
        setStatus("error");
        return;
      }
      const res = await rewardUser(email, amount, selectedOffer || undefined);
      setMessage(`${res.user.name}: $${res.amount.toFixed(2)} → ${res.pointsAdded} pts (10 per $100). Total: ${res.user.points} pts. ${res.offerApplied ? "Offer applied." : ""}`);
      setStatus("success");
      setDecodedEmail(null);
      setBillAmount("");
      setSelectedOffer("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to apply reward");
      setStatus("error");
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-amber-400">Scan member QR</h1>
      <p className="mb-6 text-stone-400">Scan to add points or apply an offer.</p>

      <div className="mb-6">
        <div id="qr-reader" ref={scannerRef} className="mb-2 max-w-sm overflow-hidden rounded-lg border border-stone-700 bg-black" />
        <div className="flex flex-wrap gap-2">
          {!cameraActive ? (
            <button
              type="button"
              onClick={startScanner}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-black hover:bg-amber-500"
            >
              Start camera
            </button>
          ) : (
            <button
              type="button"
              onClick={stopScanner}
              className="rounded-lg bg-stone-600 px-4 py-2 text-sm font-medium hover:bg-stone-500"
            >
              Stop camera
            </button>
          )}
          <label className="cursor-pointer rounded-lg border border-stone-600 bg-stone-800 px-4 py-2 text-sm font-medium hover:bg-stone-700">
            Upload QR image
            <input type="file" accept="image/*" className="hidden" onChange={handleFileScan} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-700 bg-stone-900/50 p-6">
        <div>
          <label className="block text-sm font-medium text-stone-400">Member email</label>
          <input
            name="email"
            type="email"
            value={decodedEmail ?? ""}
            onChange={(e) => setDecodedEmail(e.target.value)}
            placeholder="From QR or type here"
            className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-400">Bill amount ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
            placeholder="e.g. 125.00"
            className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-stone-500">10 pts per $100 (calculated automatically)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-400">Apply offer</label>
          <select
            value={selectedOffer}
            onChange={(e) => setSelectedOffer(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="">None</option>
            {OFFERS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={status === "loading" || !billAmount.trim()}
          className="w-full rounded-lg bg-amber-600 py-2 font-medium text-black hover:bg-amber-500 disabled:opacity-50"
        >
          {status === "loading" ? "Applying…" : "Apply reward"}
        </button>
        {message && (
          <p className={`text-sm ${status === "success" ? "text-green-400" : status === "error" ? "text-red-400" : "text-stone-400"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
