"use client";

// Carrusel de fotos de la sección "El arte detrás de cada joya" (home).
// Fotos editoriales de marca subidas a Cloudinary bajo treegold/marca/
// (esa carpeta queda exenta del recorte de catálogo en lib/imageLoader.ts).
// Pasa solo (autoplay) y también admite swipe/arrastre.

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

const photos = [
  {
    src: "https://res.cloudinary.com/dkab59i18/image/upload/v1783708924/treegold/marca/WhatsApp_Image_2026-07-06_at_10.47.47.jpg",
    alt: "Modelo con cadenas TreeGold en oro laminado",
  },
  {
    src: "https://res.cloudinary.com/dkab59i18/image/upload/v1783708925/treegold/marca/WhatsApp_Image_2026-07-06_at_10.47.47_2.jpg",
    alt: "Modelo con cadena TreeGold en plata 925",
  },
  {
    src: "https://res.cloudinary.com/dkab59i18/image/upload/v1783708927/treegold/marca/WhatsApp_Image_2026-07-06_at_10.47.46_1.jpg",
    alt: "Collar TreeGold en su estuche",
  },
  {
    src: "https://res.cloudinary.com/dkab59i18/image/upload/v1783708928/treegold/marca/WhatsApp_Image_2026-07-06_at_10.47.46.jpg",
    alt: "Topos TreeGold en su estuche",
  },
];

const AUTOPLAY_MS = 4500;

export default function ArtisanCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);

    // Autoplay sencillo; se pausa mientras el usuario arrastra.
    const timer = setInterval(() => {
      if (!emblaApi.internalEngine().dragHandler.pointerDown()) {
        emblaApi.scrollNext();
      }
    }, AUTOPLAY_MS);

    return () => {
      clearInterval(timer);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {photos.map((photo) => (
            <div key={photo.src} className="relative min-w-0 flex-[0_0_100%]">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            aria-label={`Foto ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === selected ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
