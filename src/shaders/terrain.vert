uniform sampler2D u_heightmap;
uniform float u_disp_scale;
uniform float u_water_level;

out vec2 vUv;
out float vHeight;
out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
  vUv = uv;
  
  // 1. Sample raw height from GPU erosion heightmap
  float rawH = texture(u_heightmap, uv).r;
  
  // 2. Clamp terrain height at water level
  float effectiveH = max(rawH, u_water_level);
  vHeight = rawH;

  // 3. Displace local vertex along local Z (which points UP once mesh is rotated -90deg on X)
  vec3 pos = position;
  pos.z = effectiveH * u_disp_scale;

  // 4. Transform to World Space
  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;
  
  // 5. Finite-difference normal calculation in local plane space
  vec2 texel = vec2(1.0 / 512.0);
  float hL = max(texture(u_heightmap, uv - vec2(texel.x, 0.0)).r, u_water_level) * u_disp_scale;
  float hR = max(texture(u_heightmap, uv + vec2(texel.x, 0.0)).r, u_water_level) * u_disp_scale;
  float hD = max(texture(u_heightmap, uv - vec2(0.0, texel.y)).r, u_water_level) * u_disp_scale;
  float hU = max(texture(u_heightmap, uv + vec2(0.0, texel.y)).r, u_water_level) * u_disp_scale;

  // Local normal on xy plane with z displacement
  vec3 localNormal = normalize(vec3(hL - hR, hD - hU, 2.0 * texel.x));
  vNormal = normalMatrix * localNormal;

  // 6. Standard Three.js projection pipeline (Model -> View -> Projection)
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}