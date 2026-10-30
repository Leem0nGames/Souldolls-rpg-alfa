export interface LSegment { start: [number, number, number]; end: [number, number, number]; radius: number; }

export interface LSystemConfig {
  axiom: string;
  rules: Record<string, string>;
  iterations: number;
  angle: number; // degrees
  length: number;
  radius: number;
}

export function generateLSystemSegments(config: LSystemConfig): LSegment[] {
  // Expand string
  let current = config.axiom;
  for (let i = 0; i < config.iterations; i++) {
    let next = '';
    for (const ch of current) {
      next += config.rules[ch] ?? ch;
    }
    current = next;
  }

  const segments: LSegment[] = [];
  const stack: { pos: [number, number, number]; dir: [number, number, number]; radius: number }[] = [];
  let pos: [number, number, number] = [0, 0, 0];
  // initial direction up
  let dir: [number, number, number] = [0, 1, 0];
  let radius = config.radius;

  function rotate(v: [number, number, number], axis: 'x' | 'y' | 'z', deg: number): [number, number, number] {
    const a = (deg * Math.PI) / 180;
    const c = Math.cos(a), s = Math.sin(a);
    if (axis === 'x') return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
    if (axis === 'y') return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
  }

  for (const ch of current) {
    if (ch === 'F') {
      const end: [number, number, number] = [pos[0] + dir[0] * config.length, pos[1] + dir[1] * config.length, pos[2] + dir[2] * config.length];
      segments.push({ start: [...pos], end, radius });
      pos = end;
    } else if (ch === '+') {
      dir = rotate(dir, 'y', config.angle);
    } else if (ch === '-') {
      dir = rotate(dir, 'y', -config.angle);
    } else if (ch === '&') {
      dir = rotate(dir, 'x', config.angle);
    } else if (ch === '^') {
      dir = rotate(dir, 'x', -config.angle);
    } else if (ch === '[') {
      stack.push({ pos: [...pos], dir: [...dir], radius });
      radius *= 0.7;
    } else if (ch === ']') {
      const st = stack.pop();
      if (st) { pos = st.pos; dir = st.dir; radius = st.radius; }
    }
  }
  return segments;
}