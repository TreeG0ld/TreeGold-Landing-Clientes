"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Crop, Loader2, Trash2, Upload } from "lucide-react";
import type { StudioItem } from "./PhotoStudio";

// El estudio (y react-easy-crop) solo se descarga cuando se abre.
const PhotoStudio = dynamic(() => import("./PhotoStudio"), { ssr: false });

/** Foto recortada que se está subiendo a ImageKit. */
type PendingUpload = {
  key: string;
  /** Vista previa local del recorte mientras sube. */
  preview: string;
  progress: number;
  /** Si es una edición, la foto que reemplaza. */
  replaces?: string;
};

type Studio = { items: StudioItem[]; replaces?: string };

const newKey = () => crypto.randomUUID();

// Fotos del producto en el formulario del panel. Toda foto pasa por el estudio
// (components/admin/PhotoStudio) antes de subirse: las nuevas al elegirlas o
// arrastrarlas, y las ya subidas con "Editar". La foto sale del estudio ya
// recortada en cuadrado y liviana, y se sube directo del navegador a ImageKit.
// Los cambios quedan en el formulario: se guardan con "Guardar cambios".
export default function ImageUploader({
  images,
  onChange,
  productName,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  productName?: string;
}) {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Las subidas terminan en cualquier orden: cada una parte de la lista más
  // reciente, no de la que había cuando empezó.
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const openFiles = (files: FileList | File[] | null) => {
    // Por extensión también: en Windows, Chrome no sabe que un .heic (iPhone)
    // es una imagen y le pone tipo vacío.
    const photos = Array.from(files ?? []).filter(
      (f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)
    );
    if (photos.length === 0) return;
    setError("");
    setStudio({ items: photos.map((f) => ({ key: newKey(), src: URL.createObjectURL(f), file: f })) });
  };

  const editPhoto = (url: string) => {
    setError("");
    // La foto original, sin las transformaciones de ImageKit de la URL.
    setStudio({ items: [{ key: newKey(), src: url.split("?")[0] }], replaces: url });
  };

  // Las vistas previas de los archivos elegidos se liberan cuando el estudio
  // termina su animación de salida (onExitComplete), no al cerrarlo: antes de
  // eso la foto sigue en pantalla.
  const toRelease = useRef<StudioItem[]>([]);
  const closeStudio = () => {
    if (studio) toRelease.current.push(...studio.items);
    setStudio(null);
  };
  const releaseClosed = () => {
    toRelease.current.forEach((it) => it.src.startsWith("blob:") && URL.revokeObjectURL(it.src));
    toRelease.current = [];
  };

  const upload = async (photo: Blob, replaces?: string) => {
    const key = newKey();
    const preview = URL.createObjectURL(photo);
    setUploads((u) => [...u, { key, preview, progress: 0, replaces }]);
    const setProgress = (progress: number) =>
      setUploads((u) => u.map((x) => (x.key === key ? { ...x, progress } : x)));

    try {
      // Una autorización por foto: ImageKit rechaza un token ya usado.
      const authRes = await fetch("/api/admin/imagekit-auth");
      if (!authRes.ok) throw new Error("No se pudo obtener la autorización de ImageKit.");
      const { token, expire, signature, publicKey, folder } = await authRes.json();

      // La foto del estudio es WebP (o JPEG); una subida tal cual (HEIC que no
      // se pudo editar) conserva la extensión de su archivo.
      const ext =
        photo.type === "image/webp"
          ? "webp"
          : photo.type === "image/jpeg"
            ? "jpg"
            : photo instanceof File
              ? (photo.name.split(".").pop() ?? "jpg").toLowerCase()
              : "jpg";
      const form = new FormData();
      form.append("file", photo);
      form.append("fileName", `${slugify(productName) || "foto"}.${ext}`);
      form.append("publicKey", publicKey);
      form.append("signature", signature);
      form.append("expire", String(expire));
      form.append("token", token);
      form.append("folder", folder);
      form.append("useUniqueFileName", "true");

      const url = await new Promise<string>((resolve, reject) => {
        // XMLHttpRequest y no fetch: es lo único que informa el avance de la subida.
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");
        xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(e.loaded / e.total);
        xhr.onload = () => {
          let data: { url?: string; message?: string; error?: string } = {};
          try {
            data = JSON.parse(xhr.responseText);
          } catch {}
          if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data.url);
          else reject(new Error(data.message || data.error || "Error al subir la imagen."));
        };
        xhr.onerror = () => reject(new Error("Error de conexión al subir la imagen."));
        xhr.send(form);
      });

      const current = imagesRef.current;
      onChange(replaces ? current.map((img) => (img === replaces ? url : img)) : [...current, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen.");
    } finally {
      setUploads((u) => u.filter((x) => x.key !== key));
      URL.revokeObjectURL(preview);
    }
  };

  // Al salir del formulario no deben quedar vistas previas en memoria.
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;
  useEffect(() => () => uploadsRef.current.forEach((u) => URL.revokeObjectURL(u.preview)), []);

  const removeImage = (url: string) => onChange(images.filter((img) => img !== url));

  const replacing = new Map(uploads.filter((u) => u.replaces).map((u) => [u.replaces!, u]));
  const adding = uploads.filter((u) => !u.replaces);

  return (
    <div
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        openFiles(e.dataTransfer.files);
      }}
      className={`rounded-2xl p-1 transition-colors duration-300 ${dragging ? "bg-accent/10 ring-2 ring-accent/50" : ""}`}
    >
      <div className="flex flex-wrap gap-3">
        <AnimatePresence initial={false}>
          {images.map((img, i) => {
            const busy = replacing.get(img);
            return (
              <motion.div
                key={img}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                className="group relative aspect-square w-24 overflow-hidden rounded-xl border border-border bg-white"
              >
                {busy ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={busy.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Image src={img} alt="" fill sizes="96px" className="object-contain" />
                )}
                {i === 0 && !busy && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[0.6rem] font-medium text-white">
                    Portada
                  </span>
                )}
                {busy ? (
                  <Progress value={busy.progress} />
                ) : (
                  <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                    <button
                      type="button"
                      onClick={() => editPhoto(img)}
                      aria-label="Editar foto"
                      title="Editar foto"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm transition-colors hover:bg-black/85"
                    >
                      <Crop className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      aria-label="Quitar foto"
                      title="Quitar foto"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-destructive text-white transition-colors hover:brightness-110"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}

          {adding.map((u) => (
            <motion.div
              key={u.key}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative aspect-square w-24 overflow-hidden rounded-xl border border-border bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.preview} alt="" className="h-full w-full object-cover" />
              <Progress value={u.progress} />
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex aspect-square w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-2 text-center transition-colors ${
            dragging ? "border-accent text-accent" : "border-border text-secondary hover:border-accent hover:text-primary"
          }`}
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs leading-tight">{dragging ? "Suéltalas aquí" : "Agregar o arrastrar"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => {
          openFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="mt-2 text-xs text-secondary">
        Cada foto pasa por el estudio para encuadrarla igual que en la tienda. Los cambios se
        guardan al presionar «Guardar cambios».
      </p>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {/* AnimatePresence: el estudio se anima también al cerrarse. */}
      <AnimatePresence onExitComplete={releaseClosed}>
        {studio && (
          <PhotoStudio
            key={studio.items[0].key}
            items={studio.items}
            onCropped={(_, photo) => upload(photo, studio.replaces)}
            onClose={closeStudio}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Velo con el avance de la subida sobre la vista previa.
function Progress({ value }: { value: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 backdrop-blur-[1px]">
      <Loader2 className="h-5 w-5 animate-spin text-white" />
      <div className="h-1 w-14 overflow-hidden rounded-full bg-white/25">
        <div
          className="h-full rounded-full bg-[#e8c060] transition-[width] duration-200"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** Nombre de archivo legible a partir del nombre del producto. */
function slugify(text?: string): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
