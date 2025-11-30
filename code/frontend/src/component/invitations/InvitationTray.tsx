/*

 AI-generated code: 0%

 Human code: 100% (InvitationTray)

 No framework-generated code.

*/

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { InvitationSummary } from "@/types/invitationTypes";
import {
  FaBell,
  FaChevronDown,
  FaChevronUp,
  FaMapMarkerAlt,
} from "react-icons/fa";

type InvitationTrayProps = {
  invitations: InvitationSummary[];
};

export function InvitationTray({ invitations }: InvitationTrayProps) {
  const [isOpen, setIsOpen] = useState(false);

  const badgeLabel = useMemo(() => {
    const count = invitations.length;
    return count > 99 ? "99+" : count.toString();
  }, [invitations.length]);

  useEffect(() => {
    if (invitations.length > 0) {
      setIsOpen(true);
    }
  }, [invitations.length]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-neutral-900/40 transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 dark:bg-neutral-800 dark:text-amber-100 dark:hover:bg-neutral-700"
        aria-expanded={isOpen}
        aria-controls="invitation-tray-panel"
      >
        <FaBell className="h-4 w-4" />
        Invitations
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-neutral-900 shadow-inner shadow-amber-200">
          {badgeLabel}
        </span>
        {isOpen ? (
          <FaChevronDown className="h-3 w-3 opacity-80" />
        ) : (
          <FaChevronUp className="h-3 w-3 opacity-80" />
        )}
      </button>

      {isOpen ? (
        <div
          id="invitation-tray-panel"
          className="w-[min(420px,calc(100vw-24px))] rounded-3xl border border-neutral-200/80 bg-white/95 p-4 shadow-2xl shadow-amber-100/50 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/90 dark:shadow-neutral-900/50"
        >
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                Pending invites
              </p>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                You have {invitations.length} invite
                {invitations.length === 1 ? "" : "s"}
              </h3>
            </div>
          </header>

          {invitations.length === 0 ? (
            <p className="rounded-2xl border border-neutral-200/70 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-700 dark:border-white/10 dark:bg-neutral-800/70 dark:text-neutral-300">
              No pending invitations right now. When someone invites you, it
              will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div
                  key={invite.attendeeId}
                  className="rounded-2xl border border-neutral-200/70 bg-neutral-50/60 p-3 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/40 dark:border-white/10 dark:bg-neutral-800/60 dark:hover:border-amber-300/60 dark:hover:bg-amber-300/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {invite.eventName}
                      </p>
                      {invite.eventDateLabel ? (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          {invite.eventDateLabel}
                        </p>
                      ) : null}
                      {invite.eventLocation ? (
                        <p className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                          <FaMapMarkerAlt className="h-3 w-3 opacity-70" />
                          <span className="truncate">
                            {invite.eventLocation}
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/events/${invite.eventId}`}
                      className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow shadow-amber-200/70 transition hover:bg-amber-700 focus-visible:outline focus-visible:outline-amber-300 dark:bg-amber-500 dark:text-neutral-900 dark:hover:bg-amber-400"
                    >
                      View event
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
