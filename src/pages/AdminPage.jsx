import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { today } from "../lib/utils";
import SubmissionList from "../components/SubmissionList";

export default function AdminPage() {
  const [submissions, setSubmissions] = useState([]);
  const [sites, setSites] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filters, setFilters] = useState({
    site: "",
    worker: "",
    from: "",
    to: "",
  });

  useEffect(() => {
    supabase
      .from("submissions")
      .select(
        "*, sites(name), profiles(full_name), submission_photos(storage_path)",
      )
      .order("work_date", { ascending: false })
      .then(({ data }) => setSubmissions(data ?? []));
    supabase
      .from("sites")
      .select("id, name")
      .order("name")
      .then(({ data }) => setSites(data ?? []));
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "framer")
      .order("full_name")
      .then(({ data }) => setWorkers(data ?? []));
  }, []);

  function handleFilterChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  // Filtering in the browser: fine for an internal tool with little data
  const filtered = submissions.filter(
    (s) =>
      (!filters.site || s.site_id === Number(filters.site)) &&
      (!filters.worker || s.user_id === filters.worker) &&
      (!filters.from || s.work_date >= filters.from) &&
      (!filters.to || s.work_date <= filters.to),
  );

  // Today summary
  const todaySubs = submissions.filter((s) => s.work_date === today());
  const missingToday = workers.filter(
    (w) => !todaySubs.some((s) => s.user_id === w.id),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-2 font-bold">Submitted today</h2>
          <ul className="space-y-1 text-sm">
            {sites.map((site) => {
              const names = todaySubs
                .filter((s) => s.site_id === site.id)
                .map((s) => s.profiles.full_name);
              return (
                <li key={site.id}>
                  <b>{site.name}:</b> {names.join(", ") || "—"}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card">
          <h2 className="mb-2 font-bold">
            Not submitted today ({missingToday.length})
          </h2>
          <ul className="space-y-1 text-sm text-red-700">
            {missingToday.map((w) => (
              <li key={w.id}>{w.full_name}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <select
          name="site"
          value={filters.site}
          onChange={handleFilterChange}
          className="input"
        >
          <option value="">All sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="worker"
          value={filters.worker}
          onChange={handleFilterChange}
          className="input"
        >
          <option value="">All workers</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.full_name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          value={filters.from}
          onChange={handleFilterChange}
          className="input"
        />
        <input
          type="date"
          name="to"
          value={filters.to}
          onChange={handleFilterChange}
          className="input"
        />
      </div>

      <SubmissionList submissions={filtered} showWorker />
    </div>
  );
}
