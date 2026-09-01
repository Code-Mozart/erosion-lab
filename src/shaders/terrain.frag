precision highp float;

uniform float u_water_level;
uniform int u_debug_mode; // 0: Realistic Shading, 1: Heightmap, 2: Cell Grid & Pivots
uniform int u_debug_octave;
uniform float u_erosion_scale;
uniform float u_cell_scale;

in vec2 vUv;
in float vHeight;
in vec3 vNormal;
in vec3 vWorldPosition;

out vec4 fragColor;

// Bit-mixing hash in GLSL
vec2 hash22(uvec2 p) {
  uint k1 = 1597334677u;
  uint k2 = 3812015801u;
  uvec2 n = p * uvec2(k1, k2);
  n = (n ^ (n.yx >> 15u)) * uvec2(k1, k2);
  n = (n ^ (n.yx >> 13u)) * uvec2(k1, k2);
  n = n ^ (n >> 16u);
  return vec2(n) / 4294967295.0 * 2.0 - 1.0;
}

void main() {
  vec3 norm = normalize(vNormal);

  // -------------------------------------------------------------
  // DEBUG MODE 2: Cell Grid & Feature Pivots
  // -------------------------------------------------------------
  if (u_debug_mode == 2) {
    float octaveFreq = (1.0 / (u_erosion_scale * u_cell_scale)) * pow(2.0, float(u_debug_octave));
    vec2 p = vUv * octaveFreq;
    vec2 pInt = floor(p);
    vec2 pFrac = fract(p);

    // Distance to cell boundary
    vec2 gridDist = abs(pFrac - 0.5);
    float edgeLine = smoothstep(0.48, 0.5, max(gridDist.x, gridDist.y));

    // Distance to cell feature point (pivot)
    float minPivotDist = 1.0;
    for (int i = 0; i <= 1; i++) {
      for (int j = 0; j <= 1; j++) {
        vec2 cell = pInt + vec2(float(i), float(j));
        vec2 pivotOffset = hash22(uvec2(cell)) * 0.5;
        vec2 pivotPos = vec2(float(i), float(j)) + 0.5 + pivotOffset;
        minPivotDist = min(minPivotDist, length(p - pivotPos));
      }
    }
    float pivotDot = smoothstep(0.08, 0.03, minPivotDist);

    vec3 col = mix(vec3(0.15, 0.15, 0.2), vec3(1.0, 0.3, 0.2), edgeLine);
    col = mix(col, vec3(0.2, 1.0, 0.4), pivotDot);
    fragColor = vec4(col, 1.0);
    return;
  }

  // -------------------------------------------------------------
  // DEBUG MODE 1: Raw Grayscale Heightmap
  // -------------------------------------------------------------
  if (u_debug_mode == 1) {
    fragColor = vec4(vec3(vHeight), 1.0);
    return;
  }

  // -------------------------------------------------------------
  // MODE 0: Realistic Terrain & Water Shading
  // -------------------------------------------------------------
  // Lighting setup
  vec3 lightDir = normalize(vec3(0.6, 0.8, 0.5));
  float diff = max(dot(norm, lightDir), 0.0);
  float ambient = 0.25;
  float light = diff * 0.75 + ambient;

  // Slope steepness (0 = flat top, 1 = vertical cliff)
  float steepness = 1.0 - clamp(dot(norm, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);

  // Color Palettes
  vec3 deepWater  = vec3(0.05, 0.22, 0.45);
  vec3 shallowWater = vec3(0.12, 0.45, 0.65);
  vec3 sand       = vec3(0.76, 0.70, 0.50);
  vec3 grass      = vec3(0.22, 0.42, 0.15);
  vec3 forest     = vec3(0.12, 0.28, 0.10);
  vec3 rock       = vec3(0.35, 0.33, 0.31);
  vec3 snow       = vec3(0.95, 0.96, 0.98);

  vec3 terrainCol;

  // Water Shader Pass
  if (vHeight < u_water_level) {
    float depth = clamp((u_water_level - vHeight) * 4.0, 0.0, 1.0);
    terrainCol = mix(shallowWater, deepWater, depth);
    // Specular highlight on water
    vec3 viewDir = normalize(-vWorldPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vec3(0.0, 1.0, 0.0), halfDir), 0.0), 64.0);
    terrainCol += vec3(0.8, 0.9, 1.0) * spec * 0.6;
    fragColor = vec4(terrainCol, 0.9);
    return;
  }

  // Land Shading by Height and Slope
  float h = vHeight;
  
  if (h < u_water_level + 0.02) {
    terrainCol = sand;
  } else if (h < 0.45) {
    terrainCol = mix(grass, forest, smoothstep(0.02, 0.45, h));
  } else if (h < 0.75) {
    terrainCol = mix(forest, rock, smoothstep(0.45, 0.75, h));
  } else {
    terrainCol = mix(rock, snow, smoothstep(0.75, 0.90, h));
  }

  // Blend in Rock on steep slopes/cliffs regardless of height
  float rockBlend = smoothstep(0.25, 0.55, steepness);
  terrainCol = mix(terrainCol, rock, rockBlend);

  // Apply Directional Lighting
  terrainCol *= light;

  fragColor = vec4(terrainCol, 1.0);
}