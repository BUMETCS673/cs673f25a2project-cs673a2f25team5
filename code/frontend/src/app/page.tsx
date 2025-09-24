"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Heading from "@/component/Heading";
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import Staggered from "@/component/text/Staggered";

type Dock = { tx: number; ty: number; scale: number };

export default function Page() {
  const { scrollY } = useScroll();

  // Landing card ref (where the hero docks)
  const dockRef = useRef<HTMLDivElement | null>(null);

  // Scroll progress (0 → 1 over threshold)
  const [p, setP] = useState(0);

  // Calculated transform to land exactly in the card
  const [dock, setDock] = useState<Dock>({ tx: 0, ty: 0, scale: 0.8 });

  const thresholdPc = 0.6; // how far to scroll before complete
  const spring = useMemo(
    () => ({ type: "spring", stiffness: 220, damping: 28, mass: 0.9 }),
    [],
  );

  // Compute where the hero needs to move/scale to perfectly cover the dock card
  const computeDock = () => {
    if (!dockRef.current || typeof window === "undefined") return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const viewport = { x: 0, y: 0, w: vw, h: vh, cx: vw / 2, cy: vh / 2 };

    const r = dockRef.current.getBoundingClientRect();
    const target = {
      x: r.left,
      y: r.top,
      w: r.width,
      h: r.height,
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
    };

    // scale to match min dimension to preserve content nicely
    const sx = target.w / viewport.w;
    const sy = target.h / viewport.h;
    const scale = Math.min(sx, sy);

    // move overlay’s center from viewport center → target center
    const tx = target.cx - viewport.cx;
    const ty = target.cy - viewport.cy;

    setDock({ tx, ty, scale });
  };

  // init + resize
  useEffect(() => {
    if (typeof window === "undefined") return;

    const apply = () => {
      const threshold = Math.max(1, window.innerHeight * thresholdPc);
      const np = Math.min(1, Math.max(0, window.scrollY / threshold));
      setP(np);
    };

    computeDock();
    apply();

    const onResize = () => {
      computeDock();
      apply();
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // live scroll
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (typeof window === "undefined") return;
    const threshold = Math.max(1, window.innerHeight * thresholdPc);
    const np = Math.min(1, Math.max(0, latest / threshold));
    setP(np);
  });

  // helpers
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smoothstep = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  // Optional gentle curve on the path (arc slightly as it moves)
  const curve = (t: number) => {
    // ease in-out + a tiny overshoot on X (bezier-ish)
    const u = t * t * (3 - 2 * t);
    const wobble = Math.sin(t * Math.PI) * 8; // px
    return { f: u, wobble };
  };
  const { f, wobble } = curve(p);

  // Interpolated transform
  const translateX = dock.tx * f + (dock.ty ? wobble : 0); // tiny wobble across
  const translateY = dock.ty * f;
  const scale = 1 + (dock.scale - 1) * f;
  const radius = 24 * f;

  // ── NEW: rotate left → then right halfway (with a tiny wobble) ──────────────
  const mid = 0.5; // where direction changes
  const leftMax = -12; // degrees (tilt left)
  const rightMax = -1; // degrees (tilt right)

  const tLeft = smoothstep(0.08, mid - 0.06, p); // ease in to left
  const tRight = smoothstep(mid + 0.06, 0.98, p); // ease to right
  const rotateBase =
    p <= mid
      ? lerp(0, leftMax, tLeft) // 0 → left
      : lerp(leftMax, rightMax, tRight); // left → right
  const wobbleRot = Math.sin(p * Math.PI * 1.2) * 1.2; // subtle life
  const rotate = rotateBase + wobbleRot;

  // ── Text crossfade: overlay text out (no container opacity change) ─────────

  // If you want the inline text to fade in as it docks, uncomment below
  // const textIn = smoothstep(0.55, 0.95, p);
  // const textOpacityInline = Math.max(0, Math.min(1, textIn));

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="relative min-h-[200vh] w-full overflow-x-hidden">
          {/* spacer for first screen */}
          <div className="absolute inset-0 -z-10 h-screen w-full bg-transparent" />

          {/* Overlay that *moves and rotates* toward the dock card */}
          <AnimatePresence initial={false}>
            <motion.div
              key="hero-overlay"
              className="fixed inset-0 z-40 flex h-screen w-screen items-center justify-center"
              initial={{
                x: 0,
                y: 0,
                scale: 1,
                rotate: 0,
                borderRadius: 0,
              }}
              animate={{
                x: translateX,
                y: translateY,
                scale,
                rotate,
                borderRadius: radius,
              }}
              transition={spring}
              style={{ pointerEvents: "none" }}
            >
              <div className="absolute inset-0 rounded-[inherit]" />
              <Heading />
            </motion.div>
          </AnimatePresence>

          {/* CONTENT SECTION */}
          <div className="h-screen absolute bottom-0 left-0 w-full flex px-3">
            {/* Left panel */}
            <div>
              <Staggered
                title="Hello"
                className="text-4xl font-bold z-50 font-atkinson-hyperlegible-next"
              />
              <p className="text-lg">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            {/* Right grid (dock target) */}
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={spring}
              className="flex h-full w-2/3 items-center justify-center "
            >
              <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-4 p-4">
                <div
                  ref={dockRef}
                  className="relative col-span-3 row-span-2 overflow-hidden rounded-2xl"
                >
                  {/* Inline hero always mounted; only its TEXT fades in if enabled */}
                  <div className="h-full w-full">
                    {/* <Heading compact textOpacity={textOpacityInline} /> */}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
