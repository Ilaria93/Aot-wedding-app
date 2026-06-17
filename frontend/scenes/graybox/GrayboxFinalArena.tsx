import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import { getGrayboxToneColor } from '@/scenes/graybox/GrayboxMeshMaterials';
import {
  GRAYBOX_ARENA_MARKERS,
  GRAYBOX_ARENA_PLATFORM,
} from '@/scenes/graybox/grayboxLayout';

/** Graybox final arena — large open platform at the end of the flight path. */
export function GrayboxFinalArena() {
  return (
    <group name="graybox-final-arena">
      <mesh castShadow receiveShadow position={GRAYBOX_ARENA_PLATFORM.position}>
        <boxGeometry args={GRAYBOX_ARENA_PLATFORM.size} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.platform} roughness={1} metalness={0} />
      </mesh>

      {GRAYBOX_ARENA_MARKERS.map((marker) => (
        <mesh
          key={marker.position.join('-')}
          castShadow
          position={marker.position}>
          <boxGeometry args={marker.size} />
          <meshStandardMaterial
            color={getGrayboxToneColor(marker.tone)}
            roughness={1}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}
