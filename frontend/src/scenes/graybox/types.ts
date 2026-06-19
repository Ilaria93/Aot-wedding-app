/** Shared graybox geometry specs for Operation Ravenna previs. */
export type GrayboxTone = 'structure' | 'structureAlt' | 'structureDark';

export type GrayboxBoxSpec = {
  position: [number, number, number];
  size: [number, number, number];
  tone: GrayboxTone;
};

export type GrayboxRooftopShape = 'box' | 'stepped' | 'lShape' | 'tower';

export type GrayboxBuildingSpec = GrayboxBoxSpec & {
  id: string;
  shape: GrayboxRooftopShape;
  roofTone: 'clay' | 'darkClay';
};

export type GrayboxRooftopFeatureKind = 'chimney' | 'roofWindow' | 'bellTower' | 'courtyard';

export type GrayboxRooftopFeatureSpec = {
  id: string;
  kind: GrayboxRooftopFeatureKind;
  position: [number, number, number];
  size: [number, number, number];
  rotationY?: number;
};

export type GrayboxStreetSpec = {
  position: [number, number, number];
  size: [number, number];
};

/** Flight corridor strip aligned with the rooftops camera path. */
export type GrayboxCorridorStripSpec = {
  position: [number, number, number];
  size: [number, number];
  rotationY: number;
};

export type GrayboxTitanSilhouetteSpec = {
  id: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
  armSpread: number;
  torsoLean: number;
};

export type GrayboxWallSpec = {
  position: [number, number, number];
  size: [number, number, number];
};

/** @deprecated Corridor uses humanoid silhouettes instead of capsules. */
export type GrayboxCapsuleSpec = {
  position: [number, number, number];
  radius: number;
  length: number;
  rotation: [number, number, number];
};
