import React, { useState } from "react";
import JobsManager from "./JobsManager";
import NotificationsManager from "./NotificationsManager";
import ImagesManager from "./ImagesManager";

const tabs = [
  { id: "jobs", label: "Jobs" },
  { id: "notifications", label: "Notifications" },
  { id: "scroller", label: "Home Slider" },
  { id: "gallery", label: "Gallery" },
];

export default function LandingContent() {
  const [tab, setTab] = useState("jobs");

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Landing Content</h1>
        <p className="text-sm text-slate-500">Content published here appears on the public website automatically.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === t.id ? "bg-primary-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "jobs" && <JobsManager />}
      {tab === "notifications" && <NotificationsManager />}
      {(tab === "scroller" || tab === "gallery") && <ImagesManager key={tab} kind={tab} />}
    </div>
  );
}
