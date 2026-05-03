import type { AxisDefinition, Floor, HouseModel, Vec2, Wall, WallOpening } from "./model";

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export type CoordinateAnchor = Vec2 & {
  id: string;
  label: string;
};

export type StructuralAxis = {
  id: string;
  label: string;
  orientation: "vertical" | "horizontal";
  coordinate: number;
};

export function getFloorBounds(floor: Floor): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const include = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  floor.walls.forEach((wall) => {
    wallFootprint(wall).forEach((point) => include(point.x, point.y));
  });
  floor.spaces.forEach((space) => {
    space.boundary.forEach((point) => include(point.x, point.y));
  });
  floor.axes?.vertical.forEach((axis) => include(axisCoordinate(axis), 0));
  floor.axes?.horizontal.forEach((axis) => include(0, axisCoordinate(axis)));
  floor.objects.forEach((object) => {
    if (object.type === "box") {
      include(object.position.x - object.size.x / 2, object.position.y - object.size.y / 2);
      include(object.position.x + object.size.x / 2, object.position.y + object.size.y / 2);
      return;
    }
    object.boundary.forEach((point) => include(point.x, point.y));
  });

  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 1000, width: 1000, height: 1000 };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

export function getModelBounds(model: HouseModel): Bounds {
  const floorBounds = model.floors.map(getFloorBounds);
  const minX = Math.min(...floorBounds.map((bounds) => bounds.minX));
  const minY = Math.min(...floorBounds.map((bounds) => bounds.minY));
  const maxX = Math.max(...floorBounds.map((bounds) => bounds.maxX));
  const maxY = Math.max(...floorBounds.map((bounds) => bounds.maxY));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

export function wallMetrics(from: Vec2, to: Vec2) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return {
    dx,
    dy,
    length: Math.hypot(dx, dy),
    angle: Math.atan2(dy, dx),
    center: {
      x: from.x + dx / 2,
      y: from.y + dy / 2,
    },
  };
}

export function getCoordinateAnchors(floor: Floor): CoordinateAnchor[] {
  const anchors = [
    ...floor.walls.flatMap((wall) => [
      { ...wall.from, id: `${wall.id}-from`, label: `${wall.id} A` },
      { ...wall.to, id: `${wall.id}-to`, label: `${wall.id} B` },
    ]),
    ...floor.spaces.flatMap((space) =>
      space.boundary.map((point, index) => ({
        ...point,
        id: `${space.id}-p${index + 1}`,
        label: `${space.name} ${index + 1}`,
      })),
    ),
    ...floor.objects.map((object) => ({
      x: object.type === "box" ? object.position.x : averageCoordinate(object.boundary, "x"),
      y: object.type === "box" ? object.position.y : averageCoordinate(object.boundary, "y"),
      id: `${object.id}-center`,
      label: object.id,
    })),
  ];
  const byCoordinate = new Map<string, CoordinateAnchor>();

  anchors.forEach((anchor) => {
    const key = `${anchor.x},${anchor.y}`;
    const existing = byCoordinate.get(key);
    if (existing) {
      existing.label = `${existing.label}, ${anchor.label}`;
    } else {
      byCoordinate.set(key, anchor);
    }
  });

  return [...byCoordinate.values()];
}

export function getStructuralAxes(floor: Floor): StructuralAxis[] {
  if (floor.axes) {
    const verticalAxes = uniqueAxes(floor.axes.vertical)
      .sort((a, b) => a.coordinate - b.coordinate)
      .map((axis, index) => ({
        id: `axis-v-${axis.coordinate}`,
        label: axis.label ?? String(index + 1),
        orientation: "vertical" as const,
        coordinate: axis.coordinate,
      }));

    const horizontalAxes = uniqueAxes(floor.axes.horizontal)
      .sort((a, b) => a.coordinate - b.coordinate)
      .map((axis, index, axes) => ({
      id: `axis-h-${axis.coordinate}`,
      label: axis.label ?? axisLetter(axes.length - index - 1),
      orientation: "horizontal" as const,
      coordinate: axis.coordinate,
    }));

    return [...verticalAxes, ...horizontalAxes];
  }

  const verticalCoordinates = new Set<number>();
  const horizontalCoordinates = new Set<number>();

  floor.walls.forEach((wall) => {
    const metrics = wallMetrics(wall.from, wall.to);
    const center = wallLabelPoint(wall);
    if (Math.abs(metrics.dy) > Math.abs(metrics.dx)) {
      verticalCoordinates.add(Math.round(center.x));
    } else {
      horizontalCoordinates.add(Math.round(center.y));
    }
  });

  const verticalAxes = [...verticalCoordinates]
    .sort((a, b) => a - b)
    .map((coordinate, index) => ({
      id: `axis-v-${coordinate}`,
      label: String(index + 1),
      orientation: "vertical" as const,
      coordinate,
    }));

  const horizontalAxes = [...horizontalCoordinates]
    .sort((a, b) => a - b)
    .map((coordinate, index, coordinates) => ({
      id: `axis-h-${coordinate}`,
      label: axisLetter(coordinates.length - index - 1),
      orientation: "horizontal" as const,
      coordinate,
    }));

  return [...verticalAxes, ...horizontalAxes];
}

