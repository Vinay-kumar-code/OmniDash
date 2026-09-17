"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";

export default function FileUpload({ onUploadComplete }: { onUploadComplete: (id: number | null) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 15 * 1024 * 1024) {
      setStatus("error");
      setMessage("File size must be less than 15MB");
      return;
    }

    setFile(selectedFile);
    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: `Upload error (${res.status})` };
      }

      if (res.ok) {
        setStatus("success");
        onUploadComplete(data.fileId);
      } else {
        setStatus("error");
        setMessage(data.error || "Upload failed");
        setFile(null);
      }
    } catch (err) {
      setStatus("error");
      setMessage("Upload failed");
      setFile(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setStatus("idle");
    setMessage("");
    onUploadComplete(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center relative transition-all duration-300 ${status === 'success' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-rule)] bg-[var(--color-bg)] hover:border-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5'}`}>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
          disabled={status === "uploading" || status === "success"}
        />
        
        {status === "idle" && (
          <div className="text-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-[var(--color-secondary)]" />
            </div>
            <p className="font-sans text-[var(--color-ink)]/80 text-sm">
              <span className="font-bold text-[var(--color-secondary)]">Upload a PDF or DOCX</span> to ground the research.
            </p>
          </div>
        )}

        {status === "uploading" && (
          <div className="text-center pointer-events-none animate-pulse">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <p className="font-sans text-[var(--color-primary)] text-sm font-medium">Extracting text...</p>
          </div>
        )}

        {status === "success" && file && (
          <div className="flex items-center gap-4 w-full justify-between z-10">
            <div className="flex items-center gap-3 overflow-hidden bg-white px-4 py-2 rounded-xl shadow-sm border border-[var(--color-primary)]/20 flex-1">
              <FileText className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <span className="font-mono text-sm truncate font-medium text-[var(--color-ink)]">{file.name}</span>
            </div>
            <button onClick={clearFile} className="p-2 hover:bg-[var(--color-alert)]/10 rounded-full cursor-pointer transition-colors group">
              <X className="w-5 h-5 text-[var(--color-ink)]/40 group-hover:text-[var(--color-alert)]" />
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-[var(--color-alert)]/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-[var(--color-alert)]" />
            </div>
            <p className="font-sans text-[var(--color-alert)] text-sm font-medium">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
