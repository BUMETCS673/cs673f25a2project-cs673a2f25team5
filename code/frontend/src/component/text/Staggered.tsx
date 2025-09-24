// app/components/text/Staggered.tsx
"use client";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
};

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 22 },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
};

export default function Staggered({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const letterClassName = className
    ? `${className} inline-block`
    : "inline-block";
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label={title}
      //   whileHover={isHovered ? "exit" : "initial"}
    >
      {title.split("").map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          variants={letterVariants}
          className={letterClassName}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  );
}
