/** 
  AI-generated code: 0%
  Human code: 0%
  Framework-generated code: 100% (functions: useUser, useCallback, useEffect, useState) from @clerk/nextjs
 **/

"use client";
import React, { useCallback, useEffect, useState } from "react";

import { Card, CardContent, CardHeader } from "@/component/ui/card";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { getEvents } from "@/services/events";
import { EventsResults } from "@/component/events/EventsResults";
import { EventResponse } from "@/types/eventTypes";
import Image from "next/image";
import { getAttendees } from "@/services/attendees";

function UserProfile1() {
  const { user } = useUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const userId = user?.externalId;

  const [eventSource, setEventSource] = useState<"created" | "registered">(
    "created",
  );
  const [createdEvents, setCreatedEvents] = useState<EventResponse[] | null>(
    null,
  );
  const [registeredEvents, setRegisteredEvents] = useState<
    EventResponse[] | null
  >(null);
  const [displayedEvents, setDisplayedEvents] = useState<EventResponse[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    setCreatedEvents(null);
    setRegisteredEvents(null);
    setDisplayedEvents([]);
    setEventSource("created");
  }, [userId]);

  const loadCreatedEvents = useCallback(async () => {
    if (!userId) {
      return [];
    }
    const response = await getEvents({
      filters: [`user_id:eq:${userId}`],
    });
    return response.items;
  }, [userId]);

  const loadRegisteredEvents = useCallback(async () => {
    if (!userId) {
      return [];
    }

    const attendeeResult = await getAttendees({
      filters: [`user_id:eq:${userId}`],
      limit: 100,
    });

    if (attendeeResult.items.length === 0) {
      return [];
    }

    const uniqueEventIds = Array.from(
      new Set(attendeeResult.items.map((attendee) => attendee.event_id)),
    );

    const fetchedEvents = await Promise.all(
      uniqueEventIds.map(async (eventId) => {
        const result = await getEvents({
          filters: [`event_id:eq:${eventId}`],
          limit: 1,
        });
        return result.items[0] ?? null;
      }),
    );

    return fetchedEvents.filter((event): event is EventResponse =>
      Boolean(event),
    );
  }, [userId]);

  useEffect(() => {
    if (eventSource === "created" && createdEvents) {
      setDisplayedEvents(createdEvents);
      return;
    }

    if (eventSource === "registered" && registeredEvents) {
      setDisplayedEvents(registeredEvents);
      return;
    }

    setDisplayedEvents([]);
  }, [eventSource, createdEvents, registeredEvents]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const needsCreated = eventSource === "created" && !createdEvents;
    const needsRegistered = eventSource === "registered" && !registeredEvents;

    if (!needsCreated && !needsRegistered) {
      setEventsError(null);
      setIsLoadingEvents(false);
      return;
    }

    let cancelled = false;
    setEventsError(null);
    setIsLoadingEvents(true);

    const fetchEvents = async () => {
      try {
        const data = needsCreated
          ? await loadCreatedEvents()
          : await loadRegisteredEvents();

        if (cancelled) {
          return;
        }

        if (eventSource === "created") {
          setCreatedEvents(data);
        } else {
          setRegisteredEvents(data);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "We could not load your events. Please try again.";
        setEventsError(message);
      } finally {
        if (!cancelled) {
          setIsLoadingEvents(false);
        }
      }
    };

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [
    createdEvents,
    eventSource,
    loadCreatedEvents,
    loadRegisteredEvents,
    registeredEvents,
    userId,
  ]);

  const headingText =
    eventSource === "created" ? "Events created" : "Registered events";
  const descriptionText =
    eventSource === "created"
      ? "View all your events created by you."
      : "Browse the events you've registered to attend.";
  const createdEventsCount =
    createdEvents?.length ??
    (eventSource === "created" ? displayedEvents.length : 0);
  const shouldShowEmptyState =
    !isLoadingEvents && !eventsError && displayedEvents.length === 0;

  return (
    <main className=" w-screen min-h-screen py-10 dark:bg-neutral-950">
      <section className="container mx-auto px-8 py-10 dark:bg-neutral-950">
        <Card className="border border-gray-300 dark:border-neutral-800 rounded-2xl dark:bg-neutral-900">
          <CardHeader className="h-60 !rounded-lg overflow-hidden">
            <Image
              src={"/Hero.jpg"}
              alt="User profile background"
              height={1024}
              width={1024}
              className="h-full w-full rounded-lg object-cover"
            />
          </CardHeader>
          <CardContent>
            <div className="flex lg:gap-0 gap-6 flex-wrap justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar className="inline-flex size-[45px] select-none items-center justify-center overflow-hidden rounded-full bg-blackA1 align-middle">
                  <AvatarImage
                    className="size-full rounded-[inherit] object-cover"
                    src={user?.imageUrl || "/img/avatar1.jpg"}
                    width={200}
                    height={200}
                  />
                  <AvatarFallback
                    className="leading-1 flex size-full items-center justify-center bg-white text-[15px] font-medium text-violet11"
                    delayMs={600}
                  >
                    {(user?.firstName?.charAt(0) || "A") +
                      (user?.lastName?.charAt(0) || "A")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    <em>{email}</em>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Joined on {user?.createdAt?.toLocaleDateString()}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Events created: {createdEventsCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-10 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {headingText}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                {descriptionText}
              </p>
            </div>
            <label className="flex flex-col text-sm font-medium text-neutral-600 dark:text-neutral-300">
              <span>Show</span>
              <select
                value={eventSource}
                onChange={(event) =>
                  setEventSource(event.target.value as "created" | "registered")
                }
                className="mt-1 rounded-2xl border border-neutral-200 bg-white/90 dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-amber-400 dark:focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-white/10 dark:text-neutral-100"
              >
                <option
                  value="created"
                  className="dark:text-neutral-100 bg-white/90 dark:bg-neutral-900"
                >
                  Events I created
                </option>
                <option
                  value="registered"
                  className="dark:text-neutral-100 bg-white/90 dark:bg-neutral-900"
                >
                  Events I registered for
                </option>
              </select>
            </label>
          </div>
          {eventsError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {eventsError}
            </p>
          ) : null}
          <EventsResults
            events={displayedEvents}
            hasQuery={false}
            trimmedQuery=""
            shouldFetchRemoteSearch={false}
            showEmptyState={shouldShowEmptyState}
            remoteError={null}
            baseError={eventsError}
            isRemoteLoading={false}
            isBaseLoading={isLoadingEvents}
            pagination={{
              show: false,
              rangeStart: 0,
              rangeEnd: 0,
              currentPage: 0,
              totalPages: 0,
              totalCount: 0,
              disablePrevious: false,
              disableNext: false,
            }}
            onPreviousPage={() => {}}
            onNextPage={() => {}}
            onRetryBase={() => {
              setCreatedEvents(null);
              setRegisteredEvents(null);
            }}
            onRetryRemote={() => {}}
          />
        </div>
      </section>
    </main>
  );
}

export default UserProfile1;
