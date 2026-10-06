// Checklist items. `key` = column name in the submissions table.
export const CHECKLIST = [
  { key: "hard_hat", label: "PPE: hard hat" },
  { key: "hi_vis_vest", label: "PPE: hi-vis vest" },
  { key: "safety_boots", label: "PPE: safety boots" },
  { key: "eye_protection", label: "PPE: eye protection" },
  { key: "fall_protection", label: "Fall protection in place" },
  {
    key: "ladders_scaffolding_inspected",
    label: "Ladders / scaffolding inspected",
  },
  { key: "tools_cords_ok", label: "Tools and cords in good condition" },
  { key: "hazards_identified", label: "Hazards identified" },
];

// Status is derived from the checklist, not stored
export function getStatus(submission) {
  const issues = CHECKLIST.filter((item) => !submission[item.key]).length;
  return issues === 0 ? "All clear" : `${issues} issue(s)`;
}

// Today as 'YYYY-MM-DD' in local time (toISOString() would use UTC and can return tomorrow)
export function today() {
  return new Date().toLocaleDateString("en-CA");
}
