import { useState } from "react";
import { getStatus } from "../lib/utils";
import SubmissionDetail from "./SubmissionDetail";

export default function SubmissionList({ submissions, showWorker = false }) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <SubmissionDetail
        submission={selected}
        onBack={() => setSelected(null)}
      />
    );
  }
  if (submissions.length === 0) {
    return <p className="text-gray-500">No submissions found.</p>;
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Date</th>
            {showWorker && <th className="p-3">Worker</th>}
            <th className="p-3">Site</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr
              key={s.id}
              onClick={() => setSelected(s)}
              className="cursor-pointer border-t border-gray-200 hover:bg-gray-50"
            >
              <td className="p-3">{s.work_date}</td>
              {showWorker && <td className="p-3">{s.profiles.full_name}</td>}
              <td className="p-3">{s.sites.name}</td>
              <td className="p-3">{getStatus(s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
