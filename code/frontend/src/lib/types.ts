export type GradientMeshProps = {
  colorTop?: string;
  colorMid?: string; // peak color (defaults to #e91a0a)
  colorBottom?: string;

  amplitudeNear?: number;
  amplitudeFar?: number;
  frequencyY?: number;
  frequencyX?: number;
  speed?: number;
  perspectiveBoost?: number;
  tiltDeg?: number;

  grainStrength?: number;
  opacity?: number;

  width?: number;
  height?: number;
  segments?: number;

  // For Controls passthrough
  onCameraUpdate?: (payload: {
    position: [number, number, number];
    target: [number, number, number];
  }) => void;
  control?: "query" | "props";
  urlString?: string;
  lightType?: "3d" | "env";
  envPreset?: string;
  brightness?: number;
  toggleAxis?: boolean;
  grain?: "off" | "on";
};

export type GradientSceneProps = {
  lightType?: "3d" | "env";
  envPreset?: string;
  brightness?: number;
};

export type GradientControlProps = {
  toggleAxis?: boolean;
  grain?: "off" | "on";
};

export type GradientT = GradientMeshProps &
  GradientSceneProps &
  GradientControlProps;
