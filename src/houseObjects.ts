import type { HouseObject } from "./model";

export function isPillarObject(object: HouseObject) {
  return object.objectKind === "pillar";
}

export function isSolidObject(object: HouseObject) {
  return object.renderStyle === "solid";
}

export function shouldShowObjectLabel(object: HouseObject) {
  return object.showLabel === true;
}
