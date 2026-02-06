import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { MeshDistortMaterial, useCursor } from "@react-three/drei";

function DistortImage({ imageUrl }) {
  const ref = useRef();
  const meshRef = useRef();
  const [hovered, hover] = useState(false);
  const [intensity, setIntensity] = useState(0.5);

  const texture = useLoader(THREE.TextureLoader, imageUrl);
  const { size, camera } = useThree();
  const [planeArgs, setPlaneArgs] = useState([1, 1, 100, 100]);

  useEffect(() => {
    if (!camera) return;

    const z = 0;
    const camZ = camera.position.z;
    const distance = camZ - z;

    const vFov = (camera.fov * Math.PI) / 180;
    const viewportHeight = 2 * Math.tan(vFov / 2) * distance;

    const viewportWidth = viewportHeight * camera.aspect;

    const worldPerPixelX = viewportWidth / size.width;
    const worldPerPixelY = viewportHeight / size.height;

    const planeWidth = size.width * worldPerPixelX;
    const planeHeight = size.height * worldPerPixelY;

    setPlaneArgs([planeWidth, planeHeight, 100, 100]);
  }, [size, camera]);

  const { invalidate } = useThree();

  useFrame(() => {
    if (!ref.current) return;
    const targetDistort = hovered ? 0.25 : 0;
    const lerpSpeed = hovered ? 0.05 : 0.01;

    const newDistort = THREE.MathUtils.lerp(
      ref.current.distort,
      targetDistort,
      lerpSpeed
    );

    if (Math.abs(newDistort - ref.current.distort) > 0.001) {
      ref.current.distort = newDistort;
      invalidate();
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
    >
      <planeGeometry args={planeArgs} />

      <MeshDistortMaterial
        ref={ref}
        map={texture}
        intensity={intensity}
        speed={4}
      />
    </mesh>
  );
}

export default function AboutImageEffect({ imageUrl }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        frameloop="demand"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <ambientLight intensity={1} />
        <DistortImage imageUrl={imageUrl} />
      </Canvas>
    </div>
  );
}
