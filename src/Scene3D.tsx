import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { HouseModel, Space, Wall } from "./model";
import {
  getFloorBounds,
  getModelBounds,
  pointAlongWall,
  getStructuralAxes,
  wallLabelPoint,
  wallMetrics,
  wallNormal,
} from "./geometry";
import { getSunPath, getSunPosition, type SunStudySettings } from "./solar";

type Scene3DProps = {
  model: HouseModel;
  activeFloorId: string;
  showAllFloors: boolean;
  wireframe: boolean;
  sunStudy: SunStudySettings;
  interactionEnabled: boolean;
};

const CM_TO_M = 0.01;
const isGreenPlatformStep = (id: string) => id.startsWith("green-platform-");
const isGarageStepOrPlatform = (id: string) => id === "garage-platform" || id.startsWith("garage-step-");
const isGarageCar = (id: string) => id === "garage-car-rav4-prime";
const isPillar = (id: string) => /^p\d+$/.test(id);
const isSolidStepOrPlatform = (id: string) =>
  isGreenPlatformStep(id) || isGarageStepOrPlatform(id) || isGarageCar(id) || isPillar(id);
const wallsWithoutFoundation = new Set(["w23", "w24", "w25", "w31", "w32", "w34", "w35", "w36"]);
const pillarsWithoutFoundation = new Set(["p7", "p9", "p10", "p16"]);

