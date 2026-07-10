import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { site } from "@/lib/site";
import { buildGeneralLink } from "@/lib/whatsapp";

export default function Footer() {
  return (
    <footer className="mt-24 bg-primary text-on-primary">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label={site.fullName} className="inline-block">
              <Image
                src="/logo.png"
                alt={site.fullName}
                width={820}
                height={876}
                className="h-24 w-auto"
              />
            </Link>
            <p className="mt-4 font-serif text-lg text-accent-soft">{site.slogan}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-on-primary/70">
              {site.tagline}. Piezas hechas a mano en oro laminado y plata 925.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-luxe text-accent-soft">
              Explorar
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-on-primary/80">
              <li><Link href="/coleccion" className="transition-colors hover:text-accent-soft">Colección</Link></li>
              <li><Link href="/historia" className="transition-colors hover:text-accent-soft">Historia</Link></li>
              <li><Link href="/contacto" className="transition-colors hover:text-accent-soft">Contacto</Link></li>
              <li><Link href="/seleccion" className="transition-colors hover:text-accent-soft">Mi selección</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-luxe text-accent-soft">
              Contacto
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-on-primary/80">
              <li>
                <a href={buildGeneralLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-accent-soft">
                  WhatsApp · {site.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 transition-colors hover:text-accent-soft">
                  <Mail className="h-4 w-4" strokeWidth={1.6} /> {site.email}
                </a>
              </li>
              <li>
                <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-accent-soft">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> Instagram
                </a>
              </li>
              <li>
                <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-accent-soft">
                  <MapPin className="h-4 w-4" strokeWidth={1.6} /> {site.address}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-on-primary/15 pt-8 text-xs text-on-primary/50 md:flex-row">
          <p>© {new Date().getFullYear()} {site.fullName}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
