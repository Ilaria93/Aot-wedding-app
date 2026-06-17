/** Placeholder hero environment identifiers. */
export type HeroEnvironmentId =
  | 'rooftopsDistrict'
  | 'giantWalls'
  | 'titanCorridor'
  | 'finalArena';

export type HeroEnvironmentProps = {
  /** When false the environment is hidden to avoid unnecessary draw calls. */
  visible: boolean;
};

export type HeroEnvironmentAtmosphere = {
  background: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  hemisphereSky: string;
  hemisphereGround: string;
};

export type HeroEnvironmentChapter = {
  id: HeroEnvironmentId;
  start: number;
  end: number;
  atmosphere: HeroEnvironmentAtmosphere;
};
