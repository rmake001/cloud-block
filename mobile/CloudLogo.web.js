import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";

const WORD_LINES = ["Cloud", "Block"];
const HOLD_DURATION = 3900;
const DISPERSAL_DURATION = 1350;

function randomSource(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function edgeKey(x, y) {
  return `${x},${y}`;
}

function traceContours(imageData, width, height, step) {
  const columns = Math.ceil(width / step);
  const rows = Math.ceil(height / step);
  const filled = new Uint8Array(columns * rows);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const pixel = (Math.floor(y * step + step / 2) * width +
        Math.floor(x * step + step / 2)) * 4;
      filled[y * columns + x] = imageData[pixel + 3] > 72 ? 1 : 0;
    }
  }

  const edges = [];
  const outgoing = new Map();
  function addEdge(x1, y1, x2, y2) {
    const edge = { x1, y1, x2, y2, used: false };
    edges.push(edge);
    const key = edgeKey(x1, y1);
    const list = outgoing.get(key) || [];
    list.push(edge);
    outgoing.set(key, list);
  }

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (!filled[y * columns + x]) continue;
      if (y === 0 || !filled[(y - 1) * columns + x]) {
        addEdge(x, y, x + 1, y);
      }
      if (x === columns - 1 || !filled[y * columns + x + 1]) {
        addEdge(x + 1, y, x + 1, y + 1);
      }
      if (y === rows - 1 || !filled[(y + 1) * columns + x]) {
        addEdge(x + 1, y + 1, x, y + 1);
      }
      if (x === 0 || !filled[y * columns + x - 1]) {
        addEdge(x, y + 1, x, y);
      }
    }
  }

  const contours = [];
  for (const firstEdge of edges) {
    if (firstEdge.used) continue;
    const points = [];
    let edge = firstEdge;
    for (let guard = 0; guard <= edges.length; guard += 1) {
      edge.used = true;
      points.push(new THREE.Vector2(edge.x1 * step, edge.y1 * step));
      if (edge.x2 === firstEdge.x1 && edge.y2 === firstEdge.y1) break;
      const next = outgoing
        .get(edgeKey(edge.x2, edge.y2))
        ?.find((candidate) => !candidate.used);
      if (!next) break;
      edge = next;
    }
    if (points.length >= 4) contours.push(points);
  }
  return contours.sort(
    (first, second) =>
      Math.abs(THREE.ShapeUtils.area(second)) -
      Math.abs(THREE.ShapeUtils.area(first)),
  );
}

function smoothContour(points) {
  let contour = points;
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const smoothed = [];
    for (let index = 0; index < contour.length; index += 1) {
      const current = contour[index];
      const next = contour[(index + 1) % contour.length];
      smoothed.push(
        new THREE.Vector2(
          current.x * 0.75 + next.x * 0.25,
          current.y * 0.75 + next.y * 0.25,
        ),
        new THREE.Vector2(
          current.x * 0.25 + next.x * 0.75,
          current.y * 0.25 + next.y * 0.75,
        ),
      );
    }
    contour = smoothed;
  }
  return contour;
}

