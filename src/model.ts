export type Unit = "cm";

export type Vec2 = {
  x: number;
  y: number;
};

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type Wall = {
  id: string;
  name?: string;
  from: Vec2;
  to: Vec2;
  height: number;
  baseElevation?: number;
  renderFoundation?: boolean;
  thickness: number;
  thicknessSide?: "center" | "left" | "right";
  color?: string;
  openings?: WallOpening[];
};

export type WallOpening = {
  id: string;
  type: "window" | "door";
  offset: number;
  length: number;
  baseHeight: number;
  height: number;
};

export type AxisDefinition =
  | number
  | {
      coordinate: number;
      label: string;
    };

export type Space = {
  id: string;
  name: string;
  boundary: Vec2[];
  baseElevation?: number;
  color?: string;
};

export type ObjectKind = "pillar" | "platform" | "step" | "vehicle" | "roof";
export type ObjectRenderStyle = "default" | "solid";

export type BoxHouseObject = {
  id: string;
  name: string;
  type: "box";
  position: Vec3;
  size: Vec3;
  baseElevation?: number;
  renderFoundation?: boolean;
  rotationZ?: number;
  color?: string;
  objectKind?: ObjectKind;
  renderStyle?: ObjectRenderStyle;
  showLabel?: boolean;
  category?: "furniture" | "appliance" | "fixture" | "storage" | "structural" | "custom";
};

export type SlabHouseObject = {
  id: string;
  name: string;
  type: "slab";
  boundary: Vec2[];
  thickness: number;
  baseElevation: number;
  color?: string;
  objectKind?: ObjectKind;
  renderStyle?: ObjectRenderStyle;
  showLabel?: boolean;
  category?: "structural" | "custom";
};

export type ShedRoofHouseObject = {
  id: string;
  name: string;
  type: "shedRoof";
  position: Vec3;
  size: Vec3;
  baseElevation: number;
  rise: number;
  slopeDirection: "x+" | "x-" | "y+" | "y-";
  rotationZ?: number;
  color?: string;
  objectKind?: ObjectKind;
  renderStyle?: ObjectRenderStyle;
  showLabel?: boolean;
  category?: "structural" | "custom";
};

export type HouseObject = BoxHouseObject | SlabHouseObject | ShedRoofHouseObject;

export type Floor = {
  id: string;
  name: string;
  elevation: number;
  defaultWallHeight: number;
  axes?: {
    vertical: AxisDefinition[];
    horizontal: AxisDefinition[];
  };
  walls: Wall[];
  spaces: Space[];
  objects: HouseObject[];
};

export type HouseModel = {
  version: 1;
  units: Unit;
  name: string;
  floors: Floor[];
};

export type ValidationIssue = {
  path: string;
  message: string;
};

const isNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);

const isVec2 = (value: unknown): value is Vec2 => {
  const point = value as Vec2;
  return !!point && isNumber(point.x) && isNumber(point.y);
};

const isVec3 = (value: unknown): value is Vec3 => {
  const point = value as Vec3;
  return !!point && isNumber(point.x) && isNumber(point.y) && isNumber(point.z);
};

