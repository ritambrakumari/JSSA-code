import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { contentService } from "../../services/api";

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";
const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({ title: "", url: "", notificationDate: today(), isActive: true });

export default function NotificationsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const res = await contentService.getNotifications();
      setItems(res?.data?.notifications || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setForm(empty()); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await contentService.updateNotification(editingId, form);
      else await contentService.createNotification(form);
      toast.success(editingId ? "Notification updated" : "Notification published");
      reset();
      load();
    } catch (err) {
      toast.error(err?.errors?.[0]?.msg || err?.message || "Failed to save notification");
    } finally {
      setSaving(false);
    }
  };

  const uploadDoc = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await contentService.uploadPdf(file);
      setForm((f) => ({ ...f, url: res?.data?.url || f.url }));
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggle = async (n) => {
    try {
      await contentService.updateNotification(n._id, { isActive: !n.isActive });
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const remove = async (n) => {
    if (!window.confirm(`Delete "${n.title}"?`)) return;
    try {
      await contentService.deleteNotification(n._id);
      load();
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const edit = (n) => {
    setEditingId(n._id);
    setForm({
      title: n.title || "",
      url: n.url || "",
      notificationDate: n.notificationDate ? String(n.notificationDate).slice(0, 10) : today(),
      isActive: n.isActive !== false,
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-slate-800">{editingId ? "Edit Notification" : "Create Notification"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-xs font-semibold text-slate-600 md:col-span-2">
            <span className="block mb-1">Title *</span>
            <input className={inputCls} required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            <span className="block mb-1">Date</span>
            <input type="date" className={inputCls} value={form.notificationDate} onChange={(e) => setForm({ ...form, notificationDate: e.target.value })} />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            <span className="block mb-1">Status</span>
            <select className={inputCls} value={form.isActive ? "1" : "0"} onChange={(e) => setForm({ ...form, isActive: e.target.value === "1" })}>
              <option value="1">Published</option>
              <option value="0">Unpublished</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            <span className="block mb-1">Document / link URL</span>
            <input className={inputCls} maxLength={500} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            <span className="block mb-1">Or upload PDF / image</span>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => uploadDoc(e.target.files?.[0])} className="text-sm" />
            {uploading && <span className="text-xs text-slate-500">Uploading...</span>}
          </label>
        </div>
        <div className="flex gap-3">
          <button disabled={saving || uploading} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Update" : "Publish"}
          </button>
          {editingId && <button type="button" onClick={reset} className="px-5 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No notifications yet.</p>
        ) : (
          items.map((n) => (
            <div key={n._id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{n.title}</p>
                <p className="text-xs text-slate-500">
                  {n.notificationDate ? new Date(n.notificationDate).toLocaleDateString("en-IN") : ""} ·{" "}
                  <span className={n.isActive ? "text-green-600" : "text-slate-400"}>{n.isActive ? "Published" : "Unpublished"}</span>
                  {n.url && <> · <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">View</a></>}
                </p>
              </div>
              <div className="flex gap-2 text-xs font-semibold">
                <button onClick={() => toggle(n)} className="px-3 py-1.5 border border-slate-200 rounded-lg">{n.isActive ? "Unpublish" : "Publish"}</button>
                <button onClick={() => edit(n)} className="px-3 py-1.5 border border-slate-200 rounded-lg">Edit</button>
                <button onClick={() => remove(n)} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
