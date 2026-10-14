import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { contentService } from "../../services/api";

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  advtNo: "",
  title: "",
  postEn: "", postHi: "",
  educationEn: "", educationHi: "",
  locationEn: "", locationHi: "",
  incomeEn: "", incomeHi: "",
  incomeMin: "0", incomeMax: "0",
  ageLimitEn: "", ageLimitHi: "",
  ageAsOn: today(),
  applicationOpeningDate: today(),
  lastDate: "",
  selectionProcessEn: "",
  feeEn: "",
  advertisementFile: "",
  status: "Active",
});

// Hindi is required by the existing schema; fall back to English when left empty.
const toPayload = (f, existing) => {
  const bi = (en, hi) => ({ en: en.trim(), hi: (hi || en).trim() });
  return {
    advtNo: f.advtNo.trim(),
    title: f.title.trim(),
    post: bi(f.postEn, f.postHi),
    education: bi(f.educationEn, f.educationHi),
    location: bi(f.locationEn, f.locationHi),
    income: bi(f.incomeEn, f.incomeHi),
    incomeMin: Number(f.incomeMin) || 0,
    incomeMax: Number(f.incomeMax) || 0,
    ageLimit: bi(f.ageLimitEn, f.ageLimitHi),
    ageAsOn: f.ageAsOn,
    date: existing?.date || today(),
    applicationOpeningDate: f.applicationOpeningDate,
    lastDate: f.lastDate,
    selectionProcess: { en: f.selectionProcessEn, hi: existing?.selectionProcess?.hi || f.selectionProcessEn },
    fee: f.feeEn ? bi(f.feeEn, f.feeEn) : undefined,
    advertisementFile: f.advertisementFile,
    status: f.status,
  };
};

const fromJob = (j) => ({
  advtNo: j.advtNo || "",
  title: j.title || "",
  postEn: j.post?.en || "", postHi: j.post?.hi || "",
  educationEn: j.education?.en || "", educationHi: j.education?.hi || "",
  locationEn: j.location?.en || "", locationHi: j.location?.hi || "",
  incomeEn: j.income?.en || "", incomeHi: j.income?.hi || "",
  incomeMin: String(j.incomeMin ?? 0), incomeMax: String(j.incomeMax ?? 0),
  ageLimitEn: j.ageLimit?.en || "", ageLimitHi: j.ageLimit?.hi || "",
  ageAsOn: j.ageAsOn || today(),
  applicationOpeningDate: j.applicationOpeningDate || today(),
  lastDate: j.lastDate || "",
  selectionProcessEn: j.selectionProcess?.en || "",
  feeEn: j.fee?.en || "",
  advertisementFile: j.advertisementFile || "",
  status: j.status || "Active",
});

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

const Field = ({ label, children }) => (
  <label className="block text-xs font-semibold text-slate-600">
    <span className="block mb-1">{label}</span>
    {children}
  </label>
);

export default function JobsManager() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      const res = await contentService.getJobs();
      setJobs(res?.data?.postings || []);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const text = (key, props = {}) => <input className={inputCls} value={form[key]} onChange={set(key)} {...props} />;

  const reset = () => { setForm(emptyForm()); setEditing(null); setShowForm(false); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = toPayload(form, editing);
      if (editing) await contentService.updateJob(editing._id, payload);
      else await contentService.createJob(payload);
      toast.success(editing ? "Job updated" : "Job published");
      reset();
      load();
    } catch (err) {
      toast.error(err?.errors?.[0]?.msg || err?.message || "Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  const uploadPdf = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await contentService.uploadPdf(file);
      setForm((f) => ({ ...f, advertisementFile: res?.data?.url || "" }));
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggle = async (job) => {
    try {
      await contentService.updateJob(job._id, { status: job.status === "Active" ? "Inactive" : "Active" });
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const remove = async (job) => {
    if (!window.confirm(`Delete "${job.title}"?`)) return;
    try {
      await contentService.deleteJob(job._id);
      toast.success("Job deleted");
      load();
    } catch {
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">Published jobs appear on the landing page and /jobs, latest first.</p>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold">
            + New Job
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-slate-800">{editing ? "Edit Job" : "Create Job"}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Advertisement No. *">{text("advtNo", { required: true })}</Field>
            <Field label="Job Title *">{text("title", { required: true })}</Field>
            <Field label="Post (English) *">{text("postEn", { required: true })}</Field>
            <Field label="Post (Hindi)">{text("postHi")}</Field>
            <Field label="Qualification (English) *">{text("educationEn", { required: true })}</Field>
            <Field label="Qualification (Hindi)">{text("educationHi")}</Field>
            <Field label="Location (English) *">{text("locationEn", { required: true })}</Field>
            <Field label="Location (Hindi)">{text("locationHi")}</Field>
            <Field label="Salary / Income (English) *">{text("incomeEn", { required: true })}</Field>
            <Field label="Salary / Income (Hindi)">{text("incomeHi")}</Field>
            <Field label="Minimum income">{text("incomeMin", { type: "number", min: 0 })}</Field>
            <Field label="Maximum income">{text("incomeMax", { type: "number", min: 0 })}</Field>
            <Field label="Age limit (English) *">{text("ageLimitEn", { required: true })}</Field>
            <Field label="Age limit (Hindi)">{text("ageLimitHi")}</Field>
            <Field label="Age as on *">{text("ageAsOn", { type: "date", required: true })}</Field>
            <Field label="Application opening date *">{text("applicationOpeningDate", { type: "date", required: true })}</Field>
            <Field label="Last date *">{text("lastDate", { type: "date", required: true })}</Field>
            <Field label="Application fee">{text("feeEn")}</Field>
          </div>
          <Field label="Description / Selection process">
            <textarea className={inputCls} rows={3} value={form.selectionProcessEn} onChange={set("selectionProcessEn")} />
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Advertisement document (PDF/image)">
              <input type="file" accept="application/pdf,image/*" onChange={(e) => uploadPdf(e.target.files?.[0])} className="text-sm" />
              {uploading && <span className="text-xs text-slate-500">Uploading...</span>}
              {form.advertisementFile && (
                <a href={form.advertisementFile} target="_blank" rel="noopener noreferrer" className="block mt-1 text-xs text-primary-600 underline">View uploaded file</a>
              )}
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={set("status")}>
                <option value="Active">Published</option>
                <option value="Inactive">Unpublished</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-3">
            <button disabled={saving || uploading} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
              {saving ? "Saving..." : editing ? "Update Job" : "Publish Job"}
            </button>
            <button type="button" onClick={reset} className="px-5 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : jobs.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No jobs yet.</p>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{job.title}</p>
                <p className="text-xs text-slate-500">
                  Advt. {job.advtNo} · Last date {job.lastDate} ·{" "}
                  <span className={job.status === "Active" ? "text-green-600" : "text-slate-400"}>
                    {job.status === "Active" ? "Published" : "Unpublished"}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 text-xs font-semibold">
                <button onClick={() => toggle(job)} className="px-3 py-1.5 border border-slate-200 rounded-lg">
                  {job.status === "Active" ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => { setForm(fromJob(job)); setEditing(job); setShowForm(true); window.scrollTo(0, 0); }} className="px-3 py-1.5 border border-slate-200 rounded-lg">Edit</button>
                <button onClick={() => remove(job)} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
