"use client";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export function PageTransitions({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={true}>
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
