import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, Search, Folder, FolderOpen, X, Copy, Trash2, Image as ImageIcon,
  UploadCloud, Check, ChevronRight, Plus,
} from "lucide-react";

const BRAND = "#9B0F5F";
const DEFAULT_FOLDERS = ["Products", "Banners", "Blog", "Uncategorized"];

type MediaFile = {
  id: number;
  filename: string;
  url: string;
  folder: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function ImageDimensions({ url }: { url: string }) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, [url]);
  if (!dims) return <span className="text-muted-foreground">—</span>;
  return <span>{dims.w} × {dims.h} px</span>;
}

export default function AdminMediaLibrary() {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("Uncategorized");
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState<string[]>([]);

  const folders = Array.from(
    new Set([
      ...DEFAULT_FOLDERS,
      ...customFolders,
      ...files.map((f) => f.folder),
    ])
  ).sort();

  const folderCounts: Record<string, number> = { All: files.length };
  for (const f of files) {
    folderCounts[f.folder] = (folderCounts[f.folder] ?? 0) + 1;
  }

  const filtered = files.filter((f) => {
    const matchFolder = selectedFolder === "All" || f.folder === selectedFolder;
    const matchSearch = !search || f.filename.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/media", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load media");
      const data: MediaFile[] = await res.json();
      setFiles(data);
    } catch {
      toast({ title: "Failed to load media", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, getToken]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  async function uploadFile(file: File, folder: string) {
    setUploading(true);
    try {
      const token = await getToken();
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/storage/uploads/server", {
        method: "POST",
        headers: authHeader,
        credentials: "include",
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Upload failed (${uploadRes.status})`);
      }
      const { url: publicUrl } = await uploadRes.json();

      const recordRes = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        credentials: "include",
        body: JSON.stringify({
          filename: file.name,
          url: publicUrl,
          folder,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!recordRes.ok) throw new Error("Failed to record media");

      const newFile: MediaFile = await recordRes.json();
      setFiles((prev) => [newFile, ...prev]);
      toast({ title: "Image uploaded", description: file.name });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, uploadFolder);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadFile(file, uploadFolder);
  }

  async function deleteFile(id: number) {
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Delete failed");
      setFiles((prev) => prev.filter((f) => f.id !== id));
      if (selectedFile?.id === id) setSelectedFile(null);
      setDeleteConfirm(null);
      toast({ title: "Image deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(window.location.origin + url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {files.length} image{files.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {folders.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFilePick}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ background: BRAND }}
            className="text-white hover:opacity-90"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading…" : "Upload Image"}
          </Button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Folder sidebar */}
        <aside className="w-48 flex-shrink-0 space-y-0.5">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground px-2 mb-2">
            Folders
          </p>
          {["All", ...folders].map((folder) => {
            const active = selectedFolder === folder;
            const count = folderCounts[folder] ?? 0;
            return (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                  active
                    ? "text-white font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                style={active ? { background: BRAND } : {}}
              >
                {active
                  ? <FolderOpen className="h-4 w-4 flex-shrink-0" />
                  : <Folder className="h-4 w-4 flex-shrink-0" />}
                <span className="flex-1 truncate">{folder}</span>
                <span className={`text-xs ${active ? "opacity-70" : "text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            );
          })}

          {addingFolder ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <Input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFolderName.trim()) {
                    setCustomFolders((p) => [...p, newFolderName.trim()]);
                    setSelectedFolder(newFolderName.trim());
                    setUploadFolder(newFolderName.trim());
                    setNewFolderName("");
                    setAddingFolder(false);
                  }
                  if (e.key === "Escape") setAddingFolder(false);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setAddingFolder(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setAddingFolder(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              New folder
            </button>
          )}
        </aside>

        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by filename…"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">Search</Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(""); setSearchInput(""); }}
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </form>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 mb-4 flex items-center justify-center gap-3 transition-colors ${
              dragOver ? "border-[#9B0F5F] bg-pink-50" : "border-muted"
            }`}
          >
            <UploadCloud className={`h-5 w-5 ${dragOver ? "text-[#9B0F5F]" : "text-muted-foreground"}`} />
            <p className={`text-sm ${dragOver ? "text-[#9B0F5F] font-medium" : "text-muted-foreground"}`}>
              {dragOver ? "Drop to upload" : "Drag & drop images here (JPG, PNG, WebP, GIF)"}
            </p>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 rounded-full border-2 border-[#9B0F5F] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
              <ImageIcon className="h-12 w-12 opacity-20" />
              <p className="text-sm">
                {search ? "No images match your search." : "No images in this folder yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filtered.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`group relative aspect-square rounded-md overflow-hidden border-2 transition-all bg-muted ${
                    selectedFile?.id === file.id
                      ? "border-[#9B0F5F]"
                      : "border-transparent hover:border-[#9B0F5F]/40"
                  }`}
                >
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] leading-tight truncate">{file.filename}</p>
                    <p className="text-white/70 text-[9px]">{formatSize(file.sizeBytes)}</p>
                  </div>
                  {selectedFile?.id === file.id && (
                    <div className="absolute top-1.5 right-1.5 bg-[#9B0F5F] rounded-full p-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedFile && (
          <aside className="w-72 flex-shrink-0 border-l pl-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Image Details</h3>
              <button onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
              <img
                src={selectedFile.url}
                alt={selectedFile.filename}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Filename</p>
                <p className="font-medium break-all">{selectedFile.filename}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Size</p>
                  <p>{formatSize(selectedFile.sizeBytes)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Type</p>
                  <p>{selectedFile.mimeType.replace("image/", "").toUpperCase()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Dimensions</p>
                  <ImageDimensions url={selectedFile.url} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Folder</p>
                  <p>{selectedFile.folder}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Uploaded</p>
                <p>{formatDate(selectedFile.uploadedAt)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Public URL</p>
              <div className="flex items-center gap-1.5">
                <Input
                  readOnly
                  value={window.location.origin + selectedFile.url}
                  className="text-xs h-8 font-mono"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => copyUrl(selectedFile.url)}
                  title="Copy URL"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const input = document.createElement("input");
                  input.value = window.location.origin + selectedFile.url;
                  document.body.appendChild(input);
                  input.select();
                  document.execCommand("copy");
                  document.body.removeChild(input);
                  toast({ title: "URL copied to clipboard" });
                }}
              >
                <ChevronRight className="h-4 w-4 mr-1" />
                Copy full URL
              </Button>
            </div>

            <div className="pt-2 border-t">
              {deleteConfirm === selectedFile.id ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive font-medium">Delete this image?</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => deleteFile(selectedFile.id)}
                    >
                      Yes, delete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setDeleteConfirm(selectedFile.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Image
                </Button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
