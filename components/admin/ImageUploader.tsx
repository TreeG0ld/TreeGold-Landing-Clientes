"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";

export default function ImageUploader({
  images,
  onChange,
  folder = "treegold/admin",
}: {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);

    try {
      const sigRes = await fetch("/api/admin/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });
      if (!sigRes.ok) throw new Error("No se pudo obtener la firma de Cloudinary.");
      const { timestamp, signature, apiKey, cloudName, folder: signedFolder } = await sigRes.json();

      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", apiKey);
        form.append("timestamp", String(timestamp));
        form.append("signature", signature);
        form.append("folder", signedFolder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message ?? "Error al subir la imagen.");
        uploaded.push(data.secure_url);
      }

      onChange([...images, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (url: string) => {
    onChange(images.filter((img) => img !== url));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-white">
            <Image src={img} alt="" fill sizes="96px" className="object-contain p-1" />
            <button
              type="button"
              onClick={() => removeImage(img)}
              aria-label="Quitar imagen"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-secondary transition-colors hover:border-accent hover:text-primary disabled:opacity-60 cursor-pointer"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-xs">{uploading ? "Subiendo..." : "Agregar"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
