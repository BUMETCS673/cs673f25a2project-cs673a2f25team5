// shaders.ts
export const waveVertex = /* glsl */ `
  // Vertex shader: displace vertices along Z with traveling waves.
  // Waves mainly move along +Y (toward the viewer due to camera/tilt),
  // plus slight cross-ripples on X. Near rows swell more than far rows
  // to simulate z-axis approach.

  precision highp float;

  uniform float u_time;
  uniform float u_amplitudeNear;
  uniform float u_amplitudeFar;
  uniform float u_frequencyY;
  uniform float u_frequencyX;
  uniform float u_speed;
  uniform float u_perspectiveBoost;

  varying vec2 vUv;
  varying float vHeight; // wave height for lighting cue

  // Smoothstep helper
  float sstep(float e0, float e1, float x) {
    float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }

  void main() {
    vUv = uv;

    // Interpolate amplitude from far (top of plane: vUv.y ~ 0) to near (bottom: vUv.y ~ 1)
    float amp = mix(u_amplitudeFar, u_amplitudeNear, pow(vUv.y, 1.0 + u_perspectiveBoost * 0.6));

    // Primary wave travels along +Y; phase advances with time
    float phaseY = (vUv.y * 6.28318 * u_frequencyY) - (u_time * u_speed);

    // Cross-ripples along X, lower amplitude; small phase offset for organic motion
    float cross = sin((vUv.x * 6.28318 * u_frequencyX) + (u_time * u_speed * 0.6)) * 0.35;

    // Z displacement (toward camera). We bias with a gentle swell so crests feel round.
    float h = sin(phaseY + cross);
    float swell = 0.35 * sin(phaseY * 0.5);
    float heightZ = (h + swell) * amp;

    // Pass for lighting-ish effects in fragment
    vHeight = heightZ;

    vec3 displaced = position + vec3(0.0, 0.0, heightZ);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

export const waveFragment = /* glsl */ `
  // Fragment shader: 3-stop gradient with the MID stop as the dominant peak color.
  // Adds a tiny Fresnel-like rim and optional grain for texture.

  precision highp float;

  uniform vec3 u_colorTop;
  uniform vec3 u_colorMid;
  uniform vec3 u_colorBottom;
  uniform float u_opacity;
  uniform float u_grain;
  uniform float u_aspect;

  varying vec2 vUv;
  varying float vHeight;

  // Ternary gradient blend: top -> mid -> bottom, centered at 0.5 with a slight bias.
  vec3 triGradient(vec2 uv) {
    // Weighting: emphasize mid around uv.y ~ 0.5
    float midBias = 0.1; // push more energy to mid color
    float tTop    = smoothstep(0.0, 0.45 - midBias, uv.y);
    float tBottom = 1.0 - smoothstep(0.55 + midBias, 1.0, uv.y);

    // Combine into three weights that sum to ~1
    float wTop = (1.0 - tTop) * (1.0 - (1.0 - tBottom));
    float wMid = 1.0 - abs(uv.y - 0.5) * 2.0; // triangle peak at 0.5
    wMid = clamp(wMid + midBias, 0.0, 1.0);
    float wBottom = (1.0 - tBottom) * (1.0 - (1.0 - tTop));

    // Normalize weights
    float sumW = wTop + wMid + wBottom + 1e-5;
    wTop    /= sumW;
    wMid    /= sumW;
    wBottom /= sumW;

    return u_colorTop * wTop + u_colorMid * wMid + u_colorBottom * wBottom;
  }

  // Simple Fresnel-ish highlight based on wave “height” and vertical UV
  float fresnelTerm(vec2 uv, float height) {
    float rim = clamp(1.0 - abs(uv.y - 0.5) * 2.0, 0.0, 1.0);
    float crest = smoothstep(0.0, 1.0, height * 6.0);
    return rim * 0.15 + crest * 0.15;
  }

  // Minimal hash-based grain
  float hash(vec2 p) {
    // keep stable per frame; no time, so it won't shimmer unless animated
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p.x + p.y) * 43758.5453123);
  }

  void main() {
    vec3 base = triGradient(vUv);

    // Add subtle highlight tied to wave crest height for depth cue
    float fr = fresnelTerm(vUv, vHeight);
    vec3 color = base + fr * vec3(1.0);

    // Optional grain for texture (kept very low)
    if (u_grain > 0.0) {
      float g = hash(vUv * vec2(u_aspect, 1.0));
      color += (g - 0.5) * u_grain;
    }

    // Output (already in linear space; your renderer handles tonemapping)
    gl_FragColor = vec4(color, u_opacity);
  }
`;
