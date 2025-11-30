/*

 AI-generated code: 0%

 Human code: 100% (EventInvitationPanel)

 No framework-generated code.

*/

"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import type {
  InviteActionHandler,
  InviteeLookupHandler,
  InviteeLookupSuccess,
} from "@/types/invitationTypes";

type EventInvitationPanelProps = {
  eventName: string;
  hostName?: string | null;
  onInvite: InviteActionHandler;
  resolveInvitee?: InviteeLookupHandler | null;
};

type BannerTone = "success" | "info" | "error";

function bannerClasses(tone: BannerTone) {
  if (tone === "success") {
    return "border-emerald-200/70 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100";
  }
  if (tone === "info") {
    return "border-amber-200/70 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-300/10 dark:text-amber-100";
  }
  return "border-red-200/70 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100";
}

export function EventInvitationPanel({
  eventName,
  hostName,
  onInvite,
  resolveInvitee,
}: EventInvitationPanelProps) {
  const [inviteeQuery, setInviteeQuery] = useState("");
  const [banner, setBanner] = useState<{
    message: string;
    tone: BannerTone;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [resolvedInvitee, setResolvedInvitee] =
    useState<InviteeLookupSuccess | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!resolveInvitee) {
      return;
    }

    const query = inviteeQuery.trim();
    if (!query) {
      setResolvedInvitee(null);
      setSelectedUserId(null);
      setIsResolving(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsResolving(true);
      resolveInvitee(query)
        .then((result) => {
          if (result.success) {
            setResolvedInvitee(result);
            setSelectedUserId(result.users[0]?.user_id ?? null);
            setBanner(null);
          } else {
            setResolvedInvitee(null);
            setSelectedUserId(null);
            if (result.code === "notFound") {
              setBanner({
                tone: "info",
                message:
                  "We couldn't find that user. Check the spelling or email.",
              });
            }
          }
        })
        .catch((error) => {
          console.error("Failed to resolve invitee", error);
          setResolvedInvitee(null);
          setSelectedUserId(null);
        })
        .finally(() => {
          setIsResolving(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [inviteeQuery, resolveInvitee]);

  const resetBanner = () => setBanner(null);

  const handleInvite = (formData: FormData) => {
    const query = (formData.get("invitee") as string | null)?.trim() ?? "";
    if (!query) {
      setBanner({
        tone: "error",
        message: "Add a name, email, or user ID to send an invitation.",
      });
      return;
    }

    resetBanner();
    setResolvedInvitee(null);

    const targetUserId =
      selectedUserId ?? resolvedInvitee?.users[0]?.user_id ?? undefined;

    startTransition(() => {
      onInvite(query, targetUserId)
        .then((result) => {
          if (result.success) {
            setInviteeQuery("");
            setBanner({ tone: "success", message: result.message });
            const invitedName =
              `${result.invitedUser.first_name} ${result.invitedUser.last_name}`.trim();
            const toastMessage = invitedName || "Invitation sent.";
            toast.success(toastMessage);
            setSelectedUserId(null);
            setResolvedInvitee(null);
            return;
          }

          const tone: BannerTone =
            result.code === "duplicate" ? "info" : "error";
          setBanner({ tone, message: result.message });
          if (tone === "info") {
            toast.info(result.message);
          } else {
            toast.error(result.message);
          }
        })
        .catch((error) => {
          console.error("Invitation failed", error);
          setBanner({
            tone: "error",
            message: "We couldn't send that invite. Please try again.",
          });
          toast.error("We couldn't send that invite. Please try again.");
        });
    });
  };

  return (
    <section className="rounded-3xl border border-amber-200/70 bg-white/90 p-6 shadow-lg shadow-amber-100/40 dark:border-white/10 dark:bg-neutral-900/70 dark:shadow-neutral-900/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
            Host tool
          </p>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Invite guests already on Kickaas
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Send invites to people who already use the app. Invitations are
            stored as pending attendees until they RSVP.
          </p>
        </div>
        <div className="rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
          {hostName ? `${hostName} - Host` : "Event host"}
        </div>
      </div>

      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleInvite(new FormData(event.currentTarget));
        }}
      >
        <label
          htmlFor="invitee"
          className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
        >
          Invite by email, name, or user ID
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            name="invitee"
            value={inviteeQuery}
            onChange={(event) => {
              setInviteeQuery(event.target.value);
              resetBanner();
            }}
            className="w-full rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 text-sm text-neutral-900 shadow-inner shadow-amber-50/50 transition placeholder:text-neutral-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-50 dark:shadow-none dark:placeholder:text-neutral-500 dark:focus:border-amber-300 dark:focus:ring-amber-300/40"
            placeholder="sasha@example.com"
            aria-label="Invitee identifier"
            disabled={isPending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200/60 transition hover:bg-amber-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-500 dark:text-neutral-900 dark:shadow-amber-500/30 dark:hover:bg-amber-400 dark:focus-visible:outline-amber-300"
          >
            {isPending ? "Sending..." : "Send invite"}
          </button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          We will add them to the guest list for &ldquo;{eventName}&rdquo;. If
          they are already registered, we will keep their existing status.
        </p>

        {isResolving ? (
          <p className="rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-xs text-neutral-700 shadow-sm dark:border-white/10 dark:bg-neutral-800/70 dark:text-neutral-300">
            Looking up matches…
          </p>
        ) : null}
      </form>

      {resolvedInvitee ? (
        <div className="mt-4 space-y-2 rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-neutral-800/70">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-300">
            Matching users
          </p>
          <div className="space-y-2">
            {resolvedInvitee.users.map((user) => {
              const isSelected = user.user_id === selectedUserId;
              return (
                <button
                  key={user.user_id}
                  type="button"
                  onClick={() => setSelectedUserId(user.user_id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-amber-300 ${isSelected ? "border-amber-400 bg-amber-50 dark:border-amber-300/70 dark:bg-amber-300/10" : "border-neutral-200/70 bg-white/80 hover:border-amber-300 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:border-amber-300/60"}`}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {user.email}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isSelected ? "bg-amber-500 text-neutral-900" : "bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-neutral-300"}`}
                    aria-hidden
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {banner ? (
        <p
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm shadow-sm ${bannerClasses(banner.tone)}`}
        >
          {banner.message}
        </p>
      ) : null}
    </section>
  );
}
