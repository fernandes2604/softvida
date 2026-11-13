"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/instituicoes", label: "Instituições" },
  { href: "/ajuda", label: "Ajuda" },
];

type Role = "doador" | "instituicao" | "admin";

type UserProfile = {
  full_name: string;
  email: string;
  role: Role;
};

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const initial = name?.charAt(0).toUpperCase() || "U";

  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 font-bold text-white ${
        size === "lg" ? "h-11 w-11 text-lg" : "h-8 w-8 text-sm"
      }`}
    >
      {initial}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none ${
        role === "doador"
          ? "bg-emerald-100 text-emerald-700"
          : role === "admin"
            ? "bg-rose-100 text-rose-700"
            : "bg-sky-100 text-sky-700"
      }`}
    >
      {role === "doador" ? "Doador" : role === "admin" ? "Admin" : "Instituição"}
    </span>
  );
}

const IconHeart = () => (
  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
  </svg>
);

const IconDashboard = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconUser = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path strokeLinecap="round" d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
  </svg>
);

const IconLogout = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
  </svg>
);

const IconSpinner = () => (
  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const syncUserProfile = useCallback(async (authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    const { data: profile, error } = await supabase
      .from("perfis")
      .select("papel, nome_completo")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) console.error("Erro ao carregar perfil da navegação:", error.message);

    const metadataRole = authUser.user_metadata?.papel ?? authUser.user_metadata?.role;
    const fallbackRole: Role = metadataRole === "instituicao" ? "instituicao" : "doador";
    const role = profile?.papel === "admin" || profile?.papel === "instituicao" || profile?.papel === "doador"
      ? profile.papel
      : fallbackRole;
    const metadataName =
      authUser.user_metadata?.nome_completo ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.instituicao_nome;
    const fullName = profile?.nome_completo || metadataName || authUser.email?.split("@")[0] || "Usuário";

    setUser({
      full_name: String(fullName),
      email: authUser.email ?? "",
      role,
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      await syncUserProfile(session?.user ?? null);
    };

    syncUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncUserProfile(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [syncUserProfile]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowUserMenu(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setShowUserMenu(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (href: string) => pathname === href;
  const firstName = user?.full_name?.split(" ")[0] ?? "";
  const visibleNavLinks = user?.role === "admin"
    ? [...navLinks, { href: "/admin", label: "Admin" }]
    : navLinks;

  return (
    <>
      <nav
        role="navigation"
        aria-label="Navegação principal"
        className={`fixed left-0 right-0 top-0 z-50 border-b border-zinc-700/70 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 ${
          isScrolled ? "shadow-sm shadow-black/30" : "shadow-none"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-6 lg:h-[70px]">
            <Link href={user ? "/" : "/"} aria-label="SoftVida" className="group flex shrink-0 items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 shadow-sm shadow-rose-600/30 transition-colors group-hover:bg-rose-500">
                <IconHeart />
              </div>
              <span className="text-sm font-bold text-white lg:text-[15px]">
                SoftVida <span className="text-rose-400">Gota</span>
                <span className="font-normal text-zinc-300">de Vida</span>
              </span>
            </Link>

            <div className="hidden flex-1 items-center justify-center md:flex">
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={[
                    "relative rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-all duration-150",
                    "after:absolute after:bottom-1 after:left-3.5 after:right-3.5 after:h-[2px] after:rounded-full after:bg-rose-500 after:transition-all after:duration-200",
                    isActive(link.href)
                      ? "bg-rose-500/10 text-rose-300 after:opacity-100 after:scale-x-100"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white after:opacity-0 after:scale-x-0 hover:after:opacity-100 hover:after:scale-x-100",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu((value) => !value)}
                    aria-haspopup="true"
                    aria-expanded={showUserMenu}
                    aria-label="Menu do usuário"
                    className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-3 transition-colors hover:bg-zinc-800"
                  >
                    <Avatar name={user.full_name} size="sm" />
                    <span className="hidden max-w-[96px] truncate text-[13.5px] font-semibold text-zinc-200 lg:block">
                      {firstName}
                    </span>
                    <svg
                      className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div
                    className={`absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40 transition-all duration-200 ${
                      showUserMenu ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-95 opacity-0"
                    }`}
                  >
                    <div className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-3.5">
                      <div className="mb-2.5 flex items-center gap-3">
                        <Avatar name={user.full_name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-white">{user.full_name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-zinc-400">{user.email}</p>
                        </div>
                      </div>
                      <RoleBadge role={user.role} />
                    </div>

                    <div className="py-1.5">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                          <IconDashboard />
                        </span>
                        Dashboard
                      </Link>
                      <Link
                        href="/perfil"
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                          <IconUser />
                        </span>
                        Meu Perfil
                      </Link>

                      <div className="mx-3 my-1.5 h-px bg-zinc-800" />

                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-rose-400 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300">
                          {isLoggingOut ? <IconSpinner /> : <IconLogout />}
                        </span>
                        {isLoggingOut ? "A terminar sessão…" : "Terminar Sessão"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/auth"
                    className="rounded-lg bg-rose-600 px-4 py-2 text-[13.5px] font-semibold text-white shadow-sm shadow-rose-600/25 transition-all hover:bg-rose-500 active:scale-95"
                  >
                    Registar-me
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              className="rounded-lg p-2 transition-colors hover:bg-zinc-800 md:hidden"
            >
              <div className="flex h-[14px] w-5 flex-col justify-between" aria-hidden="true">
                <span className={`block h-[2px] w-full rounded-full bg-white transition-all duration-300 ${isMobileMenuOpen ? "translate-y-[6px] rotate-45" : ""}`} />
                <span className={`block h-[2px] w-full rounded-full bg-white transition-all duration-300 ${isMobileMenuOpen ? "scale-x-0 opacity-0" : ""}`} />
                <span className={`block h-[2px] w-full rounded-full bg-white transition-all duration-300 ${isMobileMenuOpen ? "-translate-y-[8px] -rotate-45" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 transition-all duration-300 md:hidden ${isMobileMenuOpen ? "visible" : "invisible"}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          className={`absolute bottom-0 right-0 top-16 w-[min(320px,100vw)] overflow-y-auto bg-zinc-950 shadow-2xl transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col gap-2 p-4">
            {user && (
              <div className="mb-1 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <Avatar name={user.full_name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">{user.email}</p>
                  <div className="mt-2">
                    <RoleBadge role={user.role} />
                  </div>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-0.5" aria-label="Menu principal">
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-150 ${
                    isActive(link.href)
                      ? "bg-rose-500/10 text-rose-300"
                      : "text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden="true" />}
                </Link>
              ))}
            </nav>

            <div className="mt-1 flex flex-col gap-2.5 border-t border-zinc-800 pt-3">
              {user ? (
                <>
                  <Link
                    href="/perfil"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-zinc-800"
                  >
                    <IconUser /> Meu Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-[14px] font-semibold text-white transition-all hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoggingOut ? <><IconSpinner /> A terminar sessão…</> : <><IconLogout /> Terminar Sessão</>}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="flex w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-zinc-800"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/auth"
                    className="flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-[14px] font-semibold text-white shadow-sm shadow-rose-600/20 transition-all hover:bg-rose-500"
                  >
                    Registar-me
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-16 lg:h-[70px]" aria-hidden="true" />
    </>
  );
}
