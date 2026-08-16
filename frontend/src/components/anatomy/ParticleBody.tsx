import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildBodyBuffers, ORGAN_INDEX } from "./bodyGeometry";
import { ORGAN_MAP, type OrganId } from "@/lib/organs";

const vertexShader = /* glsl */ `
  attribute float aRandom;
  attribute float aOrgan;
  attribute float aSize;
  uniform float uTime;
  uniform float uActive;
  uniform float uPixelRatio;
  uniform float uMotion;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    float t = uTime * 0.35 + aRandom * 6.2831;
    float drift = 0.012 * uMotion;
    pos.x += sin(t * 0.9) * drift;
    pos.y += cos(t * 0.7) * drift;
    pos.z += sin(t * 1.1 + aRandom) * drift;

    bool isOrgan = aOrgan > 0.5;
    float focusAmt = (isOrgan && abs(aOrgan - uActive) < 0.5) ? 1.0 : 0.0;

    // focused organs breathe outward from their own centroid direction
    float pulse = sin(uTime * 1.6) * 0.5 + 0.5;
    pos += normalize(pos + vec3(0.0001)) * focusAmt * (0.012 + pulse * 0.012) * uMotion;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float sizeBoost = 1.0 + focusAmt * (0.5 + pulse * 0.25);
    gl_PointSize = aSize * uScale * sizeBoost * uPixelRatio * (9.0 / -mvPosition.z);

    float dim = isOrgan ? (focusAmt > 0.5 ? 0.07 : 0.045) : (uActive > 0.5 ? 0.5 : 0.62);
    vColor = color * (isOrgan && focusAmt > 0.5 ? 1.0 + pulse * 0.15 : 0.9);
    vAlpha = dim;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float falloff = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, vAlpha * falloff * 0.6);
  }
`;

function Points({ activeOrgan, reducedMotion }: { activeOrgan: OrganId; reducedMotion: boolean }) {
  const { size } = useThree();
  const buffers = useMemo(() => buildBodyBuffers(size.width > 1500 ? 95000 : 70000), [size.width]);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const groupRef = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActive: { value: ORGAN_INDEX[activeOrgan] },
      uPixelRatio: { value: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2) },
      uMotion: { value: reducedMotion ? 0 : 1 },
      uScale: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uMotion.value = reducedMotion ? 0 : 1;
  }, [reducedMotion, uniforms]);

  const targetActive = ORGAN_INDEX[activeOrgan];
  const focus = ORGAN_MAP[activeOrgan].focus;

  useEffect(() => {
    const geo = geometryRef.current;
    return () => {
      geo?.dispose();
    };
  }, []);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    if (materialRef.current) {
      uniforms.uTime.value += reducedMotion ? d * 0.15 : d;
      uniforms.uActive.value += (targetActive - uniforms.uActive.value) * Math.min(1, d * 6);
    }
    if (groupRef.current) {
      // smooth interpolation toward the focused organ — never teleports
      const targetY = -focus[1] * 0.55;
      const targetRotation = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.12) * 0.22;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * Math.min(1, d * 2.2);
      groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * Math.min(1, d * 1.2);
      const targetScale = 1 + Math.min(0.22, Math.abs(focus[1]) * 0.08);
      const s = groupRef.current.scale.x + (targetScale - groupRef.current.scale.x) * Math.min(1, d * 2);
      groupRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.colors, 3]} />
          <bufferAttribute attach="attributes-aRandom" args={[buffers.randoms, 1]} />
          <bufferAttribute attach="attributes-aOrgan" args={[buffers.organs, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[buffers.sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          vertexColors
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function ParticleBody({
  activeOrgan,
  reducedMotion = false,
}: {
  activeOrgan: OrganId;
  reducedMotion?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.0], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
      style={{ background: "transparent" }}
    >
      <Points activeOrgan={activeOrgan} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
