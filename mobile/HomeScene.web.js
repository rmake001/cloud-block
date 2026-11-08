import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";

const FLOOR_COUNT = 18;
const UNITS_PER_FLOOR = 5;

function makeTower() {
  const tower = new THREE.Group();
  const bodyHeight = 16.2;
  const bodyWidth = 6.2;
  const bodyDepth = 4;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth),
    new THREE.MeshStandardMaterial({
      color: 0x101924,
      metalness: 0.62,
      roughness: 0.34,
    }),
  );
  tower.add(body);

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x35424d,
    metalness: 0.75,
    roughness: 0.3,
  });
  const floorTrim = new THREE.BoxGeometry(bodyWidth + 0.16, 0.045, bodyDepth + 0.16);
  for (let floor = 0; floor <= FLOOR_COUNT; floor += 1) {
    const trim = new THREE.Mesh(floorTrim, trimMaterial);
    trim.position.y = -bodyHeight / 2 + (bodyHeight / FLOOR_COUNT) * floor;
    tower.add(trim);
  }

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth * 0.68, 0.9, bodyDepth * 0.74),
    trimMaterial,
  );
  roof.position.set(0, bodyHeight / 2 + 0.42, 0);
  tower.add(roof);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.07, 1.5, 8),
    trimMaterial,
  );
  antenna.position.y = bodyHeight / 2 + 1.6;
  tower.add(antenna);

  const windowGeometry = new THREE.BoxGeometry(0.72, 0.44, 0.045);
  const windowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false,
  });
  const windows = new THREE.InstancedMesh(
    windowGeometry,
    windowMaterial,
    FLOOR_COUNT * UNITS_PER_FLOOR * 2,
  );
  const transform = new THREE.Object3D();
  const warm = new THREE.Color(0xffd89d);
  const dim = new THREE.Color(0x46525e);
  const windowColors = [];
  let index = 0;

  for (let floor = 0; floor < FLOOR_COUNT; floor += 1) {
    const y = -bodyHeight / 2 + (floor + 0.5) * (bodyHeight / FLOOR_COUNT);
    for (let unit = 0; unit < UNITS_PER_FLOOR; unit += 1) {
      const frontX = (unit - (UNITS_PER_FLOOR - 1) / 2) * 1.12;
      transform.position.set(frontX, y, bodyDepth / 2 + 0.035);
      transform.rotation.set(0, 0, 0);
      transform.updateMatrix();
      windows.setMatrixAt(index, transform.matrix);
      const frontColor = (floor * 3 + unit) % 4 === 0 ? dim : warm;
      windowColors.push(frontColor.clone());
      windows.setColorAt(index, frontColor);
      index += 1;

      const sideZ = (unit - (UNITS_PER_FLOOR - 1) / 2) * 0.72;
      transform.position.set(bodyWidth / 2 + 0.035, y, sideZ);
      transform.rotation.set(0, Math.PI / 2, 0);
      transform.updateMatrix();
      windows.setMatrixAt(index, transform.matrix);
      const sideColor = (floor * 5 + unit) % 4 === 0 ? dim : warm;
      windowColors.push(sideColor.clone());
      windows.setColorAt(index, sideColor);
      index += 1;
    }
  }

  windows.instanceMatrix.needsUpdate = true;
  if (windows.instanceColor) windows.instanceColor.needsUpdate = true;
  tower.add(windows);
  tower.userData.windowMesh = windows;
  tower.userData.windowColors = windowColors;

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(5.2, 0.025, 8, 72),
    new THREE.MeshBasicMaterial({
      color: 0xe8b56a,
      transparent: true,
      opacity: 0.56,
    }),
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = -bodyHeight / 2 - 0.85;
  tower.add(baseRing);

  return tower;
}

function makeStars() {
  const positions = [];
  for (let index = 0; index < 110; index += 1) {
    const x = Math.sin(index * 127.1) * 12;
    const y = Math.cos(index * 311.7) * 13;
    const z = -5 - ((index * 17) % 18);
    positions.push(x, y, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xffdfb1,
      size: 0.045,
      transparent: true,
      opacity: 0.56,
      sizeAttenuation: true,
    }),
  );
}

export default function HomeScene({ active = true }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch (error) {
      console.warn("The Three.js home scene could not start.", error);
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xb9c9d5, 0x171219, 1.8));

    const keyLight = new THREE.DirectionalLight(0xffd49a, 3.2);
    keyLight.position.set(-7, 10, 12);
    scene.add(keyLight);

    const edgeLight = new THREE.PointLight(0x7aa4c4, 18, 30);
    edgeLight.position.set(7, -1, 5);
    scene.add(edgeLight);

    const tower = makeTower();
    scene.add(tower, makeStars());

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    let scrollY = 3.2;
    camera.position.set(0, 0, 22);
    camera.lookAt(0, scrollY, 0);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);
    mount.style.touchAction = "none";
    mount.style.cursor = "grab";

    function resize() {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      const portrait = camera.aspect < 0.75;
      camera.fov = portrait ? 36 : 32;
      camera.position.set(0, 0, portrait ? 22 : 19);
      camera.lookAt(0, scrollY, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    let dragging = false;
    let previousPointerY = 0;
    function handleWheel(event) {
      event.preventDefault();
      scrollY = THREE.MathUtils.clamp(scrollY - event.deltaY * 0.004, -4.3, 5.2);
    }
    function handlePointerDown(event) {
      dragging = true;
      previousPointerY = event.clientY;
      mount.style.cursor = "grabbing";
    }
    function handlePointerMove(event) {
      if (!dragging) return;
      scrollY = THREE.MathUtils.clamp(
        scrollY + (event.clientY - previousPointerY) * 0.025,
        -4.3,
        5.2,
      );
      previousPointerY = event.clientY;
    }
    function handlePointerUp() {
      dragging = false;
      mount.style.cursor = "grab";
    }

    resize();
    window.addEventListener("resize", resize);
    mount.addEventListener("wheel", handleWheel, { passive: false });
    mount.addEventListener("pointerdown", handlePointerDown);
    mount.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    let frameId;
    const startTime = performance.now();
    const windows = tower.userData.windowMesh;
    const windowColors = tower.userData.windowColors;
    const flickerColors = windowColors.map((color) => color.clone());
    let lastFlickerUpdate = 0;
    function render(now) {
      camera.lookAt(0, scrollY, 0);
      if (now - lastFlickerUpdate > 90) {
        const time = (now - startTime) * 0.001;
        for (let index = 0; index < windowColors.length; index += 1) {
          const color = flickerColors[index].copy(windowColors[index]);
          if (windowColors[index].r > 0.5) {
            const shimmer = 0.88 + (Math.sin(time * 5 + index * 12.7) + 1) * 0.06;
            const blink = Math.sin(time * 2.3 + index * 39.1) > 0.996 ? 0.28 : 1;
            color.multiplyScalar(shimmer * blink);
          }
          windows.setColorAt(index, color);
        }
        windows.instanceColor.needsUpdate = true;
        lastFlickerUpdate = now;
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    }
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      mount.removeEventListener("wheel", handleWheel);
      mount.removeEventListener("pointerdown", handlePointerDown);
      mount.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      const geometries = new Set();
      const materials = new Set();
      scene.traverse((object) => {
        if (!object.isMesh && !object.isPoints) return;
        if (object.geometry) geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          if (material) materials.add(material);
        }
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [active]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="auto"
      ref={mountRef}
      style={StyleSheet.absoluteFill}
    />
  );
}
