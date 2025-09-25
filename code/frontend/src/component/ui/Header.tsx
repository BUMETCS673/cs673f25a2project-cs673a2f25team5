"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FaBars, FaSearch, FaTimes } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { LoginForm } from "../auth/LoginForm";
import { Signout } from "../auth/Signout";
import Lifted from "../text/Lifted";

export default function Header({ cookie }: { cookie: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 border-b border-neutral-200/70 bg-white/95 bg-opacity-50 backdrop-blur-sm shadow-sm dark:border-white/10 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0">
          <Lifted
            title="Kickaas"
            className="font-atkinson-hyperlegible-next text-2xl font-bold"
          />
        </Link>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex w-full max-w-xl items-center gap-4 rounded-4xl border border-neutral-200 bg-white/70 px-4 py-2 shadow-sm dark:border-white/15 dark:bg-white/5">
            <div className="flex flex-1 items-center gap-3 border-r border-neutral-200 pr-3 dark:border-white/10">
              <FaSearch className="text-neutral-500" />
              <input
                type="text"
                placeholder="Search events"
                className="w-full bg-transparent text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none dark:text-neutral-100"
              />
            </div>
            <div className="h-7 w-px bg-neutral-200 dark:bg-white/15" />
            <div className="flex flex-1 items-center gap-3">
              <FaLocationDot className="text-neutral-500" />
              <input
                type="text"
                placeholder="Location"
                className="w-full bg-transparent text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none dark:text-neutral-100"
              />
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/discover">
            <Lifted title="Discover" className="text-sm font-semibold" />
          </Link>
          <Link href="/create-events">
            <Lifted title="Create Event" className="text-sm font-semibold" />
          </Link>
          {cookie ? <Signout /> : <LoginForm />}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          className="flex items-center justify-center rounded-full border border-neutral-200 p-2 text-neutral-700 transition hover:bg-neutral-100 focus:outline-none md:hidden dark:border-white/20 dark:text-neutral-100 dark:hover:bg-white/10"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <FaTimes size={16} /> : <FaBars size={18} />}
        </button>
      </div>

      <div
        className={`md:hidden border-t border-neutral-200/80 bg-white/98 px-4 transition-all duration-200 ease-out dark:border-white/10 dark:bg-neutral-950/90 ${menuOpen ? "max-h-[480px] opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 py-4">
          <div className="space-y-3 rounded-3xl border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-white/15 dark:bg-white/5">
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-transparent">
              <FaSearch className="text-neutral-500" />
              <input
                type="text"
                placeholder="Search events"
                className="w-full bg-transparent text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none dark:text-neutral-100"
              />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-transparent">
              <FaLocationDot className="text-neutral-500" />
              <input
                type="text"
                placeholder="Location"
                className="w-full bg-transparent text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none dark:text-neutral-100"
              />
            </div>
          </div>

          <nav className="flex flex-col gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            <Link
              href="/discover"
              className="rounded-2xl border border-transparent px-4 py-2 hover:border-neutral-200 hover:bg-neutral-100 dark:hover:border-white/15 dark:hover:bg-white/10"
            >
              Discover
            </Link>
            <Link
              href="/create-events"
              className="rounded-2xl border border-transparent px-4 py-2 hover:border-neutral-200 hover:bg-neutral-100 dark:hover:border-white/15 dark:hover:bg-white/10"
            >
              Create Event
            </Link>
          </nav>

          <div className="flex items-center justify-start gap-3">
            {cookie ? <Signout /> : <LoginForm />}
          </div>
        </div>
      </div>
    </header>
  );
}
