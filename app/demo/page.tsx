"use client";

import { useEffect, useState } from "react";

export default function DemoPage() {
  const [userId, setUserId] = useState("user1");
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function check() {
      const res = await fetch(
        `/api/evaluate/new-checkout?userId=${encodeURIComponent(userId)}&env=dev`
      );
      const data = await res.json();
      if (active) setEnabled(data.enabled);
    }

    check();
    const timer = setInterval(check, 2000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [userId]);

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-2 text-2xl font-bold">Demo shop</h1>
      <p className="mb-6 text-sm text-gray-500">
        Ovvoru 2 seconds-kum flag-a check pannum. Dashboard-la toggle pannina,
        inga button maarum.
      </p>

      <label className="mb-1 block text-sm font-medium">User ID</label>
      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="mb-6 w-full rounded border px-3 py-2"
      />

      {enabled === null ? (
        <p>Checking...</p>
      ) : enabled ? (
        <button className="w-full rounded bg-green-600 px-4 py-3 font-medium text-white">
          Pay with New Checkout ✨
        </button>
      ) : (
        <button className="w-full rounded bg-gray-500 px-4 py-3 font-medium text-white">
          Pay (old checkout)
        </button>
      )}
    </main>
  );
}