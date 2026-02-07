"use client";

import { sendNotify } from "@/lib/api";
import { useState } from "react";

export default function NotifyPage() {
  const [target, setTarget] = useState<"all" | "emails">("all");
  const [emailsText, setEmailsText] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !body.trim()) {
      setMessage("Title or message is required.");
      setStatus("error");
      return;
    }
    if (!sendEmail && !sendPush) {
      setMessage("Select at least one: Email or Push.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const emails = target === "emails" ? emailsText.split(/[\n,]+/).map((e) => e.trim()).filter(Boolean) : undefined;
      const res = await sendNotify({
        target,
        emails,
        title: title.trim(),
        body: body.trim(),
        sendEmail,
        sendPush,
      });
      setMessage(`Sent: ${res.emailCount} email(s), ${res.pushCount} push(es) to ${res.userCount} user(s).`);
      setStatus("success");
      setTitle("");
      setBody("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to send.");
      setStatus("error");
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-amber-400">Send notification</h1>
      <p className="mb-6 text-stone-400">Send email and/or push notifications to users.</p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-700 bg-stone-900/50 p-6">
        <div>
          <label className="block text-sm font-medium text-stone-400">Audience</label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="target"
                checked={target === "all"}
                onChange={() => setTarget("all")}
                className="rounded border-stone-600 bg-stone-800 text-amber-500"
              />
              <span>All users</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="target"
                checked={target === "emails"}
                onChange={() => setTarget("emails")}
                className="rounded border-stone-600 bg-stone-800 text-amber-500"
              />
              <span>Specific emails</span>
            </label>
          </div>
        </div>

        {target === "emails" && (
          <div>
            <label className="block text-sm font-medium text-stone-400">Emails (one per line or comma-separated)</label>
            <textarea
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              rows={3}
              placeholder="user1@example.com, user2@example.com"
              className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-400">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-400">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Notification body (email and push)"
            className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-400">Channels</label>
          <div className="mt-2 flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded border-stone-600 bg-stone-800 text-amber-500"
              />
              <span>Email</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sendPush}
                onChange={(e) => setSendPush(e.target.checked)}
                className="rounded border-stone-600 bg-stone-800 text-amber-500"
              />
              <span>Push (mobile app)</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-lg bg-amber-600 py-2 font-medium text-black hover:bg-amber-500 disabled:opacity-50"
        >
          {status === "loading" ? "Sending…" : "Send notification"}
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
