"use client";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
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
  company: string | null;
  phone: string | null;
  status: "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Won" | "Lost";
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  last_discussion_note: string | null;
  last_discussion_at: string | null;
};

type Discussion = {
  id: number;
  lead_id: number;
  note: string;
  created_at: string;
  follow_up_at: string | null;
};

type DiscussionCreateResponse = {
  discussion: Discussion;
  lead: Lead;
};

function timeSince(value: string | null): string {
  if (!value) return "No discussions yet";

  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddLead, setShowAddLead] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [savingLead, setSavingLead] = useState(false);
  const [formError, setFormError] = useState("");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [discussionError, setDiscussionError] = useState("");
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [savingDiscussion, setSavingDiscussion] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    apiRequest<Lead[]>("/api/leads")
      .then(setLeads)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load leads.");
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = filter === "All" || lead.status === filter;
      const matchesSearch = lead.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [leads, filter, search]);

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const todaysFollowUps = leads.filter((lead) => {
    if (now === null || !lead.next_follow_up_at) return false;

    const followUp = new Date(lead.next_follow_up_at);

    return (
      followUp.getFullYear() === new Date(now).getFullYear() &&
      followUp.getMonth() === new Date(now).getMonth() &&
      followUp.getDate() === new Date(now).getDate()
    );
  });

  const overdueFollowUps = leads.filter((lead) => {
    if (now === null || !lead.next_follow_up_at) return false;

    return new Date(lead.next_follow_up_at).getTime() < now;
  });

  async function handleAddLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const name = newName.trim();

    if (!name) {
      setFormError("Lead name is required.");
      return;
    }

    setSavingLead(true);

    try {
      const created = await apiRequest<Lead>("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          name,
          company: newCompany.trim() || null,
          phone: newPhone.trim() || null,
        }),
      });

      setLeads((current) => [created, ...current]);
      setShowAddLead(false);
      setNewName("");
      setNewCompany("");
      setNewPhone("");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not create lead.",
      );
    } finally {
      setSavingLead(false);
    }
  }

  async function openLeadDetails(lead: Lead) {
    setSelectedLead(lead);
    setDiscussions([]);
    setNote("");
    setFollowUpDate("");
    setFollowUpTime("");
    setDiscussionError("");
    setLoadingDiscussions(true);

    try {
      const history = await apiRequest<Discussion[]>(
        `/api/leads/${lead.id}/discussions`,
      );
      setDiscussions(history);
    } catch (err) {
      setDiscussionError(
        err instanceof Error
          ? err.message
          : "Could not load discussion history.",
      );
    } finally {
      setLoadingDiscussions(false);
    }
  }

  function closeLeadDetails() {
    setSelectedLead(null);
    setDiscussions([]);
    setDiscussionError("");
  }

  async function handleStatusChange(newStatus: Lead["status"]) {
    if (!selectedLead || newStatus === selectedLead.status) return;

    setStatusSaving(true);
    setDiscussionError("");

    try {
      const updated = await apiRequest<Lead>(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setSelectedLead(updated);
      setLeads((current) =>
        current.map((lead) =>
          lead.id === updated.id ? { ...lead, ...updated } : lead,
        ),
      );
    } catch (err) {
      setDiscussionError(
        err instanceof Error ? err.message : "Could not update status.",
      );
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleAddDiscussion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedLead) return;

    const cleanNote = note.trim();

    if (!cleanNote) {
      setDiscussionError("Please enter a discussion note.");
      return;
    }

    if (Boolean(followUpDate) !== Boolean(followUpTime)) {
      setDiscussionError(
        "Choose both a follow-up date and time, or leave both empty.",
      );
      return;
    }

    setSavingDiscussion(true);
    setDiscussionError("");

    try {
      const followUpAt =
        followUpDate && followUpTime
          ? new Date(`${followUpDate}T${followUpTime}`).toISOString()
          : null;

      const result = await apiRequest<DiscussionCreateResponse>(
        `/api/leads/${selectedLead.id}/discussions`,
        {
          method: "POST",
          body: JSON.stringify({
            note: cleanNote,
            follow_up_at: followUpAt,
          }),
        },
      );

      setDiscussions((current) => [
        result.discussion,
        ...current.filter((item) => item.id !== result.discussion.id),
      ]);

      setSelectedLead(result.lead);
      setLeads((current) =>
        current.map((lead) =>
          lead.id === result.lead.id ? { ...lead, ...result.lead } : lead,
        ),
      );

      setNote("");
      setFollowUpDate("");
      setFollowUpTime("");
    } catch (err) {
      setDiscussionError(
        err instanceof Error ? err.message : "Could not save the discussion.",
      );
    } finally {
      setSavingDiscussion(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              LeadFlow
            </p>
            <h1 className="mt-2 text-3xl font-bold">Lead management</h1>
            <p className="mt-2 text-slate-500">
              Keep every conversation moving forward.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormError("");
                setShowAddLead(true);
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + Add New Lead
            </button>

            <span className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
              {leads.length} leads
            </span>
          </div>
        </header>

        {loading && <p>Loading leads...</p>}

        {error && <p className="text-red-600">Could not load leads: {error}</p>}

        <section className="grid gap-4 sm:grid-cols-3">
          <Stat label="Total leads" value={leads.length} />
          <Stat label="Today's follow-ups" value={todaysFollowUps.length} />
          <Stat
            label="Qualified"
            value={leads.filter((l) => l.status === "Qualified").length}
          />
        </section>

        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-red-700">
            Overdue follow-ups
          </h2>

          {now === null ? (
            <p className="mt-3 text-sm text-slate-500">
              Checking follow-ups...
            </p>
          ) : overdueFollowUps.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No overdue follow-ups.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {overdueFollowUps.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 p-3"
                >
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-xs text-red-700">Follow-up overdue</p>
                  </div>

                  <span className="text-sm text-red-700">
                    {new Date(lead.next_follow_up_at!).toLocaleString()}
                  </span>

                  <button
                    onClick={() => openLeadDetails(lead)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                  >
                    View details
                  </button>
                </div>
              ))}
            </div>
          )}
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
                    {new Date(lead.next_follow_up_at!).toLocaleString()}
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

          {showAddLead && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setShowAddLead(false);
                }
              }}
            >
              <form
                onSubmit={handleAddLead}
                className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
              >
                <div>
                  <h2 className="text-xl font-bold">Add New Lead</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add someone to your sales pipeline.
                  </p>
                </div>

                <label className="block space-y-1">
                  <span className="text-sm font-medium">Name *</span>
                  <input
                    required
                    maxLength={120}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter lead name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-sm font-medium">
                    Company (optional)
                  </span>
                  <input
                    maxLength={120}
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Company name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-sm font-medium">Phone (optional)</span>
                  <input
                    maxLength={40}
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>

                {formError && (
                  <p role="alert" className="text-sm text-red-600">
                    {formError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLead(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingLead}
                    className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                  >
                    {savingLead ? "Saving..." : "Create Lead"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {selectedLead && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) closeLeadDetails();
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="lead-dialog-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="lead-dialog-title" className="text-2xl font-bold">
                      {selectedLead.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedLead.company || "No company"}
                      {selectedLead.phone ? ` · ${selectedLead.phone}` : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeLeadDetails}
                    aria-label="Close lead details"
                    className="rounded-lg border px-3 py-1.5 hover:bg-slate-50"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-5">
                  <label
                    className="block text-sm font-medium"
                    htmlFor="lead-status"
                  >
                    Lead status
                  </label>
                  <select
                    id="lead-status"
                    value={selectedLead.status}
                    disabled={statusSaving}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as Lead["status"])
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {statuses
                      .filter((s) => s !== "All")
                      .map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
                </div>

                {discussionError && (
                  <p role="alert" className="mt-4 text-sm text-red-600">
                    {discussionError}
                  </p>
                )}

                <div className="mt-6">
                  <h3 className="text-lg font-semibold">Discussion history</h3>

                  {loadingDiscussions ? (
                    <p className="mt-3 text-sm text-slate-500">
                      Loading discussion history...
                    </p>
                  ) : discussions.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No discussions yet. Add the first note below.
                    </p>
                  ) : (
                    <ol className="mt-3 space-y-3">
                      {discussions.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <p className="whitespace-pre-wrap text-sm">
                            {item.note}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                          {item.follow_up_at && (
                            <p className="mt-1 text-xs text-indigo-700">
                              Follow-up:{" "}
                              {new Date(item.follow_up_at).toLocaleString()}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <form onSubmit={handleAddDiscussion} className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Add a discussion</h3>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Note *</span>
                    <textarea
                      required
                      maxLength={5000}
                      rows={4}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What did you discuss with this lead?"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>

                  <p className="text-sm text-slate-500">
                    Follow-up is optional. If you set one, choose both a date
                    and time.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-sm font-medium">
                        Follow-up date
                      </span>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-sm font-medium">
                        Follow-up time
                      </span>
                      <input
                        type="time"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeLeadDetails}
                      className="rounded-lg border border-slate-300 px-4 py-2"
                    >
                      Close
                    </button>

                    <button
                      type="submit"
                      disabled={savingDiscussion || loadingDiscussions}
                      className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                    >
                      {savingDiscussion ? "Saving..." : "Save discussion"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

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
                    className={`grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center ${
                      now !== null &&
                      lead.next_follow_up_at &&
                      new Date(lead.next_follow_up_at).getTime() < now
                        ? "border-l-4 border-red-500 bg-red-50"
                        : ""
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold">{lead.name}</h3>
                      <p className="text-sm text-slate-500">
                        {lead.company || "No company"}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        {lead.last_discussion_note ?? "No discussion yet"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Last discussion: {timeSince(lead.last_discussion_at)}
                        {lead.last_discussion_at && (
                          <>
                            {" "}
                            ·{" "}
                            {new Date(lead.last_discussion_at).toLocaleString()}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold">
                        {lead.status}
                      </span>
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() => openLeadDetails(lead)}
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
