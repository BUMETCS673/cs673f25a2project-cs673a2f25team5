// Mesh.tsx
"use client";
import * as React from "react";
import { useMemo } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion"; // or your own hook
import { GradientMeshProps } from "@/lib/types";
import { waveVertex, waveFragment } from "@/lib/shader";

extend({ ShaderMaterial: THREE.ShaderMaterial });

/**
 * Mesh
 * ----
 * A large plane with a custom ShaderMaterial that:
 * - Displaces vertices along Z with traveling sine waves (toward the camera).
 * - Shades with a 3-stop vertical gradient (top -> MID (peak) -> bottom).
 * - Adds a subtle Fresnel/caustic highlight for perceived depth.
 *
 * DOM/Perf notes:
 * - We animate purely in the GPU: time → uniforms, not CPU layout.
 * - Geometry is static; fragment work is lightweight (no heavy blur/turbulence).
 * - Use a high-enough segment count for smooth displacement (e.g., 300x300).
 */
export function Mesh(props: GradientMeshProps) {
  const {
    // Colors (top → mid/peak → bottom). Peak is your mid-frame dominant color.
    colorTop = "#e3cbc7",
    colorMid = "#061255", // PEAK
    colorBottom = "#4f96ff",

    // Wave controls
    amplitudeNear = 0.26, // wave height near the viewer (units in world space)
    amplitudeFar = 0.12, // wave height far away
    frequencyY = 1.8, // waves count along Y axis
    frequencyX = 0.6, // cross-ripples along X axis
    speed = 0.6, // global wave travel speed
    perspectiveBoost = 1.0, // increases wave growth “toward” camera (z-axis cue)
    tiltDeg = 12, // tilt plane to add perspective cue

    // Rendering
    grainStrength = 0.0, // set small value (0.05) if you want film-like grain
    opacity = 1.0,

    // Geometry resolution (higher = smoother waves)
    segments = 300,
    // World size of the plane; keep bigger than viewport so edges aren’t visible
    width = 14,
    height = 9,
  } = props;

  const reduce = useReducedMotion?.() ?? false;
  const { size } = useThree();

  // Convert color strings → linear THREE.Color uniforms
  const uniforms = useMemo(() => {
    const toLinear = (hex: string) =>
      new THREE.Color(hex).convertSRGBToLinear();
    return {
      u_time: { value: 0 },
      u_opacity: { value: opacity },
      u_colorTop: { value: toLinear(colorTop) },
      u_colorMid: { value: toLinear(colorMid) },
      u_colorBottom: { value: toLinear(colorBottom) },
      u_amplitudeNear: { value: amplitudeNear },
      u_amplitudeFar: { value: amplitudeFar },
      u_frequencyY: { value: frequencyY },
      u_frequencyX: { value: frequencyX },
      u_speed: { value: speed },
      u_perspectiveBoost: { value: perspectiveBoost },
      u_grain: { value: grainStrength },
      u_aspect: { value: size.width / size.height },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep uniforms in sync if props change at runtime
  React.useEffect(() => {
    uniforms.u_opacity.value = opacity;
  }, [opacity, uniforms]);
  React.useEffect(() => {
    uniforms.u_colorTop.value.set(colorTop).convertSRGBToLinear();
  }, [colorTop, uniforms]);
  React.useEffect(() => {
    uniforms.u_colorMid.value.set(colorMid).convertSRGBToLinear();
  }, [colorMid, uniforms]);
  React.useEffect(() => {
    uniforms.u_colorBottom.value.set(colorBottom).convertSRGBToLinear();
  }, [colorBottom, uniforms]);
  React.useEffect(() => {
    uniforms.u_amplitudeNear.value = amplitudeNear;
  }, [amplitudeNear, uniforms]);
  React.useEffect(() => {
    uniforms.u_amplitudeFar.value = amplitudeFar;
  }, [amplitudeFar, uniforms]);
  React.useEffect(() => {
    uniforms.u_frequencyY.value = frequencyY;
  }, [frequencyY, uniforms]);
  React.useEffect(() => {
    uniforms.u_frequencyX.value = frequencyX;
  }, [frequencyX, uniforms]);
  React.useEffect(() => {
    uniforms.u_speed.value = speed;
  }, [speed, uniforms]);
  React.useEffect(() => {
    uniforms.u_perspectiveBoost.value = perspectiveBoost;
  }, [perspectiveBoost, uniforms]);
  React.useEffect(() => {
    uniforms.u_grain.value = grainStrength;
  }, [grainStrength, uniforms]);
  React.useEffect(() => {
    uniforms.u_aspect.value = size.width / size.height;
  }, [size, uniforms]);

  // Drive time; freeze if reduced motion
  useFrame((_, delta) => {
    if (!reduce) uniforms.u_time.value += delta;
  });

  // Plane tilt to give a horizon/perspective cue (like looking over water)
  const tiltRad = (tiltDeg * Math.PI) / 180;

  return (
    <group rotation={[-tiltRad, 0, 0]}>
      <mesh>
        <planeGeometry args={[width, height, segments, segments]} />
        <shaderMaterial
          key="wave-shader"
          uniforms={uniforms as unknown as Record<string, { value: unknown }>}
          vertexShader={waveVertex}
          fragmentShader={waveFragment}
          transparent={opacity < 1.0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
