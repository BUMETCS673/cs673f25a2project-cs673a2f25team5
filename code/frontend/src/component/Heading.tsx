"use client";

import { ShaderGradient } from "@/component/scene/ShaderGradient";
import { ShaderGradientCanvas } from "@/component/scene/ShadierGradientCanvas";
import { motion } from "framer-motion";
import Lifted from "./text/Lifted";

type Props = {
  compact?: boolean;
};

export default function Heading({ compact = false }: Props) {
  const subtitleClass = compact
    ? "text-xl md:text-2xl"
    : "text-2xl md:text-3xl";
  const paraClass = compact ? "text-base md:text-lg" : "text-lg md:text-xl";

  return (
    <div className=" h-full w-full relative rounded-2xl pointer-events-auto">
      <ShaderGradientCanvas pixelDensity={10.5} fov={45} pointerEvents="auto">
        <ShaderGradient
          perspectiveBoost={1.0}
          tiltDeg={12}
          grainStrength={0.22}
          lightType="3d"
          grain="on"
          toggleAxis={false}
          speed={1.2}
          colorBottom="#ff5c00"
          colorMid="#8a00c4"
          colorTop="#f52222"
        />
      </ShaderGradientCanvas>

      {/* Only text fades */}
      <main className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl">
        <Lifted
          title="Kickaas"
          className="z-50 font-atkinson-hyperlegible-next font-bold text-7xl"
        />
        <motion.h2 layout className={`${subtitleClass} font-bold font-sanchez`}>
          Your Event Manager
        </motion.h2>
        <motion.p layout className={`${paraClass} max-w-2xl text-center`}>
          One app, every event.
        </motion.p>
        <motion.div layout className="flex gap-4">
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="/create-event"
            className="bg-zinc-50 hover:bg-gray-200 text-black px-4 py-2 rounded-md"
          >
            Create an Event
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="/reguster"
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md"
          >
            Get Started
          </motion.a>
        </motion.div>
      </main>
    </div>
  );
}
