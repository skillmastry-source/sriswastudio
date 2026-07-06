import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload, Search, Folder, FolderOpen, X, Check,
  UploadCloud, Image as ImageIcon,
} from "lucide-react";

const BRAND = "#9B0F5F";
const DEFAULT_FOLDERS = ["All", "Products", "Banners", "Blog", "Uncategorized"];

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

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [search, setSearch] = useState("");
  const [hoveredFile, setHoveredFile] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("Uncategorized");

  const allFolders = Array.from(
    new Set([...DEFAULT_FOLDERS, ...files.map((f) => f.folder)])
  );

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
      setFiles(await res.json());
    } catch {
      toast({ title: "Failed to load media", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, getToken]);

  useEffect(() => {
    if (open) loadFiles();
  }, [open, loadFiles]);

  async function uploadFile(file: File) {
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
          folder: uploadFolder,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!recordRes.ok) throw new Error("Record error");

      const newFile: MediaFile = await recordRes.json();
      setFiles((prev) => [newFile, ...prev]);
      toast({ title: "Uploaded", description: file.name });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="font-serif text-lg">Media Library</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Folder sidebar */}
          <aside className="w-44 border-r px-3 py-4 space-y-0.5 flex-shrink-0 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground px-2 mb-2">
              Folders
            </p>
            {allFolders.map((folder) => {
              const active = selectedFolder === folder;
              const count = folder === "All" ? files.length : files.filter((f) => f.folder === folder).length;
              return (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                    active ? "text-white font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  style={active ? { background: BRAND } : {}}
                >
                  {active
                    ? <FolderOpen className="h-3.5 w-3.5 flex-shrink-0" />
                    : <Folder className="h-3.5 w-3.5 flex-shrink-0" />}
                  <span className="flex-1 truncate text-xs">{folder}</span>
                  <span className={`text-[10px] ${active ? "opacity-70" : "text-muted-foreground"}`}>{count}</span>
                </button>
              );
            })}
          </aside>

          {/* Main area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {allFolders.filter((f) => f !== "All").map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                  e.target.value = "";
                }}
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ background: BRAND }}
                className="text-white hover:opacity-90 h-8 text-xs"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`mx-4 mt-3 mb-2 border-2 border-dashed rounded-md flex items-center justify-center gap-2 py-3 transition-colors text-sm ${
                dragOver ? "border-[#9B0F5F] bg-pink-50 text-[#9B0F5F]" : "border-muted text-muted-foreground"
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              Drop image here to upload
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-7 w-7 rounded-full border-2 border-[#9B0F5F] border-t-transparent animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <ImageIcon className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No images found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {filtered.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => { onSelect(file.url); onClose(); }}
                      onMouseEnter={() => setHoveredFile(file.id)}
                      onMouseLeave={() => setHoveredFile(null)}
                      className="group relative aspect-square rounded-md overflow-hidden border-2 transition-all bg-muted hover:border-[#9B0F5F]"
                      style={{ borderColor: hoveredFile === file.id ? BRAND : "transparent" }}
                    >
                      <img
                        src={file.url}
                        alt={file.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white rounded-full p-1.5">
                          <Check className="h-4 w-4 text-[#9B0F5F]" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] truncate leading-tight">{file.filename}</p>
                        <p className="text-white/70 text-[9px]">{formatSize(file.sizeBytes)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