function axisCoordinate(axis: AxisDefinition) {
  return Math.round(typeof axis === "number" ? axis : axis.coordinate);
}

function uniqueAxes(axes: AxisDefinition[]) {
  const byCoordinate = new Map<number, { coordinate: number; label?: string }>();
  axes.forEach((axis) => {
    const coordinate = axisCoordinate(axis);
    byCoordinate.set(coordinate, {
      coordinate,
      label: typeof axis === "number" ? undefined : axis.label,
    });
  });
  return [...byCoordinate.values()];
}

function axisLetter(index: number): string {
  let value = index;
  let label = "";
  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return label;
}

export function wallFootprint(wall: Wall): Vec2[] {
  const metrics = wallMetrics(wall.from, wall.to);
  if (metrics.length === 0) return [wall.from, wall.to];

  const normal = {
    x: -metrics.dy / metrics.length,
    y: metrics.dx / metrics.length,
  };
  const side = wall.thicknessSide ?? "center";
  const startOffset = side === "center" ? -wall.thickness / 2 : side === "left" ? 0 : -wall.thickness;
  const endOffset = side === "center" ? wall.thickness / 2 : side === "left" ? wall.thickness : 0;

  return [
    offsetPoint(wall.from, normal, startOffset),
    offsetPoint(wall.to, normal, startOffset),
    offsetPoint(wall.to, normal, endOffset),
    offsetPoint(wall.from, normal, endOffset),
  ];
}

export function wallLabelPoint(wall: Wall): Vec2 {
  const metrics = wallMetrics(wall.from, wall.to);
  if (metrics.length === 0) return wall.from;

  const side = wall.thicknessSide ?? "center";
  const normal = {
    x: -metrics.dy / metrics.length,
    y: metrics.dx / metrics.length,
  };
  const offset = side === "center" ? 0 : side === "left" ? wall.thickness / 2 : -wall.thickness / 2;

  return offsetPoint(metrics.center, normal, offset);
}

export function wallDirection(wall: Wall): Vec2 {
  const metrics = wallMetrics(wall.from, wall.to);
  if (metrics.length === 0) return { x: 0, y: 0 };
  return {
    x: metrics.dx / metrics.length,
    y: metrics.dy / metrics.length,
  };
}

export function wallNormal(wall: Wall): Vec2 {
  const direction = wallDirection(wall);
  return {
    x: -direction.y,
    y: direction.x,
  };
}

export function pointAlongWall(wall: Wall, offset: number): Vec2 {
  const direction = wallDirection(wall);
  return {
    x: wall.from.x + direction.x * offset,
    y: wall.from.y + direction.y * offset,
  };
}

export function wallOpeningSegment(wall: Wall, opening: WallOpening): [Vec2, Vec2] {
  return [
    pointAlongWall(wall, opening.offset),
    pointAlongWall(wall, opening.offset + opening.length),
  ];
}

function offsetPoint(point: Vec2, normal: Vec2, amount: number): Vec2 {
  return {
    x: point.x + normal.x * amount,
    y: point.y + normal.y * amount,
  };
}

function averageCoordinate(points: Vec2[], axis: "x" | "y") {
  if (points.length === 0) return 0;
  return points.reduce((sum, point) => sum + point[axis], 0) / points.length;
}
