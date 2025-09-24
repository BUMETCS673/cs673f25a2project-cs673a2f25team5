"use client";

import { useShaderGradientCanvasContext } from "./ShadierGradientCanvas";
import { Environment } from "@react-three/drei";

export function EnvironmentMap({
  background = false,
}: {
  envPreset?: string;
  background?: boolean;
}) {
  const { envBasePath } = useShaderGradientCanvasContext();
  // You can switch on envPreset to load different HDRIs or pass a path
  return (
    <Environment
      files={`${envBasePath || "/env"}/studio.hdr`}
      background={background}
    />
  );
}
