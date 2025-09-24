"use client";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Drop this in your root layout (client boundary) to fade/slide between routes.
 * - `key={pathname}` tells Motion that a new page element replaces the old one.
 * - `mode="wait"` ensures the old page exits fully before the next enters (prevents flicker).
 */
export function PageTransitions({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ willChange: "transform, opacity" }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
