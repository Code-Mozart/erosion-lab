varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;

// Automatically injected by Three.js when material.lights = true
#include <common>
#include <lights_pars_begin>

void main() {
    // Re-normalize interpolated normal vector
    vec3 N = normalize(vNormal);

    // Base elevation tinting from your original shader
    vec3 baseColor = vec3(vElevation);

    // Access scene directional light #0 automatically
    vec3 lightDir = normalize(-directionalLights[0].direction);
    vec3 lightColor = directionalLights[0].color;

    // Smooth diffuse calculation (Lambertian)
    float diffuse = max(dot(N, lightDir), 0.0);

    vec3 finalColor = baseColor * (diffuse * lightColor) + ambientLightColor;

    gl_FragColor = vec4(finalColor, 1.0);
}