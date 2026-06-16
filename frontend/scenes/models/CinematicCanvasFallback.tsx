import { aotTheme } from '@/constants/aotTheme';
import { SceneGltfLoadingFallback } from '@/scenes/models/SceneGltfLoadingFallback';

/**
 * Canvas-level suspense fallback while the 3D scene graph is loading.
 */
export function CinematicCanvasFallback() {
  return (
    <group name="cinematic-canvas-fallback">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]}>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color={aotTheme.cinematicBackground} roughness={1} />
      </mesh>
      <SceneGltfLoadingFallback label="canvas" />
    </group>
  );
}
