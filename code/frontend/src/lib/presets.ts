import { GradientMeshProps } from "./types";

export const presets = {
  halo: {
    props: {
      colorTop: "#e28cb3",
      colorMid: "#e91a0a", // your mid-frame peak
      colorBottom: "#ea6635",
      amplitudeNear: 0.3,
      amplitudeFar: 0.12,
      frequencyY: 2.0,
      frequencyX: 0.7,
      speed: 0.7,
      perspectiveBoost: 1.0,
      tiltDeg: 12,
      grainStrength: 0.02,
      opacity: 1,
      width: 16,
      height: 10,
      segments: 320,
      lightType: "3d",
      brightness: 1.0,
      grain: "off",
      toggleAxis: false,
    } satisfies GradientMeshProps,
  },
};
