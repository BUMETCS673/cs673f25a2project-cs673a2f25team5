import { motion, Variants } from "framer-motion";

const textContainerVariants: Variants = {
  rest: {
    transition: {
      staggerChildren: 0.01,
      staggerDirection: -1,
    },
  },
  hover: {
    transition: {
      staggerChildren: 0.01,
      staggerDirection: 1,
    },
  },
};

const letterVariants: Variants = {
  rest: {
    y: 0,
    textShadow: "0px 0px 0px rgba(255, 255, 255, 0)",
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 22,
    },
  },
  hover: {
    y: -5,
    textShadow: "0px 0px 12px rgba(255, 255, 255, 0.5)",
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 22,
    },
  },
};

const underlineVariants: Variants = {
  rest: { scaleX: 0, opacity: 0.35 },
  hover: {
    scaleX: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 360,
      damping: 28,
    },
  },
};

type LiftedProps = {
  title: string;
  className?: string;
  underline?: boolean;
  trigger?: "hover" | "manual";
  active?: boolean;
};

export default function Lifted({
  title,
  className,
  underline = true,
  trigger = "hover",
  active = false,
}: LiftedProps) {
  const resolvedAnimate = trigger === "manual" && active ? "hover" : "rest";
  const resolvedWhileHover = trigger === "hover" ? "hover" : undefined;

  return (
    <motion.span
      initial="rest"
      animate={resolvedAnimate}
      whileHover={resolvedWhileHover}
      className={`relative inline-block ${className ?? ""}`}
    >
      <motion.span variants={textContainerVariants} className="inline-flex">
        {Array.from(title).map((character, index) => (
          <motion.span
            key={`${character}-${index}`}
            variants={letterVariants}
            className="inline-block"
          >
            {character === " " ? "\u00A0" : character}
          </motion.span>
        ))}
      </motion.span>
      {underline && (
        <motion.span
          variants={underlineVariants}
          className="absolute left-0 -bottom-1 h-[4px] w-full origin-left bg-current"
        />
      )}
    </motion.span>
  );
}
