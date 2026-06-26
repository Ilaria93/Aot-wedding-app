import { Canvas } from '@react-three/fiber';
import { lazy, Suspense } from 'react';
import { PCFShadowMap } from 'three';

import { useLazyModelPreload } from '@/hooks/useLazyModelPreload';
import type { SceneManagerProps } from '@/types/scene';
import { CinematicCanvasFallback } from '@/scenes/models/CinematicCanvasFallback';
import {
  HERO_CAMERA_FAR,
  HERO_CAMERA_FOV,
  HERO_CAMERA_NEAR,
  HERO_CAMERA_POSITION,
} from '@/cinematic/camera/cameraConfig';

import '@/scenes/models/dracoLoader';
import './styles/HeroCanvas.scss';

const SceneManager = lazy(async () => {
  const module = await import('@/scenes/SceneManager.web');
  return { default: module.SceneManager };
});

type HeroCanvasProps = SceneManagerProps & {
  /** Fades the WebGL layer in after the static cover releases on scroll. */
  canvasOpacity?: number;
};

/**
 * Full-viewport WebGL canvas hosting the cinematic hero scene.
 */
export function HeroCanvas({
  canvasOpacity = 1,
  progress = 0,
  progressRef,
  cameraDebugRef,
  showCameraPathHelpers = false,
}: HeroCanvasProps) {
  useLazyModelPreload(progress);

  return (
    <div className="cinematic-hero__canvas" style={{ opacity: canvasOpacity }}>
      <Canvas
        shadows={{ type: PCFShadowMap }}
        dpr={[1, 1.5]}
        camera={{
          fov: HERO_CAMERA_FOV,
          position: HERO_CAMERA_POSITION,
          near: HERO_CAMERA_NEAR,
          far: HERO_CAMERA_FAR,
        }}
        gl={{ antialias: true, alpha: false }}>
        <Suspense fallback={<CinematicCanvasFallback />}>
          <SceneManager
            progress={progress}
            progressRef={progressRef}
            cameraDebugRef={cameraDebugRef}
            showCameraPathHelpers={showCameraPathHelpers}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
