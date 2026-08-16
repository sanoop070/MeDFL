import * as THREE from "three";
import type { OrganId } from "@/lib/organs";
import { ORGANS } from "@/lib/organs";

/**
 * Procedural particle anatomy.
 *
 * Points are sampled from a set of analytic primitives (ellipsoids + capsules)
 * that approximate a front-facing human figure, plus dedicated organ clouds.
 * The attribute layout (position / color / aRandom / aOrgan) is intentionally
 * generic so a real GLTF/GLB anatomical mesh can be surface-sampled into the
 * exact same buffers later without touching the renderer.
 */

export const ORGAN_INDEX: Record<OrganId, number> = ORGANS.reduce(
  (acc, organ, index) => {
    acc[organ.id] = index + 1; // 0 = body shell
    return acc;
  },
  {} as Record<OrganId, number>,
);

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Vec3 = [number, number, number];

type Ellipsoid = { kind: "ellipsoid"; c: Vec3; r: Vec3; shell?: number };
type Capsule = { kind: "capsule"; a: Vec3; b: Vec3; r: number; r2?: number; shell?: number };
type Shape = Ellipsoid | Capsule;

function sampleEllipsoid(s: Ellipsoid, rng: Rng): Vec3 {
  // random direction
  let x = rng() * 2 - 1;
  let y = rng() * 2 - 1;
  let z = rng() * 2 - 1;
  const len = Math.hypot(x, y, z) || 1;
  x /= len;
  y /= len;
  z /= len;
  const shell = s.shell ?? 0.85;
  const t = shell + (1 - shell) * Math.cbrt(rng());
  return [s.c[0] + x * s.r[0] * t, s.c[1] + y * s.r[1] * t, s.c[2] + z * s.r[2] * t];
}

function sampleCapsule(s: Capsule, rng: Rng): Vec3 {
  const t = rng();
  const cx = s.a[0] + (s.b[0] - s.a[0]) * t;
  const cy = s.a[1] + (s.b[1] - s.a[1]) * t;
  const cz = s.a[2] + (s.b[2] - s.a[2]) * t;
  const radius = (s.r2 != null ? s.r + (s.r2 - s.r) * t : s.r) * (s.shell ?? 0.86 + rng() * 0.14);
  const angle = rng() * Math.PI * 2;
  // slight ellipse: bodies are deeper than wide is false — narrower in z
  return [cx + Math.cos(angle) * radius, cy, cz + Math.sin(angle) * radius * 0.62];
}

function sampleShape(shape: Shape, rng: Rng): Vec3 {
  return shape.kind === "ellipsoid" ? sampleEllipsoid(shape, rng) : sampleCapsule(shape, rng);
}

