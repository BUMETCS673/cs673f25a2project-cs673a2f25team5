"use client";

import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";

export default function Profile() {
  const categories = {
    Attending: [
      {
        id: 1,
        title: "Saniya's Birthday",
        date: "Aug 11",
      },
      {
        id: 2,
        title: "Christmas Party",
        date: "Dec 25",
      },
    ],
    Created: [
      {
        id: 1,
        title: "Saniya's Birthday",
        date: "Aug 11",
      },
      {
        id: 2,
        title: "Sai's Birthday",
        date: "April 5",
      },
    ],
    Upcoming: [
      {
        id: 1,
        title: "Thanksgiving Dinner",
        date: "Nov 27",
      },
      {
        id: 2,
        title: "Ice Skating Class",
        date: "Nov 13",
      },
    ],
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="w-full max-w-2xl py-20">
        <TabGroup>
          {/* Tabs Header */}
          <TabList className="flex justify-center space-x-3 rounded-2xl bg-neutral-50 text-neutral-900 dark:text-neutral-100 dark:bg-neutral-950 dark:text-neutral-100">
            {Object.keys(categories).map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  `w-full rounded-xl px-6 py-2 text-sm font-semibold transition-all duration-200 ${
                    selected
                      ? "bg-gradient-to-r from-amber-500 to-amber-300 text-white shadow-lg ring-2 ring-amber-400 ring-offset-2"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-700/60"
                  }`
                }
              >
                {category}
              </Tab>
            ))}
          </TabList>

          {/* Tab Content */}
          <TabPanels className="mt-6">
            {Object.values(categories).map((posts, idx) => (
              <TabPanel
                key={idx}
                className="rounded-xl bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 p-5 shadow-lg ring-1 ring-neutral-400"
              >
                <ul className="space-y-4">
                  {posts.map((post) => (
                    <li
                      key={post.id}
                      className="rounded-md p-3 transition hover:bg-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {post.title}
                      </h3>
                      <ul className="mt-1 flex space-x-1 text-xs text-neutral-500">
                        <li>{post.date}</li>
                      </ul>
                    </li>
                  ))}
                </ul>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </div>
    </main>
  );
}