export function validateHouseModel(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const model = value as HouseModel;

  if (!model || typeof model !== "object") {
    return [{ path: "model", message: "Model must be an object." }];
  }

  if (model.version !== 1) {
    issues.push({ path: "version", message: "Only schema version 1 is supported." });
  }

  if (model.units !== "cm") {
    issues.push({ path: "units", message: "Only centimeters are supported for now." });
  }

  if (!Array.isArray(model.floors) || model.floors.length === 0) {
    issues.push({ path: "floors", message: "At least one floor is required." });
    return issues;
  }

  const checkId = (id: unknown, path: string, ids: Set<string>) => {
    if (typeof id !== "string" || id.trim().length === 0) {
      issues.push({ path, message: "ID must be a non-empty string." });
      return;
    }
    if (ids.has(id)) {
      issues.push({ path, message: `Duplicate ID "${id}".` });
      return;
    }
    ids.add(id);
  };

  const floorIds = new Set<string>();
  const wallIds = new Set<string>();
  model.floors.forEach((floor, floorIndex) => {
    const floorPath = `floors[${floorIndex}]`;
    const childIds = new Set<string>();
    checkId(floor.id, `${floorPath}.id`, floorIds);
    if (!isNumber(floor.elevation)) {
      issues.push({ path: `${floorPath}.elevation`, message: "Elevation must be a number." });
    }
    if (!isNumber(floor.defaultWallHeight) || floor.defaultWallHeight <= 0) {
      issues.push({
        path: `${floorPath}.defaultWallHeight`,
        message: "Default wall height must be a positive number.",
      });
    }
    if (floor.axes !== undefined) {
      if (!Array.isArray(floor.axes.vertical) || !floor.axes.vertical.every(isAxisDefinition)) {
        issues.push({ path: `${floorPath}.axes.vertical`, message: "Vertical axes must be numbers or labeled axes." });
      }
      if (!Array.isArray(floor.axes.horizontal) || !floor.axes.horizontal.every(isAxisDefinition)) {
        issues.push({ path: `${floorPath}.axes.horizontal`, message: "Horizontal axes must be numbers or labeled axes." });
      }
    }

    floor.walls?.forEach((wall, wallIndex) => {
      const path = `${floorPath}.walls[${wallIndex}]`;
      checkId(wall.id, `${path}.id`, wallIds);
      if (!isVec2(wall.from)) issues.push({ path: `${path}.from`, message: "Wall start must have x and y." });
      if (!isVec2(wall.to)) issues.push({ path: `${path}.to`, message: "Wall end must have x and y." });
      if (isVec2(wall.from) && isVec2(wall.to) && wall.from.x === wall.to.x && wall.from.y === wall.to.y) {
        issues.push({ path, message: "Wall must have a non-zero length." });
      }
      if (!isNumber(wall.height) || wall.height <= 0) {
        issues.push({ path: `${path}.height`, message: "Wall height must be positive." });
      }
      if (wall.baseElevation !== undefined && (!isNumber(wall.baseElevation) || wall.baseElevation < 0)) {
        issues.push({ path: `${path}.baseElevation`, message: "Wall base elevation must be zero or positive." });
      }
      if (wall.renderFoundation !== undefined && typeof wall.renderFoundation !== "boolean") {
        issues.push({ path: `${path}.renderFoundation`, message: "Wall renderFoundation must be a boolean." });
      }
      if (!isNumber(wall.thickness) || wall.thickness <= 0) {
        issues.push({ path: `${path}.thickness`, message: "Wall thickness must be positive." });
      }
      if (
        wall.thicknessSide !== undefined &&
        wall.thicknessSide !== "center" &&
        wall.thicknessSide !== "left" &&
        wall.thicknessSide !== "right"
      ) {
        issues.push({ path: `${path}.thicknessSide`, message: "Wall thickness side must be center, left, or right." });
      }
      if (wall.openings !== undefined) {
        if (!Array.isArray(wall.openings)) {
          issues.push({ path: `${path}.openings`, message: "Wall openings must be an array." });
        } else {
          const wallLength = isVec2(wall.from) && isVec2(wall.to) ? Math.hypot(wall.to.x - wall.from.x, wall.to.y - wall.from.y) : 0;
          wall.openings.forEach((opening, openingIndex) => {
            const openingPath = `${path}.openings[${openingIndex}]`;
            if (!opening || typeof opening !== "object") {
              issues.push({ path: openingPath, message: "Opening must be an object." });
              return;
            }
            if (opening.type !== "window" && opening.type !== "door") {
              issues.push({ path: `${openingPath}.type`, message: "Only window and door openings are supported." });
            }
            if (typeof opening.id !== "string" || opening.id.trim().length === 0) {
              issues.push({ path: `${openingPath}.id`, message: "Opening ID must be a non-empty string." });
            }
            if (!isNumber(opening.offset) || opening.offset < 0) {
              issues.push({ path: `${openingPath}.offset`, message: "Opening offset must be zero or positive." });
            }
            if (!isNumber(opening.length) || opening.length <= 0) {
              issues.push({ path: `${openingPath}.length`, message: "Opening length must be positive." });
            }
            if (!isNumber(opening.baseHeight) || opening.baseHeight < 0) {
              issues.push({ path: `${openingPath}.baseHeight`, message: "Opening base height must be zero or positive." });
            }
            if (!isNumber(opening.height) || opening.height <= 0) {
              issues.push({ path: `${openingPath}.height`, message: "Opening height must be positive." });
            }
            if (
              isNumber(opening.offset) &&
              isNumber(opening.length) &&
              wallLength > 0 &&
              opening.offset + opening.length > wallLength + 0.00001
            ) {
              issues.push({ path: openingPath, message: "Opening must fit within the wall length." });
            }
            if (
              isNumber(opening.baseHeight) &&
              isNumber(opening.height) &&
              isNumber(wall.height) &&
              opening.baseHeight + opening.height > wall.height + 0.00001
            ) {
              issues.push({ path: openingPath, message: "Opening must fit within the wall height." });
            }
          });
        }
      }
    });

    floor.walls?.forEach((wall, wallIndex) => {
      floor.walls.slice(wallIndex + 1).forEach((otherWall, otherOffset) => {
        if (hasPartialCollinearOverlap(wall, otherWall)) {
          issues.push({
            path: `${floorPath}.walls[${wallIndex}]`,
            message: `Wall "${wall.id}" partially overlaps "${otherWall.id}". Use identical edges or separate them.`,
          });
        }
      });
    });

    floor.spaces?.forEach((space, spaceIndex) => {
      const path = `${floorPath}.spaces[${spaceIndex}]`;
      checkId(space.id, `${path}.id`, childIds);
      if (!Array.isArray(space.boundary) || space.boundary.length < 3) {
        issues.push({ path: `${path}.boundary`, message: "Space needs at least three boundary points." });
      } else if (!space.boundary.every(isVec2)) {
        issues.push({ path: `${path}.boundary`, message: "Each boundary point must have x and y." });
      }
      if (space.baseElevation !== undefined && (!isNumber(space.baseElevation) || space.baseElevation < 0)) {
        issues.push({ path: `${path}.baseElevation`, message: "Space base elevation must be zero or positive." });
      }
    });

    floor.objects?.forEach((object, objectIndex) => {
      const path = `${floorPath}.objects[${objectIndex}]`;
      checkId(object.id, `${path}.id`, childIds);
      if (object.type === "box") {
        if (!isVec3(object.position)) {
          issues.push({ path: `${path}.position`, message: "Object position must have x, y, and z." });
        }
        if (!isVec3(object.size) || object.size.x <= 0 || object.size.y <= 0 || object.size.z <= 0) {
          issues.push({ path: `${path}.size`, message: "Object size must have positive x, y, and z." });
        }
        if (object.baseElevation !== undefined && (!isNumber(object.baseElevation) || object.baseElevation < 0)) {
          issues.push({ path: `${path}.baseElevation`, message: "Object base elevation must be zero or positive." });
        }
        if (object.renderFoundation !== undefined && typeof object.renderFoundation !== "boolean") {
          issues.push({ path: `${path}.renderFoundation`, message: "Object renderFoundation must be a boolean." });
        }
      } else if (object.type === "slab") {
        if (!Array.isArray(object.boundary) || object.boundary.length < 3) {
          issues.push({ path: `${path}.boundary`, message: "Slab needs at least three boundary points." });
        } else if (!object.boundary.every(isVec2)) {
          issues.push({ path: `${path}.boundary`, message: "Each slab boundary point must have x and y." });
        }
        if (!isNumber(object.thickness) || object.thickness <= 0) {
          issues.push({ path: `${path}.thickness`, message: "Slab thickness must be positive." });
        }
        if (!isNumber(object.baseElevation)) {
          issues.push({ path: `${path}.baseElevation`, message: "Slab base elevation must be a number." });
        }
      } else if (object.type === "shedRoof") {
        if (!isVec3(object.position)) {
          issues.push({ path: `${path}.position`, message: "Roof position must have x, y, and z." });
        }
        if (!isVec3(object.size) || object.size.x <= 0 || object.size.y <= 0 || object.size.z <= 0) {
          issues.push({ path: `${path}.size`, message: "Roof size must have positive x, y, and z." });
        }
        if (!isNumber(object.baseElevation) || object.baseElevation < 0) {
          issues.push({ path: `${path}.baseElevation`, message: "Roof base elevation must be zero or positive." });
        }
        if (!isNumber(object.rise) || object.rise < 0) {
          issues.push({ path: `${path}.rise`, message: "Roof rise must be zero or positive." });
        }
        if (
          object.slopeDirection !== "x+" &&
          object.slopeDirection !== "x-" &&
          object.slopeDirection !== "y+" &&
          object.slopeDirection !== "y-"
        ) {
          issues.push({
            path: `${path}.slopeDirection`,
            message: "Roof slope direction must be x+, x-, y+, or y-.",
          });
        }
      } else {
        issues.push({ path: `${path}.type`, message: "Only box, slab, and shedRoof objects are supported." });
      }

      if (
        object.objectKind !== undefined &&
        object.objectKind !== "pillar" &&
        object.objectKind !== "platform" &&
        object.objectKind !== "step" &&
        object.objectKind !== "vehicle" &&
        object.objectKind !== "roof"
      ) {
        issues.push({
          path: `${path}.objectKind`,
          message: "Object kind must be pillar, platform, step, vehicle, or roof.",
        });
      }
      if (
        object.renderStyle !== undefined &&
        object.renderStyle !== "default" &&
        object.renderStyle !== "solid"
      ) {
        issues.push({
          path: `${path}.renderStyle`,
          message: "Object render style must be default or solid.",
        });
      }
      if (object.showLabel !== undefined && typeof object.showLabel !== "boolean") {
        issues.push({ path: `${path}.showLabel`, message: "Object showLabel must be a boolean." });
      }
    });
  });

  return issues;
}