export function Scene3D({ model, activeFloorId, showAllFloors, wireframe, sunStudy, interactionEnabled }: Scene3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cameraStateRef = useRef<{
    target: THREE.Vector3;
    spherical: THREE.Spherical;
  } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const bounds = getModelBounds(model);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const largest = Math.max(bounds.width, bounds.height) * CM_TO_M;
    const initialTarget = new THREE.Vector3(centerX * CM_TO_M, 1.2, centerY * CM_TO_M);
    const initialOffset = new THREE.Vector3(0, largest * 0.9 + 4, largest * 0.9 + 4);
    const savedState = cameraStateRef.current;
    const target = savedState?.target.clone() ?? initialTarget;
    const spherical =
      savedState?.spherical.clone() ??
      new THREE.Spherical().setFromVector3(initialOffset);
    camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(target));
    camera.lookAt(target);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.domElement.style.touchAction = interactionEnabled ? "none" : "auto";
    mount.appendChild(renderer.domElement);

    const grid = new THREE.GridHelper(Math.max(largest, 5), Math.max(Math.ceil(largest), 5), "#c5ccd6", "#dce1e8");
    grid.position.set(centerX * CM_TO_M, 0, centerY * CM_TO_M);
    scene.add(grid);
    const groundExtent = Math.max(largest * 3.2, 18);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundExtent, groundExtent),
      new THREE.MeshLambertMaterial({
        color: "#355846",
        transparent: true,
        opacity: 0.58,
        side: THREE.DoubleSide,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(centerX * CM_TO_M, -0.004, centerY * CM_TO_M);
    ground.receiveShadow = true;
    scene.add(ground);

    const sunPosition = getSunPosition(sunStudy);
    const isDaylight = sunPosition.altitudeDegrees > 0;
    scene.background = new THREE.Color(isDaylight ? "#f7f8fa" : "#18202b");

    scene.add(new THREE.AmbientLight(isDaylight ? "#ffffff" : "#8ea0b8", isDaylight ? 0.52 : 0.2));
    const sunLight = new THREE.DirectionalLight("#fff2c7", 1.05);
    scene.add(sunLight);

    const materialFor = (color: string, opacity = 1, forceSolid = false) =>
      new THREE.MeshLambertMaterial({
        color,
        wireframe: forceSolid ? false : wireframe,
        transparent: opacity < 1,
        opacity,
        side: THREE.DoubleSide,
      });
    const axisMaterial = new THREE.LineDashedMaterial({
      color: "#256f8f",
      dashSize: 0.16,
      gapSize: 0.1,
      depthTest: false,
    });
    const stepTopEdgeMaterial = new THREE.LineBasicMaterial({
      color: "#557548",
      depthTest: true,
    });
    const sunPathMaterial = new THREE.LineBasicMaterial({
      color: "#c6902f",
      transparent: true,
      opacity: 0.9,
    });
    const sunMarkerMaterial = new THREE.MeshBasicMaterial({ color: "#f2b53d" });
    const windowGlassMaterial = new THREE.MeshPhongMaterial({
      color: "#90b7cf",
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      shininess: 90,
    });
    const doorGlassMaterial = new THREE.MeshPhongMaterial({
      color: "#476b88",
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      shininess: 70,
    });
    const windowFrameMaterial = new THREE.LineBasicMaterial({
      color: "#42515d",
      depthTest: true,
    });
    const ceilingMaterial = new THREE.MeshLambertMaterial({
      color: "#d6dbe2",
      transparent: true,
      opacity: 0,
    });
    ceilingMaterial.colorWrite = false;
    ceilingMaterial.depthWrite = false;

    const floors = showAllFloors ? model.floors : model.floors.filter((floor) => floor.id === activeFloorId);
    const sunPath = getSunPath(sunStudy);
    const sunDistance = Math.max(largest * 1.3, 8);
    sunLight.position.set(
      centerX * CM_TO_M + sunPosition.direction.x * sunDistance,
      Math.max(0.2, sunPosition.direction.y * sunDistance),
      centerY * CM_TO_M + sunPosition.direction.z * sunDistance,
    );
    sunLight.intensity = isDaylight ? 1.05 : 0.12;
    sunLight.castShadow = isDaylight;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = Math.max(30, sunDistance * 3);
    sunLight.shadow.camera.left = -sunDistance;
    sunLight.shadow.camera.right = sunDistance;
    sunLight.shadow.camera.top = sunDistance;
    sunLight.shadow.camera.bottom = -sunDistance;
    sunLight.target.position.set(centerX * CM_TO_M, 0, centerY * CM_TO_M);
    scene.add(sunLight.target);

    if (sunPath.length > 1) {
      const pathGeometry = new THREE.BufferGeometry().setFromPoints(
        sunPath.map((position) =>
          new THREE.Vector3(
            centerX * CM_TO_M + position.direction.x * sunDistance,
            position.direction.y * sunDistance,
            centerY * CM_TO_M + position.direction.z * sunDistance,
          ),
        ),
      );
      const sunPathLine = new THREE.Line(pathGeometry, sunPathMaterial);
      sunPathLine.visible = isDaylight;
      scene.add(sunPathLine);
    }

    if (isDaylight) {
      const sunMarker = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 12), sunMarkerMaterial);
      sunMarker.position.set(
        centerX * CM_TO_M + sunPosition.direction.x * sunDistance,
        sunPosition.direction.y * sunDistance,
        centerY * CM_TO_M + sunPosition.direction.z * sunDistance,
      );
      scene.add(sunMarker);
    }

    floors.forEach((floor) => {
      const floorY = floor.elevation * CM_TO_M;
      const floorBounds = getFloorBounds(floor);
      const axisPadding = 80;

      getStructuralAxes(floor).forEach((axis) => {
        const lineY = floorY + 0.035;
        const points =
          axis.orientation === "vertical"
            ? [
                new THREE.Vector3(axis.coordinate * CM_TO_M, lineY, (floorBounds.minY - axisPadding) * CM_TO_M),
                new THREE.Vector3(axis.coordinate * CM_TO_M, lineY, (floorBounds.maxY + axisPadding) * CM_TO_M),
              ]
            : [
                new THREE.Vector3((floorBounds.minX - axisPadding) * CM_TO_M, lineY, axis.coordinate * CM_TO_M),
                new THREE.Vector3((floorBounds.maxX + axisPadding) * CM_TO_M, lineY, axis.coordinate * CM_TO_M),
              ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, axisMaterial);
        line.computeLineDistances();
        scene.add(line);

        const label = createTextSprite(axis.label, "axis");
        const labelPosition =
          axis.orientation === "vertical"
            ? new THREE.Vector3(axis.coordinate * CM_TO_M, floorY + 0.16, (floorBounds.minY - axisPadding / 2) * CM_TO_M)
            : new THREE.Vector3((floorBounds.minX - axisPadding / 2) * CM_TO_M, floorY + 0.16, axis.coordinate * CM_TO_M);
        label.position.copy(labelPosition);
        scene.add(label);
      });

      floor.spaces.forEach((space) => {
        const shape = new THREE.Shape();
        space.boundary.forEach((point, index) => {
          const x = point.x * CM_TO_M;
          const y = point.y * CM_TO_M;
          if (index === 0) shape.moveTo(x, y);
          else shape.lineTo(x, y);
        });
        shape.closePath();
        const geometry = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geometry, materialFor(space.color ?? "#e8eef7", 0.62, true));
        mesh.rotation.x = Math.PI / 2;
        mesh.position.y = floorY + (space.baseElevation ?? 0) * CM_TO_M + 0.01;
        mesh.receiveShadow = true;
        scene.add(mesh);
        addCeiling(scene, floorY, space, ceilingMaterial);
      });

      floor.walls.forEach((wall) => {
        const metrics = wallMetrics(wall.from, wall.to);
        const wallCenter = wallLabelPoint(wall);
        const wallBaseY = floorY + (wall.baseElevation ?? 0) * CM_TO_M;

        if ((wall.baseElevation ?? 0) > 0 && !wallsWithoutFoundation.has(wall.id)) {
          const foundationHeight = (wall.baseElevation ?? 0) * CM_TO_M;
          const foundationGeometry = new THREE.BoxGeometry(
            metrics.length * CM_TO_M,
            foundationHeight,
            wall.thickness * CM_TO_M,
          );
          const foundation = new THREE.Mesh(foundationGeometry, materialFor("#8f969e", 1, true));
          foundation.position.set(wallCenter.x * CM_TO_M, floorY + foundationHeight / 2, wallCenter.y * CM_TO_M);
          foundation.rotation.y = -metrics.angle;
          foundation.castShadow = true;
          foundation.receiveShadow = true;
          scene.add(foundation);
        }

        renderWall(scene, wall, floorY, materialFor(wall.color ?? "#303946", wireframe ? 1 : 0.72));

        const label = createTextSprite(wall.id);
        label.position.set(wallCenter.x * CM_TO_M, wallBaseY + wall.height * CM_TO_M + 0.22, wallCenter.y * CM_TO_M);
        scene.add(label);

        wall.openings?.forEach((opening, openingIndex) => {
          const openingCenter = pointAlongWall(wall, opening.offset + opening.length / 2);
          const openingY =
            floorY + ((wall.baseElevation ?? 0) + opening.baseHeight + opening.height / 2) * CM_TO_M;
          const normal = wallNormal(wall);
          const faceOffset = (wall.thickness / 2 + 0.8) * CM_TO_M;
          const openingMaterial = opening.type === "door" ? doorGlassMaterial : windowGlassMaterial;

          [-1, 1].forEach((side) => {
            const glassGeometry = new THREE.PlaneGeometry(opening.length * CM_TO_M, opening.height * CM_TO_M);
            const glass = new THREE.Mesh(glassGeometry, openingMaterial);
            glass.position.set(
              openingCenter.x * CM_TO_M + normal.x * faceOffset * side,
              openingY,
              openingCenter.y * CM_TO_M + normal.y * faceOffset * side,
            );
            glass.rotation.y = -metrics.angle + (side === -1 ? Math.PI : 0);
            glass.castShadow = false;
            glass.receiveShadow = false;
            scene.add(glass);

            const halfLength = (opening.length * CM_TO_M) / 2;
            const halfHeight = (opening.height * CM_TO_M) / 2;
            const frameGeometry = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(-halfLength, -halfHeight, 0),
              new THREE.Vector3(halfLength, -halfHeight, 0),
              new THREE.Vector3(halfLength, halfHeight, 0),
              new THREE.Vector3(-halfLength, halfHeight, 0),
            ]);
            const frame = new THREE.LineLoop(frameGeometry, windowFrameMaterial);
            frame.position.copy(glass.position);
            frame.rotation.copy(glass.rotation);
            frame.name = `window-frame-${wall.id}-${openingIndex}-${side}`;
            scene.add(frame);
          });

          const openingLabel = createTextSprite(opening.id);
          openingLabel.position.set(
            openingCenter.x * CM_TO_M,
            floorY + ((wall.baseElevation ?? 0) + opening.baseHeight + opening.height) * CM_TO_M + 0.18,
            openingCenter.y * CM_TO_M,
          );
          scene.add(openingLabel);
        });
      });

      floor.objects.forEach((object) => {
        const geometry = new THREE.BoxGeometry(
          object.size.x * CM_TO_M,
          object.size.z * CM_TO_M,
          object.size.y * CM_TO_M,
        );
        const objectY =
          object.baseElevation === undefined
            ? floorY + object.position.z * CM_TO_M
            : floorY + (object.baseElevation + object.size.z / 2) * CM_TO_M;
        if (isPillar(object.id) && (object.baseElevation ?? 0) > 0 && !pillarsWithoutFoundation.has(object.id)) {
          const foundationHeight = (object.baseElevation ?? 0) * CM_TO_M;
          const foundationGeometry = new THREE.BoxGeometry(
            object.size.x * CM_TO_M,
            foundationHeight,
            object.size.y * CM_TO_M,
          );
          const foundation = new THREE.Mesh(foundationGeometry, materialFor("#8f969e", 1, true));
          foundation.position.set(
            object.position.x * CM_TO_M,
            floorY + foundationHeight / 2,
            object.position.y * CM_TO_M,
          );
          foundation.castShadow = true;
          foundation.receiveShadow = true;
          scene.add(foundation);
        }
        const forceSolid = isSolidStepOrPlatform(object.id);
        const mesh = new THREE.Mesh(
          geometry,
          materialFor(object.color ?? "#69788c", forceSolid || wireframe ? 1 : 0.85, forceSolid),
        );
        mesh.position.set(
          object.position.x * CM_TO_M,
          objectY,
          object.position.y * CM_TO_M,
        );
        mesh.rotation.y = -(object.rotationZ ?? 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        if (isPillar(object.id)) {
          const label = createTextSprite(object.id);
          label.position.set(
            object.position.x * CM_TO_M,
            objectY + (object.size.z * CM_TO_M) / 2 + 0.18,
            object.position.y * CM_TO_M,
          );
          scene.add(label);
        }

        if (forceSolid) {
          const halfX = (object.size.x * CM_TO_M) / 2;
          const halfZ = (object.size.y * CM_TO_M) / 2;
          const topY = objectY + (object.size.z * CM_TO_M) / 2 + 0.004;
          const centerX = object.position.x * CM_TO_M;
          const centerZ = object.position.y * CM_TO_M;
          const topEdgeGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(centerX - halfX, topY, centerZ - halfZ),
            new THREE.Vector3(centerX + halfX, topY, centerZ - halfZ),
            new THREE.Vector3(centerX + halfX, topY, centerZ + halfZ),
            new THREE.Vector3(centerX - halfX, topY, centerZ + halfZ),
          ]);
          const topEdge = new THREE.LineLoop(topEdgeGeometry, stepTopEdgeMaterial);
          scene.add(topEdge);
        }
      });

    });

    let isDragging = false;
    let previousX = 0;
    let previousY = 0;

    const render = () => {
      camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(target));
      camera.lookAt(target);
      renderer.render(scene, camera);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!interactionEnabled) return;
      isDragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) return;
      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      spherical.theta -= dx * 0.008;
      spherical.phi = Math.min(Math.PI * 0.48, Math.max(0.2, spherical.phi + dy * 0.008));
      render();
    };
    const onPointerUp = (event: PointerEvent) => {
      isDragging = false;
      renderer.domElement.releasePointerCapture(event.pointerId);
    };
    const onWheel = (event: WheelEvent) => {
      if (!interactionEnabled) return;
      event.preventDefault();
      spherical.radius = Math.min(80, Math.max(2, spherical.radius + event.deltaY * 0.01));
      render();
    };
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      render();
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);
    render();

    return () => {
      cameraStateRef.current = {
        target: target.clone(),
        spherical: spherical.clone(),
      };
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      axisMaterial.dispose();
      stepTopEdgeMaterial.dispose();
      sunPathMaterial.dispose();
      sunMarkerMaterial.dispose();
      windowGlassMaterial.dispose();
      doorGlassMaterial.dispose();
      windowFrameMaterial.dispose();
      ceilingMaterial.dispose();
      scene.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          item.geometry.dispose();
          if (Array.isArray(item.material)) item.material.forEach((material) => material.dispose());
          else item.material.dispose();
        } else if (item instanceof THREE.Line) {
          item.geometry.dispose();
        } else if (item instanceof THREE.Sprite) {
          item.material.map?.dispose();
          item.material.dispose();
        }
      });
    };
  }, [activeFloorId, interactionEnabled, model, showAllFloors, sunStudy, wireframe]);

  return <div className={`viewport ${interactionEnabled ? "interactive" : "passive"}`} ref={mountRef} />;
}