/** Body shell primitives, weighted by relative particle density. */
const BODY: Array<{ shape: Shape; weight: number }> = [
  // head + neck
  { shape: { kind: "ellipsoid", c: [0, 1.45, 0], r: [0.19, 0.24, 0.2], shell: 0.9 }, weight: 7 },
  { shape: { kind: "ellipsoid", c: [0, 1.24, 0.02], r: [0.11, 0.07, 0.11], shell: 0.85 }, weight: 2 },
  { shape: { kind: "capsule", a: [0, 1.1, 0], b: [0, 1.24, 0], r: 0.075, shell: 0.9 }, weight: 2 },
  // shoulders
  { shape: { kind: "capsule", a: [-0.36, 1.0, 0], b: [0.36, 1.0, 0], r: 0.1, shell: 0.9 }, weight: 5 },
  // torso (chest -> waist)
  { shape: { kind: "capsule", a: [0, 1.0, 0], b: [0, 0.44, 0], r: 0.3, r2: 0.24, shell: 0.88 }, weight: 16 },
  // abdomen + pelvis
  { shape: { kind: "capsule", a: [0, 0.44, 0], b: [0, 0.02, 0], r: 0.24, r2: 0.27, shell: 0.88 }, weight: 11 },
  { shape: { kind: "capsule", a: [0, 0.02, 0], b: [0, -0.2, 0], r: 0.27, r2: 0.21, shell: 0.9 }, weight: 5 },
  // arms
  { shape: { kind: "capsule", a: [-0.4, 0.98, 0], b: [-0.52, 0.44, 0], r: 0.085, r2: 0.065, shell: 0.9 }, weight: 5 },
  { shape: { kind: "capsule", a: [0.4, 0.98, 0], b: [0.52, 0.44, 0], r: 0.085, r2: 0.065, shell: 0.9 }, weight: 5 },
  { shape: { kind: "capsule", a: [-0.52, 0.44, 0], b: [-0.6, -0.06, 0], r: 0.062, r2: 0.045, shell: 0.9 }, weight: 4 },
  { shape: { kind: "capsule", a: [0.52, 0.44, 0], b: [0.6, -0.06, 0], r: 0.062, r2: 0.045, shell: 0.9 }, weight: 4 },
  { shape: { kind: "ellipsoid", c: [-0.63, -0.16, 0], r: [0.06, 0.1, 0.03], shell: 0.8 }, weight: 2 },
  { shape: { kind: "ellipsoid", c: [0.63, -0.16, 0], r: [0.06, 0.1, 0.03], shell: 0.8 }, weight: 2 },
  // legs
  { shape: { kind: "capsule", a: [-0.14, -0.16, 0], b: [-0.17, -0.86, 0], r: 0.135, r2: 0.09, shell: 0.9 }, weight: 9 },
  { shape: { kind: "capsule", a: [0.14, -0.16, 0], b: [0.17, -0.86, 0], r: 0.135, r2: 0.09, shell: 0.9 }, weight: 9 },
  { shape: { kind: "capsule", a: [-0.17, -0.86, 0], b: [-0.19, -1.52, 0], r: 0.085, r2: 0.05, shell: 0.9 }, weight: 7 },
  { shape: { kind: "capsule", a: [0.17, -0.86, 0], b: [0.19, -1.52, 0], r: 0.085, r2: 0.05, shell: 0.9 }, weight: 7 },
  { shape: { kind: "ellipsoid", c: [-0.19, -1.58, 0.06], r: [0.06, 0.045, 0.12], shell: 0.7 }, weight: 2 },
  { shape: { kind: "ellipsoid", c: [0.19, -1.58, 0.06], r: [0.06, 0.045, 0.12], shell: 0.7 }, weight: 2 },
];

/** Skeleton / vascular structures — denser interior lines. */
const STRUCTURE: Array<{ shape: Shape; weight: number }> = [
  { shape: { kind: "capsule", a: [0, 1.16, -0.04], b: [0, -0.06, -0.05], r: 0.022, shell: 0.4 }, weight: 5 }, // spine
  { shape: { kind: "capsule", a: [0, 0.98, 0.06], b: [0, 0.52, 0.08], r: 0.02, shell: 0.4 }, weight: 2 }, // sternum
  { shape: { kind: "capsule", a: [0, 1.0, 0], b: [0, 0.2, 0], r: 0.03, shell: 0.3 }, weight: 3 }, // aorta
  { shape: { kind: "capsule", a: [-0.36, 1.0, 0], b: [0.36, 1.0, 0], r: 0.03, shell: 0.4 }, weight: 2 }, // clavicle
  { shape: { kind: "capsule", a: [-0.24, 0.02, 0], b: [0.24, 0.02, 0], r: 0.05, shell: 0.5 }, weight: 2 }, // pelvic girdle
];

const ORGAN_SHAPES: Array<{ organ: OrganId; shape: Shape; weight: number }> = [
  { organ: "brain", shape: { kind: "ellipsoid", c: [0, 1.5, 0.0], r: [0.145, 0.13, 0.155], shell: 0.72 }, weight: 4 },
  { organ: "lungs", shape: { kind: "ellipsoid", c: [-0.145, 0.76, 0.0], r: [0.1, 0.19, 0.09], shell: 0.3 }, weight: 5 },
  { organ: "lungs", shape: { kind: "ellipsoid", c: [0.145, 0.76, 0.0], r: [0.1, 0.19, 0.09], shell: 0.3 }, weight: 5 },
  { organ: "heart", shape: { kind: "ellipsoid", c: [-0.045, 0.68, 0.035], r: [0.075, 0.085, 0.065], shell: 0.25 }, weight: 4 },
  { organ: "liver", shape: { kind: "ellipsoid", c: [0.11, 0.42, 0.02], r: [0.13, 0.075, 0.085], shell: 0.25 }, weight: 4 },
  { organ: "stomach", shape: { kind: "ellipsoid", c: [-0.1, 0.38, 0.01], r: [0.085, 0.07, 0.06], shell: 0.3 }, weight: 3 },
  { organ: "gallbladder", shape: { kind: "ellipsoid", c: [0.11, 0.33, 0.06], r: [0.032, 0.04, 0.03], shell: 0.2 }, weight: 1.2 },
  { organ: "pancreas", shape: { kind: "capsule", a: [-0.11, 0.31, -0.03], b: [0.09, 0.335, -0.03], r: 0.028, shell: 0.3 }, weight: 1.8 },
  { organ: "kidneys", shape: { kind: "ellipsoid", c: [-0.13, 0.25, -0.06], r: [0.04, 0.062, 0.035], shell: 0.25 }, weight: 2 },
  { organ: "kidneys", shape: { kind: "ellipsoid", c: [0.13, 0.25, -0.06], r: [0.04, 0.062, 0.035], shell: 0.25 }, weight: 2 },
  { organ: "intestines", shape: { kind: "ellipsoid", c: [0, 0.13, 0.03], r: [0.16, 0.115, 0.085], shell: 0.2 }, weight: 6 },
  { organ: "bladder", shape: { kind: "ellipsoid", c: [0, -0.08, 0.05], r: [0.055, 0.05, 0.045], shell: 0.25 }, weight: 1.5 },
];

