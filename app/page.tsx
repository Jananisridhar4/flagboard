"use client";

import { useEffect, useState } from "react";

type Flag = {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  rolloutPercent: number;
  environment: string;
};

type Update = { enabled?: boolean; rolloutPercent?: number };

function FlagRow({
  flag,
  onUpdate,
}: {
  flag: Flag;
  onUpdate: (id: string, data: Update) => void;
}) {
  const [percent, setPercent] = useState(flag.rolloutPercent);

  useEffect(() => {
    setPercent(flag.rolloutPercent);
  }, [flag.rolloutPercent]);

  const commit = () => {
    if (percent !== flag.rolloutPercent) {
      onUpdate(flag.id, { rolloutPercent: percent });
    }
  };

  return (
    <li className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{flag.name}</p>
          <p className="text-sm text-gray-500">
            {flag.key} · {flag.environment}
          </p>
        </div>

        <button
          onClick={() => onUpdate(flag.id, { enabled: !flag.enabled })}
          className={`rounded-full px-4 py-1 text-sm font-medium text-white ${
            flag.enabled ? "bg-green-600" : "bg-gray-400"
          }`}
        >
          {flag.enabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          onPointerUp={commit}
          onKeyUp={commit}
          className="w-full"
        />
        <span className="w-12 text-right text-sm font-medium">{percent}%</span>
      </div>
    </li>
  );
}

export default function Home() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [environment, setEnvironment] = useState("dev");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/flags");
    setFlags(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function update(id: string, data: Update) {
    await fetch(`/api/flags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await load();
  }

  async function createFlag(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, name, environment }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? data.errors?.[0]?.message ?? "Something went wrong");
      return;
    }

    setName("");
    setKey("");
    await load();
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-3xl font-bold">FlagBoard</h1>

      <form
        onSubmit={createFlag}
        className="mb-8 space-y-3 rounded-lg border p-4"
      >
        <h2 className="font-semibold">Create flag</h2>

        <div className="flex flex-wrap gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (New Checkout)"
            required
            className="flex-1 rounded border px-3 py-2"
          />
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="key (new-checkout)"
            required
            className="flex-1 rounded border px-3 py-2"
          />
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="dev">dev</option>
            <option value="staging">staging</option>
            <option value="prod">prod</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Create
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {!loading && flags.length === 0 && <p>No flags yet.</p>}

      <ul className="space-y-3">
        {flags.map((flag) => (
          <FlagRow key={flag.id} flag={flag} onUpdate={update} />
        ))}
      </ul>
    </main>
  );
}