function isAxisDefinition(value: unknown): value is AxisDefinition {
  const axis = value as { coordinate?: unknown; label?: unknown };
  return isNumber(value) || (!!axis && isNumber(axis.coordinate) && typeof axis.label === "string" && axis.label.length > 0);
}

function hasPartialCollinearOverlap(a: Wall, b: Wall) {
  const a1 = a.from;
  const a2 = a.to;
  const b1 = b.from;
  const b2 = b.to;
  const adx = a2.x - a1.x;
  const ady = a2.y - a1.y;
  const bdx = b2.x - b1.x;
  const bdy = b2.y - b1.y;
  const crossDirections = adx * bdy - ady * bdx;
  const crossOffset = adx * (b1.y - a1.y) - ady * (b1.x - a1.x);

  if (Math.abs(crossDirections) > 0.00001 || Math.abs(crossOffset) > 0.00001) {
    return false;
  }

  const useX = Math.abs(adx) >= Math.abs(ady);
  const aStart = useX ? a1.x : a1.y;
  const aEnd = useX ? a2.x : a2.y;
  const bStart = useX ? b1.x : b1.y;
  const bEnd = useX ? b2.x : b2.y;
  const aMin = Math.min(aStart, aEnd);
  const aMax = Math.max(aStart, aEnd);
  const bMin = Math.min(bStart, bEnd);
  const bMax = Math.max(bStart, bEnd);
  const overlap = Math.min(aMax, bMax) - Math.max(aMin, bMin);

  if (overlap <= 0.00001) return false;
  const acceptableLap = Math.max(a.thickness, b.thickness) / 2;
  if (overlap <= acceptableLap + 0.00001) return false;

  const aLength = aMax - aMin;
  const bLength = bMax - bMin;
  const sameSpan = Math.abs(aMin - bMin) <= 0.00001 && Math.abs(aMax - bMax) <= 0.00001;

  return !sameSpan && overlap < Math.min(aLength, bLength) - 0.00001;
}
