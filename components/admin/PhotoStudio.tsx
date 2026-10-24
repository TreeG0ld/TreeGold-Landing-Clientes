"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, {
  getInitialCropFromCroppedAreaPixels,
  type Area,
  type MediaSize,
  type Point,
  type Size,
} from "react-easy-crop";
import { AnimatePresence, animate, motion, type AnimationPlaybackControls } from "motion/react";
import { Expand, Loader2, RotateCcw, Sparkles, Undo2 } from "lucide-react";
import { lockScroll } from "@/lib/scroll-lock";
import { PHOTO_ASPECT, autoCropArea, exportCrop, loadImage, type Rect } from "@/lib/photo-crop";

export type StudioItem = {
  key: string;
  /** URL de la foto: blob: de un archivo elegido, o la foto ya subida en ImageKit. */
  src: string;
  /** El archivo elegido, para poder subirlo tal cual si no se puede editar (HEIC). */
  file?: File;
};

const MAX_ZOOM = 4;
const MAX_TILT = 15;
const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", stiffness: 280, damping: 30, mass: 0.8 } as const;

type Pose = { x: number; y: number; zoom: number; turn: number; tilt: number };
const HOME: Pose = { x: 0, y: 0, zoom: 1, turn: 0, tilt: 0 };

// Tamaño en pantalla de la foto girada (react-easy-crop la gira con CSS, y
// MediaSize es su tamaño sin girar con zoom 1).
function turned(media: MediaSize, rotation: number): Size {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return { width: cos * media.width + sin * media.height, height: sin * media.width + cos * media.height };
}

// Zoom con el que la foto cabe entera dentro del marco ("Completa"). Es el
// mínimo del zoom: menos que eso solo agregaría relleno.
function fitZoom(media: MediaSize, crop: Size, rotation: number): number {
  const t = turned(media, rotation);
  return Math.min(1, crop.width / t.width, crop.height / t.height);
}

// Hasta dónde se puede mover la foto. Si es más grande que el marco, sin dejar
// huecos; si es más chica (alejada para verla completa), sin salirse del
// marco. Reemplaza el límite de react-easy-crop, que no contempla alejar la
// foto por debajo de 100%.
function settle(p: Pose, media: MediaSize | null, crop: Size | null): Pose {
  if (!media || !crop) return p;
  const t = turned(media, p.turn + p.tilt);
  const lx = Math.abs(t.width * p.zoom - crop.width) / 2;
  const ly = Math.abs(t.height * p.zoom - crop.height) / 2;
  return { ...p, x: Math.min(lx, Math.max(-lx, p.x)), y: Math.min(ly, Math.max(-ly, p.y)) };
}