function makeLetterGeometry(letter, fontSize, scale) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(fontSize * 1.3);
  canvas.height = Math.ceil(fontSize * 1.5);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not create the CloudBlock logo shape.");

  context.font = `600 ${fontSize}px Georgia, serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#fff";
  context.fillText(letter, canvas.width / 2, canvas.height / 2);

  const contours = traceContours(
    context.getImageData(0, 0, canvas.width, canvas.height).data,
    canvas.width,
    canvas.height,
    1,
  );
  const outer = contours[0];
  if (!outer) throw new Error(`Could not form the "${letter}" cloud letter.`);

  function toShapePoints(points) {
    return points.map(
      (point) =>
        new THREE.Vector2(
          (point.x - canvas.width / 2) * scale,
          (canvas.height / 2 - point.y) * scale,
        ),
    );
  }

  const outerPoints = smoothContour(toShapePoints(outer));
  if (!THREE.ShapeUtils.isClockWise(outerPoints)) outerPoints.reverse();
  const shape = new THREE.Shape(outerPoints);
  for (const contour of contours.slice(1)) {
    const holePoints = smoothContour(toShapePoints(contour));
    if (THREE.ShapeUtils.isClockWise(holePoints)) holePoints.reverse();
    const hole = new THREE.Path();
    hole.setFromPoints(holePoints);
    shape.holes.push(hole);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelSegments: 8,
    bevelSize: 0.075,
    bevelThickness: 0.1,
    curveSegments: 8,
  });
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  geometry.translate(
    -(bounds.min.x + bounds.max.x) / 2,
    -(bounds.min.y + bounds.max.y) / 2,
    0,
  );
  return geometry;
}

function ease(value) {
  const progress = Math.max(0, Math.min(1, value));
  return progress * progress * (3 - 2 * progress);
}

export default function CloudLogo({ active, onComplete }) {
  const mountRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) return undefined;
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    let frameId;
    let completionTimer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch (error) {
      console.warn("The CloudBlock logo animation could not start.", error);
      onCompleteRef.current?.();
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xe4f1ff, 0x586579, 1.3));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(-4, 6, 9);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa6c9ff, 1.25);
    rimLight.position.set(5, -2, 5);
    scene.add(rimLight);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 60);
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    const random = randomSource(4381);
    const letters = [];
    const letterMeshes = [];
    const scale = 10 / window.innerHeight;
    const measureCanvas = document.createElement("canvas");
    const measureContext = measureCanvas.getContext("2d");
    if (!measureContext) {
      renderer.dispose();
      return undefined;
    }

    const { width: viewWidth } = mount.getBoundingClientRect();
    let fontSize = Math.min(viewWidth * 0.22, 180);
    measureContext.font = `600 ${fontSize}px Georgia, serif`;
    const widestLine = () =>
      Math.max(...WORD_LINES.map((line) => measureContext.measureText(line).width));
    while (widestLine() > viewWidth * 0.82 && fontSize > 24) {
      fontSize -= 2;
      measureContext.font = `600 ${fontSize}px Georgia, serif`;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xf3f8ff,
      roughness: 0.96,
      metalness: 0,
      emissive: 0x64798d,
      emissiveIntensity: 0.035,
      transparent: true,
      depthWrite: false,
    });
    let letterIndex = 0;
    const lineGap = fontSize * 1.12 * scale;
    for (const [lineIndex, line] of WORD_LINES.entries()) {
      const lineWidth = measureContext.measureText(line).width * scale;
      let cursor = -lineWidth / 2;
      const targetY = lineGap * (0.5 - lineIndex);
      for (const letter of line) {
        const advance = measureContext.measureText(letter).width * scale;
        const geometry = makeLetterGeometry(letter, fontSize, scale);
        const mesh = new THREE.Mesh(geometry, material.clone());
        const targetX = cursor + advance / 2;
        const angle = random() * Math.PI * 2;
        const distance = 3 + random() * 4;
        const start = new THREE.Vector3(
          targetX + Math.cos(angle) * distance,
          targetY + (random() * 2 - 1) * 4,
          (random() - 0.5) * 2,
        );
        mesh.position.copy(start);
        mesh.scale.setScalar(0.65);
        scene.add(mesh);
        letters.push({
          mesh,
          start,
          target: new THREE.Vector3(targetX, targetY, 0),
          drift: new THREE.Vector3(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            (random() - 0.5) * 2,
          ),
          delay: letterIndex * 75,
          phase: random() * Math.PI * 2,
          speed: 0.75 + random() * 0.5,
          rotation: (random() - 0.5) * 0.28,
        });
        letterMeshes.push(mesh);
        cursor += advance;
        letterIndex += 1;
      }
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    function resize() {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      camera.left = -5 * aspect;
      camera.right = 5 * aspect;
      camera.top = 5;
      camera.bottom = -5;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    let startTime;

    function render(now) {
      if (startTime === undefined) startTime = now;
      const elapsed = now - startTime;
      const disperse = ease(
        (elapsed - HOLD_DURATION) / DISPERSAL_DURATION,
      );

      for (const letter of letters) {
        const gather = ease((elapsed - letter.delay) / 1050);
        const { mesh } = letter;
        const breath =
          1 + Math.sin(elapsed * 0.0016 * letter.speed + letter.phase) * 0.018;
        mesh.position.set(
          letter.start.x +
            (letter.target.x - letter.start.x) * gather +
            letter.drift.x * disperse,
          letter.start.y * (1 - gather) +
            letter.target.y * gather +
            letter.drift.y * disperse +
            Math.sin(elapsed * 0.001 * letter.speed + letter.phase) *
              (1 - disperse) *
              0.035,
          letter.start.z * (1 - gather) +
            letter.target.z * gather +
            letter.drift.z * disperse,
        );
        mesh.rotation.z =
          letter.rotation * (1 - gather) +
          Math.sin(elapsed * 0.0007 + letter.phase) * 0.025 +
          disperse * letter.rotation;
        mesh.scale.setScalar((0.65 + gather * 0.35) * breath);
        mesh.material.opacity = Math.max(
          0,
          Math.min(1, gather * (1 - disperse)),
        );
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    }

    frameId = window.requestAnimationFrame(render);
    completionTimer = window.setTimeout(
      () => onCompleteRef.current?.(),
      HOLD_DURATION + DISPERSAL_DURATION + 150,
    );

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(completionTimer);
      resizeObserver.disconnect();
      for (const mesh of letterMeshes) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [active]);

  if (!active) return null;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      ref={mountRef}
      style={styles.overlay}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