const PALETTE = {
  shell: new THREE.Color("#7fb2ff"),
  shellAlt: new THREE.Color("#b9d9ff"),
  structure: new THREE.Color("#e8f4ff"),
  brain: new THREE.Color("#b07bff"),
  lungs: new THREE.Color("#4fe3ff"),
  heart: new THREE.Color("#ff5fa8"),
  liver: new THREE.Color("#5b8bff"),
  stomach: new THREE.Color("#43d8ff"),
  gallbladder: new THREE.Color("#6bf5b8"),
  kidneys: new THREE.Color("#6da2ff"),
  pancreas: new THREE.Color("#a97bff"),
  intestines: new THREE.Color("#3fd0ff"),
  bladder: new THREE.Color("#ff6ec7"),
} satisfies Record<string, THREE.Color>;

export type BodyBuffers = {
  positions: Float32Array;
  colors: Float32Array;
  randoms: Float32Array;
  organs: Float32Array;
  sizes: Float32Array;
  count: number;
};

export function buildBodyBuffers(targetCount = 90000): BodyBuffers {
  const rng = mulberry32(20260814);

  const groups: Array<{ shape: Shape; weight: number; organ: OrganId | null }> = [
    ...BODY.map((b) => ({ ...b, organ: null })),
    ...STRUCTURE.map((b) => ({ ...b, organ: null })),
    ...ORGAN_SHAPES.map((b) => ({ shape: b.shape, weight: b.weight * 1.6, organ: b.organ })),
  ];

  const totalWeight = groups.reduce((sum, g) => sum + g.weight, 0);

  const positions = new Float32Array(targetCount * 3);
  const colors = new Float32Array(targetCount * 3);
  const randoms = new Float32Array(targetCount);
  const organs = new Float32Array(targetCount);
  const sizes = new Float32Array(targetCount);

  let i = 0;
  const tmp = new THREE.Color();

  for (const group of groups) {
    const n = Math.max(1, Math.round((group.weight / totalWeight) * targetCount));
    for (let k = 0; k < n && i < targetCount; k++, i++) {
      const [x, y, z] = sampleShape(group.shape, rng);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      if (group.organ) {
        tmp.copy(PALETTE[group.organ as keyof typeof PALETTE]);
        sizes[i] = 1.5 + rng() * 1.1;
      } else {
        const isStructure = STRUCTURE.some((s) => s.shape === group.shape);
        tmp.copy(isStructure ? PALETTE.structure : rng() > 0.82 ? PALETTE.shellAlt : PALETTE.shell);
        tmp.multiplyScalar(0.55 + rng() * 0.5);
        sizes[i] = 0.7 + rng() * 0.8;
      }

      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
      randoms[i] = rng();
      organs[i] = group.organ ? ORGAN_INDEX[group.organ] : 0;
    }
  }

  return {
    positions: positions.subarray(0, i * 3) as Float32Array,
    colors: colors.subarray(0, i * 3) as Float32Array,
    randoms: randoms.subarray(0, i) as Float32Array,
    organs: organs.subarray(0, i) as Float32Array,
    sizes: sizes.subarray(0, i) as Float32Array,
    count: i,
  };
}
