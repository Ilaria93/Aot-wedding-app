import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import {
  OPERATION_RAVENNA_GROUND_SPRINT_END,
  OPERATION_RAVENNA_ROOFTOPS_END,
} from '@/constants/operationRavennaOpening';

type GrayboxHeroAtmosphereProps = {
  /** Global hero scroll progress in the range [0, 1]. */
  progress?: number;
};

/** Anime establishing-shot lighting — warm morning key, cool sky, depth fog. */
export function GrayboxHeroAtmosphere({ progress = 0 }: GrayboxHeroAtmosphereProps) {
  const streetT = Math.min(1, Math.max(0, progress) / OPERATION_RAVENNA_GROUND_SPRINT_END);
  const aerialT =
    progress <= OPERATION_RAVENNA_GROUND_SPRINT_END
      ? 0
      : Math.min(
          1,
          (progress - OPERATION_RAVENNA_GROUND_SPRINT_END) /
            (OPERATION_RAVENNA_ROOFTOPS_END - OPERATION_RAVENNA_GROUND_SPRINT_END),
        );

  const fogNear = 38 + streetT * 8 + aerialT * 18;
  const fogFar = 130 + streetT * 24 + aerialT * 55;

  return (
    <>
      <color attach="background" args={[GRAYBOX_PALETTE.morningSky]} />
      <fog attach="fog" args={[GRAYBOX_PALETTE.morningFog, fogNear, fogFar]} />
      <ambientLight intensity={0.44 + streetT * 0.04} color="#e0e4de" />
      <hemisphereLight
        args={[GRAYBOX_PALETTE.morningSkyLow, '#6e7868', 0.48 - streetT * 0.06]}
      />
      <directionalLight
        castShadow
        position={[22, 34, 18]}
        intensity={0.68 + streetT * 0.1}
        color="#ffd9a8"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={40}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-16, 20, -8]} intensity={0.16} color="#b8c8e0" />
    </>
  );
}
