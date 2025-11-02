"use client";

import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";

export default function Profile() {
  const categories = {
    Attending: [
      {
        id: 1,
        title: "Cassies Birthday Party",
        date: "October 20",
      },
      {
        id: 2,
        title: "Halloween Party",
        date: "1 day ago",
      },
    ],
    Created: [
      {
        id: 1,
        title: "Saniya Birthday",
        date: "Mar 20",
      },
      {
        id: 2,
        title: "Sai's Birthday",
        date: "Mar 19",
      },
    ],
    Upcoming: [
      {
        id: 1,
        title: "Thanksgiving Dinner",
        date: "20d ago",
      },
      {
        id: 2,
        title: "Ice Skating Class",
        date: "2 weeks ago",
      },
    ],
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <TabGroup>
          {/* Tabs Header */}
          <TabList className="flex justify-center space-x-3 rounded-2xl bg-neutral-800/60 p-2 shadow-md backdrop-blur-md">
            {Object.keys(categories).map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  `w-full rounded-xl px-6 py-2 text-sm font-semibold transition-all duration-200 ${
                    selected
                      ? "bg-gradient-to-r from-amber-500 to-amber-300 text-white shadow-lg ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-900"
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
                className="rounded-xl bg-neutral-900 p-5 shadow-lg ring-1 ring-neutral-700"
              >
                <ul className="space-y-4">
                  {posts.map((post) => (
                    <li
                      key={post.id}
                      className="rounded-md p-3 transition hover:bg-neutral-800"
                    >
                      <h3 className="text-base font-semibold text-white">
                        {post.title}
                      </h3>
                      <ul className="mt-1 flex space-x-1 text-xs text-neutral-400">
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
