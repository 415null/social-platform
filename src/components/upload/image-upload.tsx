"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";

interface ImageUploadProps {
  bucket: "chat-images" | "forum-images" | "avatars" | "video-covers";
  onUploaded: (url: string) => void;
  maxSize?: number; // MB
}

export function ImageUpload({ bucket, onUploaded, maxSize = 10 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("仅支持 JPG/PNG/GIF/WebP 格式");
      return;
    }

    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`图片大小不能超过 ${maxSize}MB`);
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        onUploaded(data.url);
      } else {
        alert(data.error ?? "上传失败");
      }
    } catch {
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="预览"
            className="h-10 w-10 rounded object-cover"
          />
          <button
            className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"
            onClick={() => setPreview(null)}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
