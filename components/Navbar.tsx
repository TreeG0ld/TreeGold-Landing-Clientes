"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, ShoppingBag, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSelection } from "@/lib/store";
import { coleccionHref } from "@/lib/catalog-url";
import { site } from "@/lib/site";
import { lockScroll } from "@/lib/scroll-lock";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/coleccion", label: "Colección" },
  { href: "/#promociones", label: "Promociones" },
  { href: "/historia", label: "Historia" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const rawCount = useSelection((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const openDrawer = useSelection((s) => s.open);
  // Evita desajuste de hidratación: el conteo de localStorage solo tras montar.
  const count = mounted ? rawCount : 0;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // El input se monta con el panel, así que hay que enfocarlo al abrirlo.
  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    setSearchOpen(false);
    setQuery("");
    router.push(coleccionHref({ q: term }));
  }

  useEffect(() => {
    if (!open) return;
    return lockScroll();
  }, [open]);

  // Sobre el hero oscuro (solo home, sin scroll y sin menú abierto) usamos texto claro.
  const overHero = pathname === "/" && !scrolled && !open && !searchOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-luxe ${
        searchOpen
          ? "glass-strong border-b border-border/40 shadow-lg shadow-black/5"
          : scrolled || open
            ? "glass border-b border-border/60"
            : overHero
              ? "bg-gradient-to-b from-black/50 via-black/20 to-transparent"
              : "bg-transparent"
      }`}
    >
      {/* mt-3/px-6 en celular: el logo y los iconos quedaban justo sobre el
          marco decorativo diagonal de la esquina de la foto del Hero. Los
          separamos un poco de la esquina (abajo y hacia adentro); en
          escritorio el banner es panorámico y el marco queda lejos del
          navbar, así que ahí se resetea a como estaba. */}
      <nav className="mx-auto mt-5 flex h-16 max-w-7xl items-center justify-between px-6 md:mt-0 md:h-20 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center" aria-label={site.fullName}>
          <Image
            src="/logo.png"
            alt={site.fullName}
            width={300}
            height={320}
            // Sin `priority`: el LCP real de la home es el banner del Hero.
            // Este logo mide 56px de alto en pantalla — precargarlo competía
            // por ancho de banda con la imagen que sí importa medir en LCP.
            className="h-11 w-auto md:h-14"
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-9 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`group relative text-sm font-medium tracking-wide transition-colors duration-300 ${
                    active
                      ? "text-accent"
                      : overHero
                        ? "text-white hover:text-accent-soft"
                        : "text-primary hover:text-accent"
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px bg-accent transition-all duration-300 ease-luxe ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/perfil"
            aria-label="Mi Cuenta"
            className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:text-accent ${
              overHero ? "text-white" : "text-primary"
            }`}
          >
            <User className="h-5 w-5" strokeWidth={1.6} />
          </Link>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? "Cerrar buscador" : "Buscar joyas"}
            aria-expanded={searchOpen}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:text-accent cursor-pointer ${
              searchOpen ? "text-accent" : overHero ? "text-white" : "text-primary"
            }`}
          >
            <Search className="h-5 w-5" strokeWidth={1.6} />
          </button>
          <button
            onClick={openDrawer}
            aria-label="Ver mi selección"
            data-cart-target
            className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:text-accent cursor-pointer ${
              overHero ? "text-white" : "text-primary"
            }`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-semibold text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className={`flex h-11 w-11 items-center justify-center rounded-full md:hidden cursor-pointer ${
              overHero ? "text-white" : "text-primary"
            }`}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Buscador */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.65, 0, 0.35, 1] }}
            className="overflow-hidden"
          >
            <form
              onSubmit={submitSearch}
              className="mx-auto flex max-w-7xl items-center gap-3 px-6 pb-5 md:px-8"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                <input
                  ref={searchInput}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                  placeholder="Buscar joyas por nombre..."
                  aria-label="Buscar joyas por nombre"
                  className="w-full rounded-full border border-border bg-white/90 py-3 pl-11 pr-11 text-base text-primary outline-none transition-colors placeholder:text-secondary/70 focus:border-accent md:text-sm"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      searchInput.current?.focus();
                    }}
                    aria-label="Borrar búsqueda"
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:text-primary cursor-pointer"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn-primary shrink-0">
                Buscar
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
            className="overflow-hidden md:hidden"
          >
            <ul className="flex flex-col gap-1 px-5 pb-6 pt-2">
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.06 }}
                >
                  <Link
                    href={l.href}
                    className={`block border-b border-border/50 py-4 font-serif text-3xl transition-colors ${
                      pathname === l.href ? "text-accent" : "text-primary"
                    }`}
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
