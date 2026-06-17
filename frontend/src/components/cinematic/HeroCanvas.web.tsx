import { Canvas } from '@react-three/fiber';
import { lazy, Suspense } from 'react';
import { StyleSheet, View } from 'react-native';
import { PCFShadowMap } from 'three';

import type { SceneManagerProps } from '@/types/scene';
import { CinematicCanvasFallback } from '@/scenes/models/CinematicCanvasFallback';
import { preloadCinematicModels } from '@/scenes/models/preloadCinematicModels';
import {
  HERO_CAMERA_FAR,
  HERO_CAMERA_FOV,
  HERO_CAMERA_NEAR,
  HERO_CAMERA_POSITION,
} from '@/utils/cameraConfig';

import '@/scenes/models/dracoLoader';

preloadCinematicModels();

const SceneManager = lazy(async () => {
  const module = await import('@/scenes/SceneManager.web');
  return { default: module.SceneManager };
});

type HeroCanvasProps = SceneManagerProps;

/**
 * Full-viewport WebGL canvas hosting the cinematic hero scene (web only).
 */
export function HeroCanvas({
  progress = 0,
  progressRef,
  cameraDebugRef,
  showCameraPathHelpers = false,
}: HeroCanvasProps) {
  return (
    <View style={styles.root}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
