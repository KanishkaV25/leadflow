
"use client";

import { useMemo, useState } from "react";

const statuses = [
  "All",
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
] as const;

type Status = Exclude<(typeof statuses)[number], "All">;

type Lead = {
  id: number;
  name: string;
  company: string;
  status: Status;
  note: string;
  followUp: string | null;
};

const initialLeads: Lead[] = [
  {
    id: 1,
    name: "Sarah Connor",
    company: "Acme Corp",
    status: "Proposal Sent",
    note: "Sent pricing proposal for review.",
    followUp: "2026-10-16T10:00:00+05:30",
  },
  {
    id: 2,
    name: "Hank Scorpio",
    company: "Globex",
    status: "New",
    note: "Inbound lead from website.",
    followUp: null,
  },
  {
    id: 3,
    name: "Diana Prince",
    company: "Themyscira Consulting",
    status: "Qualified",
    note: "Discussing requirements.",
    followUp: null,
  },
];

export default function Home() {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const visibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus =
        filter === "All" || lead.status === filter;
      const matchesSearch = lead.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [leads, filter, search]);

  const today = new Date().toDateString();

  const todaysFollowUps = leads.filter((lead) => {
    if (!lead.followUp) return false;
    return new Date(lead.followUp).toDateString() === today;
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              LeadFlow
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Lead management
            </h1>
            <p className="mt-2 text-slate-500">
              Keep every conversation moving forward.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
            {leads.length} leads
          </span>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Stat label="Total leads" value={leads.length} />
          <Stat
            label="Today's follow-ups"
            value={todaysFollowUps.length}
          />
          <Stat
            label="Qualified"
            value={leads.filter((l) => l.status === "Qualified").length}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Today's follow-ups</h2>
          {todaysFollowUps.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No follow-ups scheduled for today.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {todaysFollowUps.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-wrap justify-between gap-2 rounded-xl bg-indigo-50 p-3"
                >
                  <span className="font-medium">{lead.name}</span>
                  <span className="text-sm text-indigo-700">
                    {new Date(lead.followUp!).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">All leads</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and filter your pipeline.
              </p>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by lead name..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-indigo-500 sm:w-64"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === status
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {visibleLeads.length === 0 ? (
              <p className="p-8 text-center text-slate-500">
                No matching leads found.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleLeads.map((lead) => (
                  <article
                    key={lead.id}
                    className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <h3 className="font-semibold">{lead.name}</h3>
                      <p className="text-sm text-slate-500">
                        {lead.company || "No company"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {lead.note || "No discussion yet"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold">
                        {lead.status}
                      </span>
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() =>
                          alert(`We'll add the discussion dialog for ${lead.name} next.`)
                        }
                      >
                        View details
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
