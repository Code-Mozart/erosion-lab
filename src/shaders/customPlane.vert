uniform sampler2D uTexture;
uniform float uMaxHeight;
uniform float uTime;
uniform float uCellSize;
uniform int uOctaves;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uBlendRadius;
uniform float uValleyAltitude;
uniform float uPeakAltitude;
uniform float uDetail;
uniform float uWaterLevel;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec2 vGradient;
varying vec2 vPosition;
varying float vIsWater;

#include <easeOut>
#include <hash22>
#include <inverseLerp>
#include <worleyUtils>

#define LACUNARITY 2.0
#define PERSISTENCE 0.5

struct TerrainData {
  float height;
  vec2 gradient;
};

struct OctaveData {
  float frequency;
  float cellSize;
  float amplitude;
};

struct MaskData {
  float value;
  float target;
};

struct OctaveResult {
  TerrainData terrain;
  MaskData mask;
};

struct WorleyData {
  vec2 accumulatedWaveVector;
  float totalWeight;
};

TerrainData getTerrainData(vec2 uv) {
  vec2 texelSize = vec2(1.0 / 128.0);

  float hL = texture2D(uTexture, uv - vec2(texelSize.x, 0.0)).r;
  float hR = texture2D(uTexture, uv + vec2(texelSize.x, 0.0)).r;
  float hD = texture2D(uTexture, uv - vec2(0.0, texelSize.y)).r;
  float hU = texture2D(uTexture, uv + vec2(0.0, texelSize.y)).r;

  float height = texture2D(uTexture, uv).r;
  vec2 gradient = vec2(hR - hL, hU - hD) / (2.0 * texelSize.x);

  return TerrainData(height, gradient);
}

float smoothWeight(float dist, float maxDist) {
  float t = clamp(1.0 - (dist / maxDist), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t); // Smoothstep curve
}

WorleyData accumulate(vec2 p, vec2 perp, float maskValue, float maskTarget,
                      OctaveData o) {
  vec2 centerCell = floor(p / o.cellSize);
  float blendRadius = o.cellSize * uBlendRadius;

  WorleyData acc = WorleyData(vec2(0.0), 0.0);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 cell = centerCell + offset;
      vec2 pivot = getWorleyCellPivot(cell, o.cellSize);

      // pivot = vec2(0.0);

      vec2 fromPivot = p - pivot;
      float perpDistance = dot(fromPivot, perp);
      float distanceToPivot = length(fromPivot);
      float weight = smoothWeight(distanceToPivot, blendRadius);

      float angle = perpDistance * o.frequency;

      acc.accumulatedWaveVector.x += cos(angle) * weight;
      acc.accumulatedWaveVector.y += sin(angle) * weight;
      acc.totalWeight += weight;
    }
  }

  return acc;
}

OctaveResult octave(OctaveResult previous, vec2 p, OctaveData o) {
  TerrainData terrain = previous.terrain;
  MaskData mask = previous.mask;

  float steepness = length(terrain.gradient);

  vec2 perp = (steepness < 0.0001)
                  ? vec2(1.0, 0.0)
                  : vec2(-terrain.gradient.y, terrain.gradient.x) / steepness;

  float easedSteepness = easeOut(steepness, 2.0);
  float nextMaskValue = easeOut(mask.value, uDetail) * easedSteepness;

  WorleyData acc = accumulate(p, perp, nextMaskValue, mask.target, o);
  vec2 waveVector = acc.totalWeight > 0.0001
                        ? acc.accumulatedWaveVector / acc.totalWeight
                        : vec2(0.0, 0.0);
  float waveVectorLength = length(waveVector);

  if (waveVectorLength > 0.0001) {
    float threshold = 0.5;
    float newLength = min(1.0, (1.0 / threshold) * waveVectorLength);
    waveVector = (waveVector / waveVectorLength) * newLength;
  }

  float deltaHeight =
      mix(mask.target, waveVector.x, nextMaskValue) * o.amplitude;
  vec2 deltaGradient =
      (-o.amplitude * o.frequency * waveVector.y) * perp * nextMaskValue;

  terrain.height += deltaHeight;
  terrain.gradient += deltaGradient;

  float nextMaskTarget =
      inverseLerp(uValleyAltitude, uPeakAltitude, terrain.height) * 2.0 - 1.0;
  MaskData nextMask = MaskData(nextMaskValue, nextMaskTarget);
  return OctaveResult(terrain, nextMask);
}

MaskData getInitialMask(TerrainData terrain) {
  float value = easeOut(length(terrain.gradient), 2.0);
  float target =
      inverseLerp(uValleyAltitude, uPeakAltitude, terrain.height) * 2.0 - 1.0;

  return MaskData(value, target);
}

TerrainData erode(TerrainData terrain, vec2 p) {
  OctaveData o = OctaveData(uFrequency, uCellSize, uAmplitude);

  MaskData mask = getInitialMask(terrain);
  OctaveResult state = OctaveResult(terrain, mask);

  int i = 0;
  while (i < uOctaves) {
    state = octave(state, p, o);

    o.frequency *= LACUNARITY;
    o.cellSize /= LACUNARITY;
    o.amplitude *= PERSISTENCE;
    i += 1;
  }

  return state.terrain;
}

float calculateMaxErosionAdd() {
  float maxAdd = 0.0;
  float amplitude = uAmplitude;

  for (int i = 0; i < uOctaves; i++) {
    maxAdd += amplitude;
    amplitude *= PERSISTENCE;
  }

  return maxAdd;
}

void main() {
  vUv = uv;

  TerrainData terrain = getTerrainData(uv);

  vec2 uvOffset = uv - vec2(0.5);
  float distUv = max(length(uvOffset), 0.0001);
  float worldScale = max(length(position.xy) / distUv, 0.0001);

  float heightScale = uMaxHeight - calculateMaxErosionAdd();

  terrain.height *= heightScale;
  terrain.gradient *= (heightScale / worldScale);

  terrain = erode(terrain, position.xy);

  vPosition = position.xy;

  vec3 displacedPosition = position;
  displacedPosition.z += terrain.height;

  vIsWater = displacedPosition.z <= uWaterLevel ? 1.0 : 0.0;
  displacedPosition.z = max(displacedPosition.z, uWaterLevel);

  vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);

  vec3 objectNormal_ =
      normalize(vec3(-terrain.gradient.x, -terrain.gradient.y, 1.0));
  vNormal = normalize(mat3(modelMatrix) * objectNormal_);

  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;

  vElevation = terrain.height / uMaxHeight;
  vGradient = terrain.gradient / worldScale;
}