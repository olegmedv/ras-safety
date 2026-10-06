import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import SubmissionForm from "../components/SubmissionForm";
import SubmissionList from "../components/SubmissionList";

export default function FramerPage({ profile }) {
  const [submissions, setSubmissions] = useState([]);
  const [reloadKey, setReloadKey] = useState(0); // bump to reload the list

  useEffect(() => {
    supabase
      .from("submissions")
      .select(
        "*, sites(name), profiles(full_name), submission_photos(storage_path)",
      )
      .eq("user_id", profile.id)
      .order("work_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setSubmissions(data ?? []);
      });
  }, [profile.id, reloadKey]);

  return (
    <div className="space-y-8">
      <SubmissionForm
        profile={profile}
        onSubmitted={() => setReloadKey((k) => k + 1)}
      />
      <section className="space-y-3">
        <h2 className="text-xl font-bold">My submissions</h2>
        <SubmissionList submissions={submissions} />
      </section>
    </div>
  );
}
