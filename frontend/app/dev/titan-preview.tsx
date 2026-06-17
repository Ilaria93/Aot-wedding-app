import { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { TitanPreviewCanvas } from '@/components/titanPreview/TitanPreviewCanvas.web';
import { TitanPreviewDebugPanel } from '@/components/titanPreview/TitanPreviewDebugPanel.web';
import { aotTheme } from '@/constants/aotTheme';
import {
  DEFAULT_TITAN_CAMERA_PRESET_ID,
  DEFAULT_TITAN_SCALE,
  TITAN_PREVIEW_CAMERA_PRESETS,
  type TitanPreviewModelId,
} from '@/constants/titanPreviewAssets';

/**
 * Dev-only Ironwolf titan preview — GLB animations, orbit camera and absurd scale tests.
 */
export default function TitanPreviewScreen() {
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

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          Titan Preview è disponibile solo su web (`/dev/titan-preview`).
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: aotTheme.background,
    minHeight: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: aotTheme.background,
  },
  fallbackText: {
    color: aotTheme.textMuted,
    textAlign: 'center',
    fontSize: 15,
  },
});
