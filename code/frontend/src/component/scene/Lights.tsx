"use client";
import { Suspense } from "react";
import { EnvironmentMap } from "./Enviroment";
import type { GradientMeshProps } from "@/lib/types";

export function Lights({
  lightType = "3d",
  brightness = 1,
  envPreset,
}: Pick<GradientMeshProps, "lightType" | "brightness" | "envPreset">) {
  return (
    <>
      {lightType === "3d" && (
        <ambientLight intensity={(brightness || 1) * Math.PI} />
      )}
      {lightType === "env" && (
        <Suspense fallback={<ambientLight intensity={0.4} />}>
          <EnvironmentMap envPreset={envPreset} background={false} />
        </Suspense>
      )}
    </>
  );
}
