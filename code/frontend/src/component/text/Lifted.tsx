import { motion, Variants } from "framer-motion";

const textVariants: Variants = {
  rest: {
    y: 0,
    textShadow: "0px 0px 0px rgba(255, 255, 255, 0)",
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

export default function Lifted({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <motion.span
      initial="rest"
      animate="rest"
      whileHover="hover"
      className={`relative inline-block ${className ?? ""}`}
    >
      <motion.span variants={textVariants} className="inline-block">
        {title}
      </motion.span>
      <motion.span
        variants={underlineVariants}
        className="absolute left-0 -bottom-1 h-[4px] w-full origin-left bg-current"
      />
    </motion.span>
  );
}
