import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Suspense, useMemo } from 'react';

import type {
  TitanPreviewCameraPreset,
  TitanPreviewModelId,
} from '@/constants/titanPreviewAssets';
import { TitanPreviewWorld } from '@/scenes/titanPreview/TitanPreviewWorld';
import './styles/TitanPreviewCanvas.scss';

type TitanPreviewCanvasProps = {
  modelId: TitanPreviewModelId;
  scale: number;
  activeAnimation: string | null;
  cameraPreset: TitanPreviewCameraPreset;
  onAnimationsReady: (names: string[]) => void;
};

function TitanPreviewCamera({ preset }: { preset: TitanPreviewCameraPreset }) {
  return (
    <PerspectiveCamera
      makeDefault
      position={preset.position}
      fov={60}
      near={0.1}
      far={8000}
    />
  );
}

/**
 * Full-viewport WebGL canvas for Ironwolf titan scale and animation preview.
 */
export function TitanPreviewCanvas({
  modelId,
  scale,
  activeAnimation,
  cameraPreset,
  onAnimationsReady,
}: TitanPreviewCanvasProps) {
  const scaleVector = useMemo(
    () => [scale, scale, scale] as [number, number, number],
    [scale],
  );

  return (
    <div className="titan-preview-canvas">
      <Canvas shadows dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <TitanPreviewCamera key={cameraPreset.id} preset={cameraPreset} />
          <TitanPreviewWorld
            modelId={modelId}
            scale={scaleVector}
            activeAnimation={activeAnimation}
            cameraPreset={cameraPreset}
            onAnimationsReady={onAnimationsReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
