import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";

function addBox(parent, dimensions, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...dimensions),
    material,
  );
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addWindow(scene, neighbor, floor, x, y, depth, index) {
  const window = new THREE.Group();
  window.position.set(x, y, depth);
  window.userData.progress = neighbor?.privacyMode ? 0 : 1;
  window.userData.open = !neighbor?.privacyMode;
  window.userData.slats = [];
  window.userData.neighbor = neighbor;
  scene.add(window);

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x64727d,
    metalness: 0.72,
    roughness: 0.38,
  });
  const glassMaterial = new THREE.MeshBasicMaterial({
    color: index % 3 === 0 ? 0x263645 : 0xe9b875,
    transparent: true,
    opacity: 0.88,
    toneMapped: false,
  });
  const blindMaterial = new THREE.MeshStandardMaterial({
    color: 0x9caab2,
    metalness: 0.34,
    roughness: 0.44,
  });

  addBox(window, [1.12, 0.82, 0.16], [0, 0, 0], frameMaterial);
  addBox(window, [0.94, 0.64, 0.035], [0, 0, 0.1], glassMaterial);
  addBox(window, [0.035, 0.64, 0.04], [0, 0, 0.13], frameMaterial);
  addBox(window, [0.94, 0.035, 0.04], [0, 0, 0.13], frameMaterial);

  for (let slatIndex = 0; slatIndex < 7; slatIndex += 1) {
    const slat = addBox(
      window,
      [0.86, 0.055, 0.045],
      [0, 0.26 + slatIndex * 0.025, 0.15],
      blindMaterial,
    );
    window.userData.slats.push(slat);
    slat.userData.closedY = -0.25 + slatIndex * 0.082;
    slat.userData.openY = 0.26 + slatIndex * 0.025;
  }

  const hitArea = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.88),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  hitArea.position.z = 0.2;
  hitArea.userData.window = window;
  window.add(hitArea);
  hitArea.updateWorldMatrix(true, false);

  window.userData.apartment = neighbor?.apartment || `${floor}${index}`;
  return { window, hitArea };
}

function makeFacade(neighbors) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xc3d1dc, 0x161b22, 1.7));

  const warmLight = new THREE.PointLight(0xf1ba75, 38, 18);
  warmLight.position.set(-2.5, 3.5, 5);
  scene.add(warmLight);

  const coolLight = new THREE.DirectionalLight(0x94abc0, 2.4);
  coolLight.position.set(6, 5, 8);
  scene.add(coolLight);

  const floors = [...new Set(neighbors.map((neighbor) => neighbor.floor))].sort(
    (first, second) => first - second,
  );
  const floorSpacing = 1.35;
  const totalHeight = Math.max(floors.length, 1) * floorSpacing;
  const building = new THREE.Group();
  scene.add(building);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x17232d,
    metalness: 0.48,
    roughness: 0.58,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x465661,
    metalness: 0.68,
    roughness: 0.42,
  });
  const hallMaterial = new THREE.MeshStandardMaterial({
    color: 0x887d6e,
    roughness: 0.76,
  });

  addBox(building, [9.4, totalHeight + 0.45, 1.55], [0, 0, 0], wallMaterial);
  addBox(
    building,
    [0.72, totalHeight, 0.42],
    [4.1, 0, 0.82],
    trimMaterial,
  );
  addBox(building, [0.12, totalHeight + 0.2, 0.18], [-4.6, 0, 0.84], trimMaterial);

  const windows = [];
  floors.forEach((floor, floorIndex) => {
    const floorNeighbors = neighbors.filter((neighbor) => neighbor.floor === floor);
    const y = -totalHeight / 2 + floorSpacing * (floorIndex + 0.5);

    addBox(
      building,
      [9.55, 0.11, 2.05],
      [0, y - 0.53, 0.04],
      trimMaterial,
    );
    addBox(
      building,
      [9.1, 0.045, 0.3],
      [0, y - 0.12, 1.05],
      trimMaterial,
    );
    addBox(
      building,
      [8.8, 0.18, 0.22],
      [0, y + 0.28, 0.89],
      hallMaterial,
    );
    addBox(
      building,
      [9.1, 0.025, 0.16],
      [0, y - 0.36, 1.18],
      trimMaterial,
    );

    const slotCount = 4;
    const firstNeighborSlot = Math.floor((slotCount - floorNeighbors.length) / 2);
    for (let slot = 0; slot < slotCount; slot += 1) {
      const neighborIndex = slot - firstNeighborSlot;
      const neighbor =
        neighborIndex >= 0 && neighborIndex < floorNeighbors.length
          ? floorNeighbors[neighborIndex]
          : null;
      const x = -3.15 + (6.3 * slot) / (slotCount - 1);
      windows.push(
        addWindow(
          scene,
          neighbor,
          floor,
          x,
          y + 0.11,
          1.05,
          floor * slotCount + slot,
        ),
      );
    }

  });

  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 60);
  camera.position.set(3.2, 2.3, 10.2);
  camera.lookAt(0, 0, 0);

  return { scene, camera, windows };
}

export default function ConnectScene({ neighbors, onSelectNeighbor }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || neighbors.length === 0) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch (error) {
      console.warn("The building window scene could not start.", error);
      return undefined;
    }

    const { scene, camera, windows } = makeFacade(neighbors);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hitAreas = windows.map(({ hitArea }) => hitArea);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.cursor = "pointer";
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      "Three-dimensional building facade. Tap an apartment window to open or close its blinds.",
    );
    mount.appendChild(renderer.domElement);

    function resize() {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function toggleWindow(event) {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hitAreas, false)[0];
      if (!hit) return;
      const target = hit.object.userData.window;
      target.userData.open = !target.userData.open;
      if (target.userData.neighbor) {
        onSelectNeighbor?.(target.userData.neighbor);
      }
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    renderer.domElement.addEventListener("pointerdown", toggleWindow);
    let frameId;
    function render() {
      for (const { window: apartment } of windows) {
        const state = apartment.userData;
        const target = state.open ? 1 : 0;
        state.progress += (target - state.progress) * 0.12;
        for (const slat of state.slats) {
          slat.position.y =
            slat.userData.closedY * (1 - state.progress) +
            slat.userData.openY * state.progress;
        }
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    }
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", toggleWindow);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (!object.material) return;
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [neighbors, onSelectNeighbor]);

  if (neighbors.length === 0) return null;

  return (
    <View style={styles.scene}>
      <View ref={mountRef} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    position: "relative",
    height: 148,
    width: "100%",
    marginBottom: 12,
  },
});