// Estudio de fotos del panel, a pantalla completa y sobre fondo oscuro (como
// un editor de fotos, sin importar el tema del panel). Diseño sobrio a
// propósito: la foto al centro, texto arriba (Cancelar · Listo) y abajo un
// dial tipo regla para el zoom o el enderezado, más cuatro herramientas. El
// marco tiene las esquinas de la tarjeta de la tienda: es la vista previa.
//
// La foto se mueve y se acerca con el mouse, la rueda o los dedos
// (react-easy-crop). "Auto" quita los bordes blancos y centra la joya;
// "Completa" aleja la foto hasta verla entera, y lo que sobra del marco se
// rellena con la misma foto difuminada. El recorte es siempre cuadrado.
//
// No sube nada: entrega cada foto recortada (onCropped) y quien lo abrió se
// encarga de subirla. Con varias fotos, va una por una. Para que también se
// anime al cerrar, quien lo abre debe envolverlo en <AnimatePresence>.
export default function PhotoStudio({
  items,
  onCropped,
  onClose,
}: {
  items: StudioItem[];
  onCropped: (item: StudioItem, photo: Blob) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const item = items[index];

  // Posición del recorte: x/y y zoom de react-easy-crop, más el giro en dos
  // partes (de a 90° con "Girar" y el enderezado fino del dial).
  const [pose, setPose] = useState<Pose>(HOME);
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const rotation = pose.turn + pose.tilt;

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [moving, setMoving] = useState(false);
  const [dial, setDial] = useState<"zoom" | "tilt">("zoom");

  // Tamaño de la foto en pantalla y del marco: en estado (para el zoom mínimo
  // y el relleno difuminado) y en refs (para los callbacks).
  const [media, setMedia] = useState<MediaSize | null>(null);
  const [cropBox, setCropBox] = useState<Size | null>(null);
  const mediaRef = useRef<MediaSize | null>(null);
  const cropRef = useRef<Size | null>(null);
  mediaRef.current = media;
  cropRef.current = cropBox;
  const minZoom = media && cropBox ? Math.floor(fitZoom(media, cropBox, rotation) * 100) / 100 : 1;

  const area = useRef<Rect | null>(null);
  const tween = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => lockScroll(), []);

  // Foto nueva en pantalla: se carga aparte (para el recorte final) y se
  // vuelve a la posición inicial.
  useEffect(() => {
    let alive = true;
    tween.current?.stop();
    setPose(HOME);
    setImg(null);
    setLoadError(false);
    setError("");
    area.current = null;
    setMedia(null);
    loadImage(item.src).then(
      (loaded) => alive && setImg(loaded),
      () => alive && setLoadError(true)
    );
    return () => {
      alive = false;
    };
  }, [item.src]);

  const onArea = useCallback((_: Area, pixels: Area) => {
    area.current = pixels;
  }, []);

  // Lleva el recorte a una posición con una animación suave (Auto, Completa,
  // Girar, Restablecer, el imán del dial).
  const glideTo = useCallback((target: Partial<Pose>) => {
    tween.current?.stop();
    const from = poseRef.current;
    const to = { ...from, ...target };
    tween.current = animate(0, 1, {
      duration: 0.55,
      ease: EASE,
      onUpdate: (t) =>
        setPose(
          settle(
            {
              x: from.x + (to.x - from.x) * t,
              y: from.y + (to.y - from.y) * t,
              zoom: from.zoom + (to.zoom - from.zoom) * t,
              turn: from.turn + (to.turn - from.turn) * t,
              tilt: from.tilt + (to.tilt - from.tilt) * t,
            },
            mediaRef.current,
            cropRef.current
          )
        ),
    });
  }, []);

  // Todo cambio de posición pasa por el límite. No detiene las animaciones:
  // react-easy-crop avisa (onCropChange / onZoomChange) también cuando es una
  // animación la que mueve la foto, y detenerla ahí la cortaba al primer
  // cuadro ("Restablecer" avanzaba de a poquito).
  const move = useCallback((change: Partial<Pose>) => {
    setPose((p) => settle({ ...p, ...change }, mediaRef.current, cropRef.current));
  }, []);

  // Cambios hechos por la persona con el dial: esos sí interrumpen una
  // animación en curso (el arrastre y la rueda sobre la foto lo hacen en
  // onInteractionStart).
  const userMove = useCallback(
    (change: Partial<Pose>) => {
      tween.current?.stop();
      move(change);
    },
    [move]
  );

  const autoAdjust = () => {
    if (!img || !media || !cropBox) return;
    const target = autoCropArea(img);
    const { crop, zoom } = getInitialCropFromCroppedAreaPixels(
      target,
      media,
      0,
      cropBox,
      fitZoom(media, cropBox, 0),
      MAX_ZOOM
    );
    glideTo({ x: crop.x, y: crop.y, zoom, turn: 0, tilt: 0 });
  };

  const showWhole = () => {
    if (!media || !cropBox) return;
    glideTo({ x: 0, y: 0, zoom: fitZoom(media, cropBox, rotation) });
  };

  const next = useCallback(() => {
    if (index < items.length - 1) setIndex(index + 1);
    else onClose();
  }, [index, items.length, onClose]);

  const confirm = useCallback(async () => {
    if (!img || !area.current || busy) return;
    setBusy(true);
    setError("");
    try {
      const photo = await exportCrop(img, area.current, poseRef.current.turn + poseRef.current.tilt);
      onCropped(item, photo);
      next();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo preparar la foto.");
    } finally {
      setBusy(false);
    }
  }, [img, busy, item, onCropped, next]);

  // Esc cierra; Enter usa la foto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        confirm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, confirm]);

  const ready = !!img && !loadError;
  const many = items.length > 1;
  const last = index === items.length - 1;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease: EASE } }}
      transition={{ duration: 0.35, ease: EASE }}
      role="dialog"
      aria-modal="true"
      aria-label="Encuadrar foto"
      className="fixed inset-0 z-[100] flex flex-col bg-[#0e0d0c] text-stone-100"
    >
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
        className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 sm:px-6 sm:py-4"
      >
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer justify-self-start rounded-full px-2 py-1.5 text-sm text-stone-400 transition-colors hover:text-stone-100"
        >
          Cancelar
        </button>
        <p className="text-sm text-stone-200">
          Encuadrar
          {many && (
            <span className="tabular-nums text-stone-500">
              {" "}
              · {index + 1} de {items.length}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={confirm}
          disabled={!ready || busy}
          className="flex min-w-[5.5rem] cursor-pointer items-center justify-center justify-self-end rounded-full bg-stone-100 px-4 py-1.5 text-sm font-medium text-stone-900 transition-all duration-200 hover:bg-white active:scale-[0.97] disabled:cursor-default disabled:opacity-30"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : many && !last ? "Siguiente" : "Listo"}
        </button>
      </motion.header>

      {/* Escenario: la foto y el marco del recorte. */}
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.key}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: SPRING }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: EASE } }}
            className="absolute inset-x-4 inset-y-2 sm:inset-x-10"
          >
            {loadError ? (
              <CannotEdit
                canUpload={!!item.file}
                last={last}
                onUpload={() => {
                  onCropped(item, item.file!);
                  next();
                }}
                onSkip={next}
              />
            ) : (
              <>
                {!ready && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="aspect-square h-[72%] max-w-full animate-pulse rounded-[18px] bg-white/[0.03]" />
                  </div>
                )}
                <div className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
                  {/* Relleno difuminado del marco, detrás de la foto: se ve
                      cuando la foto está alejada y no lo llena, igual que el
                      relleno que llevará el archivo final. El marco de
                      react-easy-crop siempre va centrado. */}
                  {cropBox && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 overflow-hidden rounded-[18px]"
                      style={{ width: cropBox.width, height: cropBox.height, transform: "translate(-50%, -50%)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.src} alt="" crossOrigin="anonymous" className="h-full w-full scale-[1.15] object-cover blur-2xl" />
                    </div>
                  )}
                  <Cropper
                    image={item.src}
                    crop={{ x: pose.x, y: pose.y }}
                    zoom={pose.zoom}
                    rotation={rotation}
                    aspect={PHOTO_ASPECT}
                    minZoom={minZoom}
                    maxZoom={MAX_ZOOM}
                    zoomSpeed={0.5}
                    showGrid={false}
                    restrictPosition={false}
                    onCropChange={(c: Point) => move({ x: c.x, y: c.y })}
                    onZoomChange={(zoom) => move({ zoom })}
                    onCropAreaChange={onArea}
                    onCropComplete={onArea}
                    onMediaLoaded={setMedia}
                    onCropSizeChange={setCropBox}
                    onInteractionStart={() => {
                      tween.current?.stop();
                      setMoving(true);
                    }}
                    onInteractionEnd={() => setMoving(false)}
                    mediaProps={{ crossOrigin: "anonymous", alt: "" }}
                    classes={{ cropAreaClassName: `studio-crop-area${moving ? " is-moving" : ""}` }}
                    style={{
                      containerStyle: { background: "transparent" },
                      // Las esquinas de la tarjeta de la tienda. color = la
                      // sombra que oscurece lo que queda fuera del recorte; es
                      // el mismo tono del fondo para que no se vea ningún
                      // rectángulo alrededor de la foto.
                      cropAreaStyle: {
                        color: "rgba(14, 13, 12, 0.74)",
                        border: "1px solid rgba(255, 255, 255, 0.45)",
                        borderRadius: 18,
                      },
                    }}
                  />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controles: dial (zoom / enderezar) y herramientas. */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.08 }}
        className={`mx-auto w-full max-w-md space-y-4 px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3 transition-opacity duration-300 ${
          ready ? "" : "pointer-events-none opacity-30"
        }`}
      >
        <div className="flex justify-center gap-7 text-xs">
          {(["zoom", "tilt"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDial(d)}
              className={`relative cursor-pointer pb-1.5 transition-colors duration-200 ${
                dial === d ? "text-stone-100" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {d === "zoom" ? "Zoom" : "Enderezar"}
              {dial === d && (
                <motion.span layoutId="studio-dial-tab" className="absolute inset-x-0 bottom-0 h-px bg-stone-100" />
              )}
            </button>
          ))}
        </div>

        {dial === "zoom" ? (
          <Dial
            key="zoom"
            label="Zoom"
            value={pose.zoom}
            min={minZoom}
            max={MAX_ZOOM}
            perUnit={140}
            minor={0.05}
            major={0.5}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(zoom) => userMove({ zoom })}
            onRelease={(v) => Math.abs(v - 1) < 0.03 && glideTo({ zoom: 1 })}
          />
        ) : (
          <Dial
            key="tilt"
            label="Enderezar"
            value={pose.tilt}
            min={-MAX_TILT}
            max={MAX_TILT}
            perUnit={11}
            minor={1}
            major={5}
            format={(v) => `${v > 0.05 ? "+" : ""}${Math.abs(v) < 0.05 ? "0" : v.toFixed(1)}°`}
            onChange={(tilt) => userMove({ tilt })}
            // Imán en 0°: soltar cerca de derecho lo deja derecho.
            onRelease={(v) => Math.abs(v) < 0.6 && glideTo({ tilt: 0 })}
          />
        )}

        <div className="flex justify-center gap-1">
          <Tool label="Girar" onClick={() => glideTo({ turn: pose.turn - 90 })}>
            <RotateCcw />
          </Tool>
          <Tool label="Auto" onClick={autoAdjust}>
            <Sparkles />
          </Tool>
          <Tool label="Completa" onClick={showWhole}>
            <Expand />
          </Tool>
          <Tool label="Restablecer" onClick={() => glideTo(HOME)}>
            <Undo2 />
          </Tool>
        </div>

        {error && <p className="text-center text-xs text-red-400">{error}</p>}
      </motion.div>
    </motion.div>,
    document.body
  );
}

function Tool({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[4.5rem] cursor-pointer flex-col items-center gap-1.5 rounded-xl py-2 text-stone-400 transition-colors duration-200 hover:bg-white/[0.04] hover:text-stone-100 active:scale-[0.96] [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:stroke-[1.5]"
    >
      {children}
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

// Dial tipo regla: rayitas finas que se arrastran de lado a lado bajo una
// marca fija al centro (como el de la app de fotos del iPhone). Arrastrar a la
// izquierda sube el valor. También con la rueda y con las flechas del teclado.
// `perUnit` = píxeles por unidad; `minor` / `major` = cada cuánto va una
// rayita corta / larga, alineadas a valores redondos.
function Dial({
  label,
  value,
  min,
  max,
  perUnit,
  minor,
  major,
  format,
  onChange,
  onRelease,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  perUnit: number;
  minor: number;
  major: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  onRelease?: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; v: number } | null>(null);
  const [width, setWidth] = useState(0);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // La rueda sobre el dial lo mueve a él, no a la página. Con listener nativo
  // para poder cancelar el scroll (React registra la rueda como pasiva).
  const live = useRef({ value, onChange, clamp });
  live.current = { value, onChange, clamp };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      live.current.onChange(live.current.clamp(live.current.value + d / perUnit / 3));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [perUnit]);

  const span = (max - min) * perUnit;
  const offset = width / 2 - (value - min) * perUnit;
  // Desfase para que las rayitas caigan en valores redondos aunque el mínimo
  // no lo sea (el zoom mínimo depende de la foto).
  const phase = (every: number) => -(((min % every) + every) % every) * perUnit;
  const step = (max - min) / 100;

  return (
    <div className="select-none">
      <p className="mb-1.5 text-center text-xs tabular-nums text-stone-300">{format(value)}</p>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number(value.toFixed(2))}
        aria-valuetext={format(value)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, v: value };
        }}
        onPointerMove={(e) => {
          if (drag.current) onChange(clamp(drag.current.v + (drag.current.x - e.clientX) / perUnit));
        }}
        onPointerUp={() => {
          if (drag.current) onRelease?.(value);
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(clamp(value - step));
          else if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(clamp(value + step));
          else return;
          e.preventDefault();
        }}
        className="relative h-9 cursor-ew-resize touch-none overflow-hidden rounded-md outline-none [mask-image:linear-gradient(to_right,transparent,#000_22%,#000_78%,transparent)] focus-visible:bg-white/[0.03]"
      >
        <div
          aria-hidden
          className="absolute inset-y-0"
          style={{
            left: offset,
            width: span + 1,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: `${major * perUnit}px 55%, ${minor * perUnit}px 28%`,
            backgroundPosition: `${phase(major)}px center, ${phase(minor)}px center`,
            backgroundRepeat: "repeat-x",
          }}
        />
        <div aria-hidden className="absolute left-1/2 top-1/2 h-6 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e3c27a]" />
      </div>
    </div>
  );
}

// Cuando el navegador no puede abrir la foto (casi siempre una foto HEIC de
// iPhone: Chrome y Edge no saben leerlas; Safari sí), se puede subir tal cual,
// como antes del estudio: ImageKit la convierte para mostrarla.
function CannotEdit({
  canUpload,
  last,
  onUpload,
  onSkip,
}: {
  canUpload: boolean;
  last: boolean;
  onUpload: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center gap-3 text-center">
      <p className="text-base text-stone-100">Esta foto no se puede editar aquí</p>
      <p className="text-sm leading-relaxed text-stone-400">
        Suele pasar con las fotos de iPhone (formato HEIC). Puedes subirla tal cual, o editarla
        abriendo el panel desde Safari. Para que el iPhone las tome en JPG: Ajustes → Cámara →
        Formatos → Más compatible.
      </p>
      <div className="mt-2 flex gap-2">
        {canUpload && (
          <button
            type="button"
            onClick={onUpload}
            className="cursor-pointer rounded-full bg-stone-100 px-4 py-1.5 text-sm font-medium text-stone-900 transition-colors hover:bg-white"
          >
            Subir sin recortar
          </button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer rounded-full px-4 py-1.5 text-sm text-stone-400 transition-colors hover:text-stone-100"
        >
          {last ? "Cerrar" : "Saltar"}
        </button>
      </div>
    </div>
  );
}
