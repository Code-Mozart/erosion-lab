precision highp float;
precision highp int;

uniform sampler2D u_baseMap;
uniform vec2 u_resolution;
uniform bool u_erosion_enabled;

// Erosion parameters
uniform float u_erosion_scale;
uniform float u_erosion_strength;
uniform float u_gully_weight;
uniform float u_detail;
uniform int u_octaves;
uniform float u_ridge_rounding;
uniform float u_cell_scale;

in vec2 vUv;
out vec4 fragColor;

#define TAU 6.28318530718

float clamp01(float x) { return clamp(x, 0.0, 1.0); }
float easeOut(float t) { float v = 1.0 - clamp01(t); return 1.0 - v * v; }
float powInv(float t, float p) { return 1.0 - pow(1.0 - clamp01(t), p); }

float smoothStart(float t, float s) {
  float sm = max(s, 1e-5);
  return t >= sm ? t - 0.5 * sm : 0.5 * t * t / sm;
}

// Bit-mixing hash in GLSL using 32-bit unsigned arithmetic
vec2 hash22(uvec2 p) {
  uint k1 = 1597334677u;
  uint k2 = 3812015801u;
  
  uvec2 n = p * uvec2(k1, k2);
  n = (n ^ (n.yx >> 15u)) * uvec2(k1, k2);
  n = (n ^ (n.yx >> 13u)) * uvec2(k1, k2);
  n = n ^ (n >> 16u);
  
  return vec2(n) / 4294967295.0 * 2.0 - 1.0;
}

vec4 phacelleNoise(vec2 p, vec2 normDir, float freq) {
  vec2 sideDir = vec2(-normDir.y, normDir.x) * freq * TAU;
  float offsetRad = 0.25 * TAU;

  vec2 pInt = floor(p);
  vec2 pFrac = fract(p);

  float phaseCos = 0.0;
  float phaseSin = 0.0;
  float weightSum = 0.0;

  for (int i = -1; i <= 2; i++) {
    for (int j = -1; j <= 2; j++) {
      vec2 gridPt = pInt + vec2(float(i), float(j));
      vec2 randVal = hash22(uvec2(gridPt));
      
      vec2 vecCell = pFrac - vec2(float(i), float(j)) - randVal * 0.5;
      float sqrDist = dot(vecCell, vecCell);
      
      float weight = exp(-sqrDist * 2.0);
      weight = max(0.0, weight - 0.01111);
      weightSum += weight;

      float waveInput = dot(vecCell, sideDir) + offsetRad;
      phaseCos += cos(waveInput) * weight;
      phaseSin += sin(waveInput) * weight;
    }
  }

  float weightSumSafe = max(weightSum, 1e-5);
  float interpCos = phaseCos / weightSumSafe;
  float interpSin = phaseSin / weightSumSafe;
  
  float mag = length(vec2(interpCos, interpSin));
  mag = max(0.5, mag);

  return vec4(interpCos / mag, interpSin / mag, sideDir.x, sideDir.y);
}

void main() {
  float baseH = texture(u_baseMap, vUv).r;

  // Passthrough if erosion is disabled
  if (!u_erosion_enabled) {
    fragColor = vec4(vec3(clamp01(baseH)), 1.0);
    return;
  }

  vec2 texel = 1.0 / u_resolution;
  
  // Numerical finite difference slope computation directly on the base heightmap
  float hL = texture(u_baseMap, vUv - vec2(texel.x, 0.0)).r;
  float hR = texture(u_baseMap, vUv + vec2(texel.x, 0.0)).r;
  float hD = texture(u_baseMap, vUv - vec2(0.0, texel.y)).r;
  float hU = texture(u_baseMap, vUv + vec2(0.0, texel.y)).r;

  float dh_dx = (hR - hL) * 0.5 * u_resolution.x;
  float dh_dy = (hU - hD) * 0.5 * u_resolution.y;

  float erodedH = baseH;

  float scale = u_erosion_scale;
  float strength = u_erosion_strength * scale;
  float currFreq = 1.0 / (scale * u_cell_scale);

  float slopeLen = max(length(vec2(dh_dx, dh_dy)), 1e-5);
  vec2 normGrad = vec2(dh_dx, dh_dy) / slopeLen;

  float valStart = smoothStart(slopeLen * 1.25, u_ridge_rounding * 0.1 * 1.25);
  float combiMask = easeOut(valStart);

  float currStrength = strength;
  float roundingMult = 1.0;

  for (int oct = 0; oct < 6; oct++) {
    if (oct >= u_octaves) break;

    vec2 px = vUv * currFreq;
    vec4 ph = phacelleNoise(px, normGrad, u_cell_scale);

    float gulliesX = ph.x;
    float fadedGx = (gulliesX * u_gully_weight) * combiMask;
    erodedH += fadedGx * currStrength;

    float sloping = abs(ph.y);
    float valOctStart = smoothStart(sloping * 1.25, u_ridge_rounding * roundingMult * 1.25);
    float newMask = easeOut(valOctStart);
    combiMask = powInv(combiMask, u_detail) * newMask;

    currStrength *= 0.5;
    currFreq *= 2.0;
    roundingMult *= 2.0;
  }

  fragColor = vec4(vec3(clamp01(erodedH)), 1.0);
}