/*

 AI-generated code: 80% (tool: Codex - GPT-5, initialEvents, status, events, errorMessage, fetchAbortRef, fetchedOnceRef, openModal, closeModal, useEffect, fetchEvents, mergeEvents, hasEvents, handleRetry  ) 
 
 Human code: 20% (functions: MapDiscoveryModalTrigger, MapDiscoveryModalTriggerProps) 

 No framework-generated code.

*/

"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { MapDiscoveryView } from "./MapDiscoveryView";
import type { EventResponse } from "@/services/events";
import { getEvents } from "@/services/events";

type ModalStatus = "idle" | "loading" | "success" | "error";

type MapDiscoveryModalTriggerProps = {
  initialEvents: EventResponse[];
};

const MAX_FETCH_LIMIT = 60;

function mergeEvents(
  current: EventResponse[],
  incoming: EventResponse[],
): EventResponse[] {
  if (!incoming.length) {
    return current;
  }
  const map = new Map<string, EventResponse>();
  for (const item of [...incoming, ...current]) {
    map.set(item.event_id, item);
  }
  return Array.from(map.values());
}

export function MapDiscoveryModalTrigger({
  initialEvents,
}: MapDiscoveryModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ModalStatus>(
    initialEvents.length ? "success" : "idle",
  );
  const [events, setEvents] = useState<EventResponse[]>(initialEvents);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const fetchedOnceRef = useRef(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = null;
    setErrorMessage(null);
    if (!events.length) {
      setStatus("idle");
      fetchedOnceRef.current = false;
    }
  };

  useEffect(() => {
    if (
      !isOpen ||
      fetchAbortRef.current ||
      (fetchedOnceRef.current && status !== "error")
    ) {
      return;
    }

    const controller = new AbortController();
    fetchAbortRef.current = controller;
    fetchedOnceRef.current = true;

    const fetchEvents = async () => {
      try {
        if (!events.length) {
          setStatus("loading");
        }
        setErrorMessage(null);
        const response = await getEvents({
          limit: MAX_FETCH_LIMIT,
          signal: controller.signal,
        });
        setEvents((previous) => mergeEvents(previous, response.items));
        setStatus("success");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "We could not load nearby events. Please try again.";
        setErrorMessage(message);
        setStatus("error");
      }
      fetchAbortRef.current = null;
    };

    void fetchEvents();

    return () => {
      controller.abort();
      fetchAbortRef.current = null;
    };
  }, [events.length, isOpen, status]);

  const hasEvents = useMemo(() => events.length > 0, [events]);

  const handleRetry = () => {
    setStatus("idle");
    fetchedOnceRef.current = false;
    setErrorMessage(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center rounded-full border border-amber-300/60 bg-white/90 px-5 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:-translate-y-[1px] hover:border-amber-400 hover:bg-amber-100 focus:outline-none focus-visible:ring focus-visible:ring-amber-300/60 dark:border-amber-400/30 dark:bg-neutral-900/70 dark:text-amber-300 dark:hover:border-amber-400/60 dark:hover:bg-amber-400/10 dark:focus-visible:ring-amber-400/40"
      >
        Discover on map
      </button>

      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={closeModal} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="relative w-full max-w-[1080px] rounded-3xl border border-neutral-200/60 bg-neutral-50/95 p-6 shadow-2xl shadow-neutral-900/20 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/90 dark:shadow-black/40">
                  <div className="flex items-start justify-between gap-4">
                    <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Nearby events
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-full border border-neutral-200/70 bg-white/80 px-3 py-1 text-xs font-medium text-neutral-500 transition hover:border-amber-400 hover:text-neutral-800 dark:border-white/10 dark:bg-neutral-800/80 dark:text-neutral-300 dark:hover:border-amber-400/50"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-6">
                    {status === "loading" && !hasEvents ? (
                      <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-amber-200/60 bg-white/70 text-sm text-neutral-500 dark:border-amber-400/20 dark:bg-neutral-900/70 dark:text-neutral-300">
                        Preparing the map…
                      </div>
                    ) : null}

                    {status === "error" && errorMessage ? (
                      <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-200/70 bg-red-50/80 px-6 py-10 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-900/30 dark:text-red-100">
                        <p>{errorMessage}</p>
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-amber-600 focus:outline-none focus-visible:ring focus-visible:ring-amber-300 dark:hover:bg-amber-400"
                        >
                          Retry
                        </button>
                      </div>
                    ) : null}

                    {status === "success" && hasEvents ? (
                      <MapDiscoveryView events={events} />
                    ) : null}

                    {status === "success" && !hasEvents ? (
                      <div className="flex h-72 items-center justify-center rounded-3xl border border-neutral-200/60 bg-white/90 text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-300">
                        We could not find published events yet.
                      </div>
                    ) : null}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
