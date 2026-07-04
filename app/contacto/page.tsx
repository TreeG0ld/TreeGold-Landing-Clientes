import type { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import Reveal from "@/components/anim/Reveal";
import { site } from "@/lib/site";
import { buildGeneralLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Escríbenos por WhatsApp al ${site.whatsappDisplay} o por correo. Estamos para ayudarte a encontrar tu joya.`,
};

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
      <Reveal childSelector=".rv" stagger={0.12}>
        <div className="rv mb-14 text-center">
          <p className="eyebrow mb-3">Hablemos</p>
          <h1 className="text-5xl md:text-7xl">Contáctanos</h1>
          <p className="mx-auto mt-5 max-w-xl text-secondary leading-relaxed">
            ¿Tienes una pregunta o quieres una pieza a medida? La forma más rápida
            es por WhatsApp; te respondemos personalmente.
          </p>
        </div>

        <div className="rv mx-auto mb-14 max-w-md">
          <a
            href={buildGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#25D366] px-8 py-5 text-base font-semibold text-white transition-all duration-300 ease-luxe hover:brightness-105 active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-6 w-6" />
            Escríbenos por WhatsApp
          </a>
          <p className="mt-3 text-center text-sm text-secondary">
            {site.whatsappDisplay}
          </p>
        </div>
      </Reveal>

      <Reveal childSelector=".rv" stagger={0.1}>
        <div className="grid gap-5 sm:grid-cols-2">
          <a
            href={`mailto:${site.email}`}
            className="rv group flex items-start gap-4 rounded-2xl border border-border p-6 transition-colors hover:border-accent"
          >
            <Mail className="mt-0.5 h-6 w-6 text-accent" strokeWidth={1.6} />
            <div>
              <h3 className="text-xl">Correo</h3>
              <p className="mt-1 text-sm text-secondary">{site.email}</p>
            </div>
          </a>

          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="rv group flex items-start gap-4 rounded-2xl border border-border p-6 transition-colors hover:border-accent"
          >
            <svg className="mt-0.5 h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            <div>
              <h3 className="text-xl">Instagram</h3>
              <p className="mt-1 text-sm text-secondary">Síguenos y mira nuestras piezas</p>
            </div>
          </a>

          <div className="rv flex items-start gap-4 rounded-2xl border border-border p-6">
            <MapPin className="mt-0.5 h-6 w-6 text-accent" strokeWidth={1.6} />
            <div>
              <h3 className="text-xl">Ubicación</h3>
              <p className="mt-1 text-sm text-secondary">{site.city} · Envíos a todo el país</p>
            </div>
          </div>

          <div className="rv flex items-start gap-4 rounded-2xl border border-border p-6">
            <Clock className="mt-0.5 h-6 w-6 text-accent" strokeWidth={1.6} />
            <div>
              <h3 className="text-xl">Horario</h3>
              <p className="mt-1 text-sm text-secondary">Lun a Sáb · 9:00 — 18:00</p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
