import Link from "next/link";
import { Instagram, Mail, MapPin } from "lucide-react";
import { site } from "@/lib/site";
import { buildGeneralLink } from "@/lib/whatsapp";

export default function Footer() {
  return (
    <footer className="mt-24 bg-primary text-on-primary">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="font-serif text-3xl font-semibold tracking-wide"
            >
              Tree<span className="text-gold">Gold</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-on-primary/70">
              {site.tagline}. Piezas hechas a mano en oro 18k y plata 925.
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
                  <Instagram className="h-4 w-4" strokeWidth={1.6} /> Instagram
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
          <p>Hecho a mano con dedicación.</p>
        </div>
      </div>
    </footer>
  );
}
