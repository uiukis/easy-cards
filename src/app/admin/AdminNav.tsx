"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
  HandCoins,
  Users,
  Megaphone,
  UserCog,
  Lock,
  PackageOpen,
  BookOpen,
  Sparkles,
  Gavel,
  Home,
  Bell,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PokemonAvatar } from "@/components/PokemonAvatar";
import { LogoutButton } from "./LogoutButton";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  CreditCard,
  HandCoins,
  Users,
  Megaphone,
  UserCog,
  Lock,
  PackageOpen,
  BookOpen,
  Sparkles,
  Gavel,
  Home,
  Bell,
  BarChart3,
};

export type AdminNavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  beta?: boolean;
};

function Wordmark() {
  return (
    <span className="text-comic-shadow-sm font-display text-base tracking-wide text-orange-deep">
      EASY <span className="text-orange">CARDS</span>
    </span>
  );
}

function NavLinks({
  items,
  isActive,
  onNavigate,
  activityCount = 0,
}: {
  items: AdminNavItem[];
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  activityCount?: number;
}) {
  return (
    <>
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const badge = item.href === "/admin/atividade" && activityCount > 0 ? activityCount : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              isActive(item.href)
                ? "bg-orange-deep text-white shadow-sm"
                : "text-ink-muted hover:bg-surface-alt hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
            {badge && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-deep px-1 text-[10px] font-bold text-white">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
            {item.beta && (
              <Badge variant="secondary" className="ml-auto font-comic text-[10px] tracking-wide">
                beta
              </Badge>
            )}
          </Link>
        );
      })}
    </>
  );
}

function Footer({
  fullName,
  roleLabel,
  version,
  avatarSprite,
}: {
  fullName: string;
  roleLabel: string;
  version: string;
  avatarSprite: string | null;
}) {
  return (
    <div className="mt-6 border-t-2 border-ink/10 pt-4">
      <div className="flex items-center gap-2 px-1">
        <PokemonAvatar sprite={avatarSprite} name={fullName} size={34} />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-ink">{fullName}</p>
          <p className="text-[11px] text-ink-muted">{roleLabel}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <LogoutButton className="flex-1 justify-start" />
        <ThemeToggle />
      </div>
      <p className="mt-2 px-1 text-[10px] text-ink-muted/60">v{version}</p>
    </div>
  );
}

export function AdminNav({
  items,
  fullName,
  roleLabel,
  version,
  avatarSprite,
  activityCount = 0,
}: {
  items: AdminNavItem[];
  fullName: string;
  roleLabel: string;
  version: string;
  avatarSprite: string | null;
  activityCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-ink/10 bg-surface/95 px-4 py-3 backdrop-blur-md md:hidden print:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/brand/icon-square.png"
            alt="Easy Cards"
            width={30}
            height={30}
            className="rounded-full"
          />
          <Wordmark />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/atividade"
            aria-label="Atividade"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink/10 bg-surface text-ink"
          >
            <Bell className="h-4 w-4" />
            {activityCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-deep px-1 text-[10px] font-bold text-white">
                {activityCount > 9 ? "9+" : activityCount}
              </span>
            )}
          </Link>
          <ThemeToggle />
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink/10 bg-surface text-ink transition-transform active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-halftone fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-l-2 border-ink/10 bg-surface px-4 py-5 shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between px-1">
                <span className="font-display text-sm tracking-wide text-ink">MENU</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-transform active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="mt-4 flex-1 space-y-1">
                <NavLinks items={items} isActive={isActive} activityCount={activityCount} onNavigate={() => setOpen(false)} />
              </nav>

              <Footer fullName={fullName} roleLabel={roleLabel} version={version} avatarSprite={avatarSprite} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* desktop sidebar */}
      <aside className="bg-halftone sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r-2 border-ink/10 bg-surface px-4 py-6 md:flex print:hidden">
        <Link href="/admin" className="mb-6 flex items-center gap-2 px-2">
          <Image
            src="/brand/icon-square.png"
            alt="Easy Cards"
            width={30}
            height={30}
            className="rounded-full"
          />
          <Wordmark />
        </Link>

        <nav className="flex-1 space-y-1">
          <NavLinks items={items} isActive={isActive} activityCount={activityCount} />
        </nav>

        <Footer fullName={fullName} roleLabel={roleLabel} version={version} avatarSprite={avatarSprite} />
      </aside>
    </>
  );
}
