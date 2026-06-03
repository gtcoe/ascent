uniform vec3 uBottomColor;
uniform vec3 uTopColor;
uniform float uProgress;
uniform float uHaze;

varying vec3 vWorldDirection;
varying vec2 vUv;

void main() {
  float vertical = smoothstep(-0.18, 0.92, vWorldDirection.y);
  vec3 sky = mix(uBottomColor, uTopColor, vertical);

  float horizonGlow = pow(1.0 - abs(vWorldDirection.y), 3.0);
  float spaceReveal = smoothstep(0.62, 0.92, uProgress);
  float orbitReveal = smoothstep(0.86, 1.0, uProgress);
  vec3 warmGlow = vec3(1.0, 0.66, 0.30) * horizonGlow * (1.0 - uProgress) * 0.36;
  vec3 highBlueGlow = vec3(0.28, 0.72, 1.0) * horizonGlow * uHaze * (0.24 + spaceReveal * 0.62);
  vec3 limbGlow = vec3(0.34, 0.92, 1.0) * pow(horizonGlow, 0.62) * orbitReveal * 0.32;
  vec3 deepSpace = vec3(0.0, 0.004, 0.018);
  vec3 spaceTint = mix(sky, deepSpace, spaceReveal * (0.48 + orbitReveal * 0.32));

  gl_FragColor = vec4(spaceTint + warmGlow + highBlueGlow + limbGlow, 1.0);
}
