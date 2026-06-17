import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';

import type { TitanPreviewCameraPreset } from '@/constants/titanPreviewAssets';
import type { TitanPreviewModelId } from '@/constants/titanPreviewAssets';
import { TitanPreviewModel } from '@/scenes/titanPreview/TitanPreviewModel';

type TitanPreviewWorldProps = {
  modelId: TitanPreviewModelId;
  scale: [number, number, number];
  activeAnimation: string | null;
  cameraPreset: TitanPreviewCameraPreset;
  onAnimationsReady: (names: string[]) => void;
};

/** Lights, ground reference and orbit-controlled titan for scale validation. */
export function TitanPreviewWorld({
  modelId,
  scale,
  activeAnimation,
  cameraPreset,
  onAnimationsReady,
}: TitanPreviewWorldProps) {
  return (
    <>
      <color attach="background" args={['#b0b0b0']} />
      <ambientLight intensity={0.55} />
      <directionalLight castShadow intensity={1.1} position={[40, 80, 30]} />
      <hemisphereLight args={['#e8e8e8', '#707070', 0.45]} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#7a7a7a" roughness={1} metalness={0} />
      </mesh>

      <mesh receiveShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[4, 0.1, 4]} />
        <meshStandardMaterial color="#9a9a9a" roughness={1} metalness={0} />
      </mesh>

      <Suspense fallback={null}>
        <TitanPreviewModel
          key={modelId}
          modelId={modelId}
          scale={scale}
          activeAnimation={activeAnimation}
          onAnimationsReady={onAnimationsReady}
        />
      </Suspense>

      <OrbitControls
        makeDefault
        target={cameraPreset.target}
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={800}
      />
    </>
  );
}
