import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { contentService } from "../../services/api";

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

// kind: "gallery" (photo gallery) or "scroller" (home slider)
export default function ImagesManager({ kind }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await contentService.getImages(kind);
      setItems(res?.data?.images || []);
    } catch {
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { setLoading(true); load(); }, [kind]);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Choose an image");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("title", title);
      if (kind === "scroller") fd.append("link", link);
      await contentService.createImage(kind, fd);
      toast.success("Image published");
      setTitle(""); setLink(""); setFile(null);
      e.target.reset();
      load();
    } catch (err) {
      toast.error(err?.message || err?.error || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (img) => {
    try {
      await contentService.updateImage(kind, img._id, { isActive: !img.isActive });
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const remove = async (img) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await contentService.deleteImage(kind, img._id);
      load();
    } catch {
      toast.error("Failed to delete image");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 grid md:grid-cols-2 gap-4">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
        <input className={inputCls} placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        {kind === "scroller" && (
          <input className={inputCls} placeholder="Link when clicked (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
        )}
        <div>
          <button disabled={saving} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
            {saving ? "Uploading..." : "Upload & Publish"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No images yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
          {items.map((img) => (
            <div key={img._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <img src={img.imageUrl} alt={img.title || ""} className="w-full h-28 object-cover" />
              <div className="p-2 space-y-2">
                <p className="text-xs text-slate-600 truncate">{img.title || "Untitled"}</p>
                <div className="flex gap-2 text-[11px] font-semibold">
                  <button onClick={() => toggle(img)} className="flex-1 py-1 border border-slate-200 rounded-lg">
                    {img.isActive ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => remove(img)} className="flex-1 py-1 border border-red-200 text-red-600 rounded-lg">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
