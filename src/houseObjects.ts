export const isPillar = (id: string) => /^p\d+$/.test(id);
export const isGreenPlatformStep = (id: string) => id.startsWith("green-platform-");
export const isGarageStepOrPlatform = (id: string) =>
  id === "garage-platform" || id.startsWith("garage-step-");
export const isGarageCar = (id: string) => id === "garage-car-rav4-prime";

export const isSolidStructuralStep = (id: string) =>
  isGreenPlatformStep(id) || isGarageStepOrPlatform(id) || isGarageCar(id);
