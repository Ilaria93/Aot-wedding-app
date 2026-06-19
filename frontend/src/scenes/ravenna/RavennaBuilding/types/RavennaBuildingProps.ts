export type RavennaBuildingProps = {
  /** World position `[x, y, z]`. */
  position?: [number, number, number];
  /** Euler rotation `[x, y, z]` in radians. */
  rotation?: [number, number, number];
  /** Uniform or per-axis scale. */
  scale?: number | [number, number, number];
};

export type RavennaBuildingPlacement = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number | [number, number, number];
};
