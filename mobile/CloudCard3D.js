import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { StyleSheet, View } from "react-native";

const PUFFS = [
  { position: [-0.95, -0.12, 0], scale: [0.46, 0.3, 0.36] },
  { position: [-0.68, 0.18, 0.02], scale: [0.46, 0.42, 0.39] },
  { position: [-0.28, 0.34, 0], scale: [0.49, 0.51, 0.41] },
  { position: [0.18, 0.37, 0.02], scale: [0.53, 0.54, 0.43] },
  { position: [0.62, 0.17, 0], scale: [0.46, 0.43, 0.39] },
  { position: [0.94, -0.12, 0], scale: [0.4, 0.29, 0.35] },
  { position: [0, -0.2, -0.02], scale: [1.32, 0.37, 0.43] },
];

function CloudMesh({ reducedMotion, onPress }) {
  const cloudRef = useRef(null);
  const hovered = useRef(false);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 24, 18), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xf6f9fb,
        roughness: 0.94,
        metalness: 0,
      }),
    [],
  );
  const matrices = useMemo(() => {
    const object = new THREE.Object3D();
    return PUFFS.map((puff) => {
      object.position.set(...puff.position);
      object.scale.set(...puff.scale);
      object.updateMatrix();
      return object.matrix.clone();
    });
  }, []);

  useEffect(() => {
    if (!cloudRef.current) return;
    matrices.forEach((matrix, index) => {
      cloudRef.current.setMatrixAt(index, matrix);
    });
    cloudRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  useFrame((_, delta) => {
    const cloud = cloudRef.current;
    if (!cloud) return;
    const targetScale = hovered.current ? 1.045 : 1;
    const targetY = hovered.current ? 0.045 : 0;
    if (reducedMotion) {
      cloud.scale.setScalar(targetScale);
      cloud.position.y = targetY;
      return;
    }
    const nextScale = THREE.MathUtils.damp(
      cloud.scale.x,
      targetScale,
      12,
      delta,
    );
    cloud.scale.setScalar(nextScale);
    cloud.position.y = THREE.MathUtils.damp(
      cloud.position.y,
      targetY,
      12,
      delta,
    );
  });

  return (
    <Float
      floatIntensity={reducedMotion ? 0 : 0.04}
      rotationIntensity={0}
      speed={0.7}
    >
      <instancedMesh
        ref={cloudRef}
        args={[geometry, material, PUFFS.length]}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onPress();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          hovered.current = true;
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          hovered.current = false;
        }}
      />
    </Float>
  );
}

export default function CloudCard3D({
  title,
  description,
  type,
  onPress,
  reducedMotion,
  accessibilityLabel,
  accessibilityHint,
}) {
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${type}: ${title}`}
      accessibilityHint={accessibilityHint}
      onAccessibilityTap={onPress}
      style={styles.cloudCard}
    >
      <Canvas
        shadows
        dpr={[1, 1.3]}
        orthographic
        camera={{ position: [0, 0, 5], zoom: 104 }}
        gl={{ alpha: true, antialias: true }}
        style={styles.canvas}
      >
        <ambientLight intensity={1.6} />
        <directionalLight
          castShadow
          color="#FFFFFF"
          intensity={1.5}
          position={[-2.5, 3.5, 4]}
          shadow-mapSize-width={256}
          shadow-mapSize-height={256}
        />
        <CloudMesh reducedMotion={reducedMotion} onPress={onPress} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  cloudCard: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
});
