import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { TitanPreviewCanvas } from '@/components/titanPreview/TitanPreviewCanvas';
import { TitanPreviewDebugPanel } from '@/components/titanPreview/TitanPreviewDebugPanel';
import {
  DEFAULT_TITAN_CAMERA_PRESET_ID,
  DEFAULT_TITAN_SCALE,
  TITAN_PREVIEW_CAMERA_PRESETS,
  type TitanPreviewModelId,
} from '@/constants/titanPreviewAssets';
import './styles/TitanPreviewPage.scss';

/**
 * Dev-only Ironwolf titan preview — GLB animations, orbit camera and absurd scale tests.
 */
export function TitanPreviewPage() {
  const [modelId, setModelId] = useState<TitanPreviewModelId>('mergedAnimations');
  const [scale, setScale] = useState(DEFAULT_TITAN_SCALE);
  const [cameraPresetId, setCameraPresetId] = useState(DEFAULT_TITAN_CAMERA_PRESET_ID);
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);

  const cameraPreset = useMemo(
    () =>
      TITAN_PREVIEW_CAMERA_PRESETS.find((preset) => preset.id === cameraPresetId) ??
      TITAN_PREVIEW_CAMERA_PRESETS[0],
    [cameraPresetId],
  );

  const handleAnimationsReady = useCallback((names: string[]) => {
    setAnimationNames(names);
    setActiveAnimation((current) => current ?? names[0] ?? null);
  }, []);

  if (!import.meta.env.DEV) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="titan-preview-page">
      <TitanPreviewCanvas
        modelId={modelId}
        scale={scale}
        activeAnimation={activeAnimation}
        cameraPreset={cameraPreset}
        onAnimationsReady={handleAnimationsReady}
      />

      <TitanPreviewDebugPanel
        modelId={modelId}
        scale={scale}
        cameraPresetId={cameraPresetId}
        animationNames={animationNames}
        activeAnimation={activeAnimation}
        onModelChange={setModelId}
        onScaleChange={setScale}
        onCameraPresetChange={setCameraPresetId}
        onAnimationChange={setActiveAnimation}
      />

      <Link className="titan-preview-page__back" to="/">
        ← Home
      </Link>
    </div>
  );
}
