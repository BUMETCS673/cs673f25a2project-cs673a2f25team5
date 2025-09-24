import type { RootState } from "@react-three/fiber";

export const DPR_MIN = 1;
export const DPR_MAX = 2; // cap for perf on mobile

export const canvasProps = (pixelDensity = 1.5, fov = 45) => ({
  dpr: [DPR_MIN, Math.min(DPR_MAX, pixelDensity)] as [number, number],
  camera: { fov, position: [0, 0, 8] as [number, number, number] },
  gl: {
    antialias: true,
    alpha: true,
    powerPreference: "high-performance" as const,
  },
  onCreated: ({ gl }: RootState) => {
    gl.setClearColor(0x000000, 0); // transparent canvas over page
  },
});
