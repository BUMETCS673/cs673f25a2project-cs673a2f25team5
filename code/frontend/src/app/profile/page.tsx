/** 
 * 
  AI-generated code: 25% (tool: Codex - GPT-5, modified and adapted, functions: UserProfile1, useUser, useCallback, useEffect, useState) 

  Human code: 75% (functions: UserProfile1, useUser, useCallback, useEffect, useState) 

  Framework-generated code: 0%

 **/

"use client";

import { useEffect, useState } from "react";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";
import {
  getAttendingEvents,
  getCreatedEvents,
  getUpcomingEvents,
} from "@/services/events";

type AnyEvent = { event_id?: string; event_name?: string } & Record<string, any>;

const TABS = ["Attending", "Created", "Upcoming"] as const;

export default function Profile() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [eventsMap, setEventsMap] = useState<Record<string, AnyEvent[]>>({});
  const [loading, setLoading] = useState<boolean>(false);

  const fetchForTab = async (tab: string) => {
    setLoading(true);
    try {
      let res: any;
      if (tab === "Attending") {
        res = await getAttendingEvents({ offset: 0, limit: 5 });
      } else if (tab === "Created") {
        res = await getCreatedEvents({ offset: 0, limit: 5 });
      } else {
        res = await getUpcomingEvents({ offset: 0, limit: 5 });
      }

      const items: AnyEvent[] = Array.isArray(res) ? res : res?.items ?? [];
      setEventsMap((prev) => ({ ...prev, [tab]: items }));
    } catch (err) {
      console.error("Failed to fetch events for tab", tab, err);
      setEventsMap((prev) => ({ ...prev, [tab]: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load: fetch Attending
    fetchForTab(TABS[0]);
  }, []);

  useEffect(() => {
    // when selected tab changes, fetch if not already fetched
    const tab = TABS[selectedIndex];
    if (!eventsMap[tab]) fetchForTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="w-full max-w-2xl py-20">
        <TabGroup selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          {/* Tabs Header */}
          <TabList className="flex justify-center space-x-3 rounded-2xl bg-neutral-50 text-neutral-900 dark:text-neutral-100 dark:bg-neutral-950">
            {TABS.map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  `w-full rounded-xl px-6 py-2 text-sm font-semibold transition-all duration-200 ${
                    selected
                      ? "bg-gradient-to-r from-amber-500 to-amber-300 text-white shadow-lg ring-2 ring-amber-400 ring-offset-2"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-white hover:bg-neutral-700/60"
                  }`
                }
              >
                {category}
              </Tab>
            ))}
          </TabList>

          {/* Tab Content */}
          <TabPanels className="mt-6">
            {TABS.map((tab) => {
              const posts = eventsMap[tab] ?? [];
              return (
                <TabPanel
                  key={tab}
                  className="rounded-xl bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 p-5 shadow-lg ring-1 ring-neutral-400"
                >
                  {loading && posts.length === 0 ? (
                    <div>Loading…</div>
                  ) : posts.length === 0 ? (
                    <div>No events</div>
                  ) : (
                    <ul className="space-y-4">
                      {posts.map((post, idx) => (
                        <li
                          key={post.event_id ?? post.id ?? idx}
                          className="rounded-md p-3 transition hover:bg-neutral-200 dark:hover:bg-neutral-800"
                        >
                          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {post.event_name ?? post.title}
                          </h3>
                          {post.event_datetime || post.date ? (
                            <ul className="mt-1 flex space-x-1 text-xs text-neutral-500">
                              <li>{post.event_datetime ?? post.date}</li>
                            </ul>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </TabPanel>
              );
            })}
          </TabPanels>
        </TabGroup>
      </div>
    </main>
  );
}

export default UserProfile1;
