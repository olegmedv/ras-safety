import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { CHECKLIST, today } from "../lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function SubmissionForm({ profile, onSubmitted }) {
  const [sites, setSites] = useState([]);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("sites")
      .select("id, name")
      .order("name")
      .then(({ data }) => setSites(data ?? []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const files = formData.getAll("photos");

    // Required fields are checked by the browser (`required`), file size is checked here
    if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      setMessage({ type: "error", text: "Each photo must be under 5 MB." });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const submissionId = crypto.randomUUID();

      // 1. Upload photos into the user's own folder
      const paths = [];
      for (const file of files) {
        const path = `${profile.id}/${submissionId}/${crypto.randomUUID()}`;
        const { error } = await supabase.storage
          .from("safety-photos")
          .upload(path, file, { contentType: file.type });
        if (error) throw error;
        paths.push(path);
      }

      // 2. Save the form. Checkbox names match the column names.
      const checklist = Object.fromEntries(
        CHECKLIST.map((item) => [item.key, formData.has(item.key)]),
      );
      const { error } = await supabase.from("submissions").insert({
        id: submissionId,
        user_id: profile.id,
        site_id: Number(formData.get("site_id")),
        work_date: formData.get("work_date"),
        notes: formData.get("notes"),
        ...checklist,
      });
      if (error) throw error;

      // 3. Link the photos to the form
      const { error: photosError } = await supabase
        .from("submission_photos")
        .insert(
          paths.map((path) => ({
            submission_id: submissionId,
            storage_path: path,
          })),
        );
      if (photosError) throw photosError;

      form.reset();
      setMessage({ type: "success", text: "Safety form submitted!" });
      onSubmitted();
    } catch (err) {
      console.error(err);
      const text =
        err.code === "23505"
          ? "You already submitted a form for this site and date."
          : "Something went wrong. Please try again.";
      setMessage({ type: "error", text });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Daily Safety Form</h1>
      <p>
        Worker: <b>{profile.full_name}</b>
      </p>

      <select name="site_id" required defaultValue="" className="input">
        <option value="" disabled>
          Select job site…
        </option>
        {sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        name="work_date"
        required
        defaultValue={today()}
        max={today()}
        className="input"
      />

      <fieldset className="space-y-2">
        <legend className="mb-1 font-semibold">Safety checklist</legend>
        {CHECKLIST.map((item) => (
          <label key={item.key} className="flex items-center gap-3">
            <input
              type="checkbox"
              name={item.key}
              className="h-5 w-5 accent-ras-primary"
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      <textarea
        name="notes"
        rows={3}
        placeholder="Notes: hazards, issues…"
        className="input"
      />

      <label className="block">
        <span className="font-semibold">
          Photos (JPG / PNG / WebP, max 5 MB each)
        </span>
        <input
          type="file"
          name="photos"
          multiple
          required
          accept="image/jpeg,image/png,image/webp"
          className="mt-1 block w-full"
        />
      </label>

      {message && (
        <p
          className={
            message.type === "error" ? "text-red-600" : "text-green-700"
          }
        >
          {message.text}
        </p>
      )}

      <button disabled={submitting} className="btn w-full py-3">
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
