"use client";

import { motion } from "framer-motion";
import Lifted from "../text/Lifted";

export default function Heading({ cookie }: { cookie: string }) {
  return (
    <div className="h-screen w-full relative rounded-2xl pointer-events-auto overflow-hidden">
      <div className="absolute inset-0 -z-10"></div>

      {/* Only text fades */}
      <main className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl text-neutral-900 dark:text-neutral-100">
        <Lifted
          title="Kickaas"
          className="z-50 font-atkinson-hyperlegible-next font-bold text-7xl text-neutral-900 dark:text-neutral-100"
        />
        <motion.h2 layout className={`font-bold font-sanchez`}>
          Your Event Manager
        </motion.h2>
        <motion.p layout className={`max-w-2xl text-center`}>
          Plan, Manage, and Experience Events — All in One Place
        </motion.p>
        <motion.div layout className="flex gap-4">
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="/create-event"
            className="rounded-md bg-amber-400 px-4 py-2 font-medium text-black transition hover:bg-amber-300"
          >
            Create an Event
          </motion.a>
          {!cookie && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="/register"
              className="rounded-md border border-neutral-400 px-4 py-2 font-medium text-neutral-800 transition hover:border-neutral-600 hover:text-neutral-900 dark:border-white/40 dark:text-white dark:hover:border-white/60"
            >
              Register
            </motion.a>
          )}
        </motion.div>
      </main>
    </div>
  );
}
