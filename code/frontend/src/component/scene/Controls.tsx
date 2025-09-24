"use client";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { GradientMeshProps } from "@/lib/types";

export function Controls({
  onCameraUpdate,
}: Pick<GradientMeshProps, "onCameraUpdate">) {
  const { camera } = useThree();
  return (
    <OrbitControls
      enablePan={false}
      enableZoom={false}
      enableRotate={false} // lock controls for a pure background; set true if you want interaction
      makeDefault
      onChange={() => {
        onCameraUpdate?.({
          position: [camera.position.x, camera.position.y, camera.position.z],
          target: [0, 0, 0],
        });
      }}
    />
  );
}
