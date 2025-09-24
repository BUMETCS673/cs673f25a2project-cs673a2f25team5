"use client";
import { useEffect, createContext, useMemo, useContext } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useInView } from "@/hooks/UseInView";
import { canvasProps } from "@/lib/consts";

type Ctx = { envBasePath: string };
const Context = createContext<Ctx>({} as Ctx);
export const useShaderGradientCanvasContext = () => useContext(Context);

export function ShaderGradientCanvas({
  children,
  style = {},
  pixelDensity = 1,
  fov = 45,
  pointerEvents,
  className,
  envBasePath,
  lazyLoad = true,
  threshold = 0.1,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  pixelDensity?: number;
  fov?: number;
  pointerEvents?: "none" | "auto";
  className?: string;
  envBasePath?: string;
  lazyLoad?: boolean;
  threshold?: number;
}) {
  const { isInView, containerRef } = useInView(lazyLoad, threshold);
  const contextValue = useMemo<Ctx>(
    () => ({ envBasePath: envBasePath || "" }),
    [envBasePath],
  );

  useShaderChunkFix();

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", ...style }}>
      {(!lazyLoad || isInView) && (
        <Context.Provider value={contextValue}>
          <Canvas
            id="gradientCanvas"
            key={pixelDensity + fov}
            style={{ pointerEvents }}
            resize={{ offsetSize: true }}
            className={className}
            {...canvasProps(pixelDensity, fov)}
          >
            {children}
          </Canvas>
        </Context.Provider>
      )}
    </div>
  );
}

function useShaderChunkFix() {
  useEffect(() => {
    const shaderChunk = THREE.ShaderChunk as Record<string, string>;
    shaderChunk["uv2_pars_vertex"] = ``;
    shaderChunk["uv2_vertex"] = ``;
    shaderChunk["uv2_pars_fragment"] = ``;
    shaderChunk["encodings_fragment"] = ``;
  }, []);
}
