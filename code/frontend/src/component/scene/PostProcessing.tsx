"use client";
import { EffectComposer, Noise } from "@react-three/postprocessing";

export function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      {/* Keep noise subtle; shader already supports light grain */}
      <Noise opacity={0.035} />
    </EffectComposer>
  );
}
