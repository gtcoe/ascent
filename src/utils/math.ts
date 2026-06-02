export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export function bell(value: number, center: number, width: number): number {
  const d = Math.abs(value - center)
  return clamp(1 - d / width)
}

export function formatAltitude(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters).toLocaleString()} m`
  }

  return `${(meters / 1000).toLocaleString(undefined, {
    maximumFractionDigits: meters < 10000 ? 1 : 0,
  })} km`
}
