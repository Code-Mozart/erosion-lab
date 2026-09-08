uniform sampler2D uTexture;
uniform float uMaxHeight;
uniform float uTime;
uniform float uCellSize;
uniform int uOctaves;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uBlendRadius;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec2 vGradient;
varying vec2 vPosition;

#include <hash22>
#include <worleyUtils>

struct TerrainData {
  float height;
  vec2 gradient;
};

struct OctaveData {
  float frequency;
  float cellSize;
  float amplitude;
};

struct WorleyData {
  float accumulatedHeight;
  vec2 accumulatedGradient;
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

WorleyData accumulate(vec2 p, vec2 perp, OctaveData o) {
  vec2 centerCell = floor(p / o.cellSize);
  float blendRadius = o.cellSize * uBlendRadius;

  WorleyData acc = WorleyData(0.0, vec2(0.0), 0.0);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 cell = centerCell + offset;
      vec2 pivot = getWorleyCellPivot(cell, o.cellSize);

      vec2 fromPivot = p - pivot;
      float perpDistance = dot(fromPivot, perp);
      float distanceToPivot = length(fromPivot);
      float weight = smoothWeight(distanceToPivot, blendRadius);

      float angle = perpDistance * o.frequency;
      float height = o.amplitude * cos(angle);
      vec2 gradient = (-o.amplitude * o.frequency * sin(angle)) * perp;

      acc.accumulatedHeight += height * weight;
      acc.accumulatedGradient += gradient * weight;
      acc.totalWeight += weight;
    }
  }

  return acc;
}

TerrainData octave(TerrainData terrain, vec2 p, OctaveData o) {
  float steepness = length(terrain.gradient);
  
  // Avoid division by zero if terrain is completely flat
  if (steepness < 0.0001) return terrain;

  vec2 perp = vec2(-terrain.gradient.y, terrain.gradient.x) / steepness;

  WorleyData acc = accumulate(p, perp, o);
  if (acc.totalWeight < 0.0001) {
    return terrain;
  }

  float deltaHeight = acc.accumulatedHeight / acc.totalWeight;
  vec2 deltaGradient = acc.accumulatedGradient / acc.totalWeight;
  
  return TerrainData(
      terrain.height + deltaHeight,
      terrain.gradient + deltaGradient
  );
}

TerrainData erode(TerrainData terrain, vec2 p) {
  OctaveData o = OctaveData(
    uFrequency,
    uCellSize,
    uAmplitude
  );

  float lacunarity = 2.0;
  float persistence = 0.5;

  int i = 0;
  while (i < uOctaves) {
    terrain = octave(terrain, p, o);

    o.frequency *= lacunarity;
    o.cellSize /= lacunarity;
    o.amplitude *= persistence;
    i += 1;
  }

  return terrain;
}

void main() {
  vUv = uv;

  TerrainData terrain = getTerrainData(uv);

  vec2 uvOffset = uv - vec2(0.5);
  float distUv = max(length(uvOffset), 0.0001); 
  float worldScale = max(length(position.xy) / distUv, 0.0001);

  terrain.height *= uMaxHeight;
  terrain.gradient *= (uMaxHeight / worldScale);

  terrain = erode(terrain, position.xy);

  vPosition = position.xy;

  vec3 displacedPosition = position;
  displacedPosition.z += terrain.height;

  vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);

  vec3 objectNormal = normalize(vec3(-terrain.gradient.x, -terrain.gradient.y, 1.0));
  vNormal = normalize(mat3(modelMatrix) * objectNormal);

  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;

  vElevation = terrain.height / uMaxHeight;
  vGradient = terrain.gradient / worldScale;
}