function createTextSprite(text: string, variant: "wall" | "coordinate" | "axis" = "wall") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const width = 256;
  const height = 96;
  canvas.width = width;
  canvas.height = height;

  if (context) {
    const box =
      variant === "coordinate"
        ? { x: 30, y: 24, width: 196, height: 48 }
        : variant === "axis"
          ? { x: 88, y: 18, width: 80, height: 60 }
          : { x: 58, y: 22, width: 140, height: 52 };
    context.clearRect(0, 0, width, height);
    context.fillStyle = variant === "axis" ? "rgba(255, 255, 255, 0.9)" : variant === "coordinate" ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.88)";
    context.strokeStyle = variant === "axis" ? "rgba(37, 111, 143, 0.7)" : variant === "coordinate" ? "rgba(199, 53, 53, 0.6)" : "rgba(32, 42, 55, 0.35)";
    context.lineWidth = 5;
    roundedRect(context, box.x, box.y, box.width, box.height, 12);
    context.fill();
    context.stroke();
    context.fillStyle = variant === "axis" ? "#174d66" : variant === "coordinate" ? "#9f2626" : "#17202c";
    context.font = `${variant === "coordinate" ? "700 26px" : variant === "axis" ? "800 38px" : "700 34px"} system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, width / 2, height / 2 + 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(material);
  if (variant === "coordinate") {
    sprite.scale.set(1.1, 0.42, 1);
  } else if (variant === "axis") {
    sprite.scale.set(0.55, 0.4, 1);
  } else {
    sprite.scale.set(1.4, 0.52, 1);
  }
  return sprite;
}

function renderWall(
  scene: THREE.Scene,
  wall: Wall,
  floorY: number,
  material: THREE.Material,
) {
  const metrics = wallMetrics(wall.from, wall.to);
  const openings = [...(wall.openings ?? [])].sort((a, b) => a.offset - b.offset);
  let cursor = 0;

  openings.forEach((opening) => {
    if (opening.offset > cursor) {
      addWallBox(scene, wall, floorY, material, cursor, opening.offset - cursor, 0, wall.height);
    }
    if (opening.baseHeight > 0) {
      addWallBox(scene, wall, floorY, material, opening.offset, opening.length, 0, opening.baseHeight);
    }
    const topHeight = wall.height - opening.baseHeight - opening.height;
    if (topHeight > 0) {
      addWallBox(
        scene,
        wall,
        floorY,
        material,
        opening.offset,
        opening.length,
        opening.baseHeight + opening.height,
        topHeight,
      );
    }
    cursor = opening.offset + opening.length;
  });

  if (cursor < metrics.length) {
    addWallBox(scene, wall, floorY, material, cursor, metrics.length - cursor, 0, wall.height);
  }
}

function addWallBox(
  scene: THREE.Scene,
  wall: Wall,
  floorY: number,
  material: THREE.Material,
  offset: number,
  length: number,
  heightOffset: number,
  height: number,
) {
  if (length <= 0 || height <= 0) return;
  const metrics = wallMetrics(wall.from, wall.to);
  const direction = {
    x: metrics.dx / metrics.length,
    y: metrics.dy / metrics.length,
  };
  const start = {
    x: wall.from.x + direction.x * offset,
    y: wall.from.y + direction.y * offset,
  };
  const center = {
    x: start.x + direction.x * (length / 2),
    y: start.y + direction.y * (length / 2),
  };
  const geometry = new THREE.BoxGeometry(length * CM_TO_M, height * CM_TO_M, wall.thickness * CM_TO_M);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    center.x * CM_TO_M,
    floorY + ((wall.baseElevation ?? 0) + heightOffset + height / 2) * CM_TO_M,
    center.y * CM_TO_M,
  );
  mesh.rotation.y = -metrics.angle;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function addCeiling(scene: THREE.Scene, floorY: number, space: Space, material: THREE.Material) {
  const shape = new THREE.Shape();
  space.boundary.forEach((point, index) => {
    const x = point.x * CM_TO_M;
    const y = point.y * CM_TO_M;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = floorY + ((space.baseElevation ?? 0) + 270) * CM_TO_M - 0.01;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
