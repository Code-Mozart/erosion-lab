varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;

// Enum Mode Constants
#define MODE_SHADED 0
#define MODE_ELEVATION 1
#define MODE_NORMALS 2

uniform int uDebugMode;

// Automatically injected by Three.js when material.lights = true
#include <common>
#include <lights_pars_begin>

void main() {
    // Re-normalize interpolated normal vector
    vec3 N = normalize(vNormal);

    vec3 finalColor;

    switch (uDebugMode) {
        case MODE_ELEVATION:
            // Mode 1: Grayscale Elevation Map
            finalColor = vec3(vElevation);
            break;

        case MODE_NORMALS:
            // Mode 2: World Normals (Mapped from [-1, 1] to [0, 1] for RGB visualization)
            finalColor = vec3(0.0);
            break;

        case MODE_SHADED:
        default: {
            // Mode 0: Standard Diffuse Lighting
            vec3 baseColor = vec3(vElevation);

            // Access scene directional light #0
            vec3 lightDir = normalize(-directionalLights[0].direction);
            vec3 lightColor = directionalLights[0].color;

            // Smooth diffuse calculation (Lambertian)
            float diffuse = max(dot(N, lightDir), 0.0);

            finalColor = baseColor * (diffuse * lightColor) + ambientLightColor;
            break;
        }
    }

    gl_FragColor = vec4(finalColor, 1.0);
}