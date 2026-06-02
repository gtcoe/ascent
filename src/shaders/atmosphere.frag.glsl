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
  vec3 warmGlow = vec3(1.0, 0.66, 0.30) * horizonGlow * (1.0 - uProgress) * 0.36;
  vec3 highBlueGlow = vec3(0.32, 0.76, 1.0) * horizonGlow * uHaze * 0.28;
  vec3 spaceTint = mix(sky, vec3(0.01, 0.025, 0.06), smoothstep(0.72, 1.0, uProgress) * 0.35);

  gl_FragColor = vec4(spaceTint + warmGlow + highBlueGlow, 1.0);
}
