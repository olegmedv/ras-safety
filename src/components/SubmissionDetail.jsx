import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { CHECKLIST, getStatus } from "../lib/utils";

export default function SubmissionDetail({ submission, onBack }) {
  const [photoUrls, setPhotoUrls] = useState([]);

  // Private bucket -> temporary links (valid for 1 hour)
  useEffect(() => {
    const paths = submission.submission_photos.map((p) => p.storage_path);
    if (paths.length === 0) return;
    supabase.storage
      .from("safety-photos")
      .createSignedUrls(paths, 3600)
      .then(({ data }) => setPhotoUrls((data ?? []).map((d) => d.signedUrl)));
  }, [submission]);

  return (
    <div className="card space-y-4">
      <button onClick={onBack} className="text-ras-primary underline">
        ← Back
      </button>

      <div>
        <h2 className="text-xl font-bold">{submission.sites.name}</h2>
        <p className="text-gray-600">
          {submission.profiles.full_name} · {submission.work_date} ·{" "}
          {getStatus(submission)}
        </p>
      </div>

      <ul className="grid gap-1 sm:grid-cols-2">
        {CHECKLIST.map((item) => (
          <li key={item.key}>
            {submission[item.key] ? "✅" : "❌"} {item.label}
          </li>
        ))}
      </ul>

      <p className="whitespace-pre-wrap">{submission.notes || "No notes"}</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photoUrls.map((url) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            <img
              src={url}
              alt="Submission photo"
              className="aspect-square w-full rounded object-cover"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
