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
  const isEstablishing = progress <= 0;
  const streetT =
    progress <= 0
      ? 0
      : Math.min(1, progress / OPERATION_RAVENNA_GROUND_SPRINT_END);
  const aerialT =
    progress <= OPERATION_RAVENNA_GROUND_SPRINT_END
      ? 0
      : Math.min(
          1,
          (progress - OPERATION_RAVENNA_GROUND_SPRINT_END) /
            (OPERATION_RAVENNA_ROOFTOPS_END - OPERATION_RAVENNA_GROUND_SPRINT_END),
        );

  const fogNear = isEstablishing ? 18 : 28 + streetT * 8 + aerialT * 18;
  const fogFar = isEstablishing ? 72 : 95 + streetT * 22 + aerialT * 55;

  return (
    <>
      <color attach="background" args={[GRAYBOX_PALETTE.morningSky]} />
      <fog attach="fog" args={[GRAYBOX_PALETTE.morningFog, fogNear, fogFar]} />
      <ambientLight intensity={isEstablishing ? 0.42 : 0.48} color="#e0e4de" />
      <hemisphereLight
        args={[GRAYBOX_PALETTE.morningSkyLow, '#6e7868', isEstablishing ? 0.5 : 0.42]}
      />
      <directionalLight
        castShadow={isEstablishing}
        position={isEstablishing ? [22, 34, 18] : [14, 38, 22]}
        intensity={isEstablishing ? 0.72 : 0.35 + streetT * 0.12}
        color={isEstablishing ? '#ffd9a8' : '#ffe8cc'}
        shadow-mapSize={isEstablishing ? [2048, 2048] : [1024, 1024]}
        shadow-camera-far={isEstablishing ? 120 : 80}
        shadow-camera-left={isEstablishing ? -30 : -20}
        shadow-camera-right={isEstablishing ? 30 : 20}
        shadow-camera-top={isEstablishing ? 40 : 20}
        shadow-camera-bottom={isEstablishing ? -4 : -2}
      />
      {isEstablishing ? (
        <directionalLight position={[-16, 20, -8]} intensity={0.18} color="#b8c8e0" />
      ) : null}
    </>
  );
}
