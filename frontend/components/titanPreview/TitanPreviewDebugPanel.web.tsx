import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import {
  TITAN_PREVIEW_CAMERA_PRESETS,
  TITAN_PREVIEW_MODEL_LABELS,
  TITAN_SCALE_PRESETS,
  type TitanPreviewModelId,
} from '@/constants/titanPreviewAssets';

type TitanPreviewDebugPanelProps = {
  modelId: TitanPreviewModelId;
  scale: number;
  cameraPresetId: string;
  animationNames: string[];
  activeAnimation: string | null;
  onModelChange: (modelId: TitanPreviewModelId) => void;
  onScaleChange: (scale: number) => void;
  onCameraPresetChange: (presetId: string) => void;
  onAnimationChange: (name: string) => void;
};

/**
 * Dev HUD for TitanPreview — model, scale, camera and animation switching.
 */
export function TitanPreviewDebugPanel({
  modelId,
  scale,
  cameraPresetId,
  animationNames,
  activeAnimation,
  onModelChange,
  onScaleChange,
  onCameraPresetChange,
  onAnimationChange,
}: TitanPreviewDebugPanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Titan Preview</Text>
      <Text style={styles.hint}>Scala assurda + camera al piede = test verità.</Text>

      <Text style={styles.section}>Modello GLB</Text>
      <View style={styles.row}>
        {(Object.keys(TITAN_PREVIEW_MODEL_LABELS) as TitanPreviewModelId[]).map((id) => (
          <Pressable
            key={id}
            style={[styles.chip, modelId === id ? styles.chipActive : null]}
            onPress={() => onModelChange(id)}>
            <Text style={[styles.chipText, modelId === id ? styles.chipTextActive : null]}>
              {TITAN_PREVIEW_MODEL_LABELS[id]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Scala</Text>
      <View style={styles.row}>
        {TITAN_SCALE_PRESETS.map((preset) => (
          <Pressable
            key={preset.id}
            style={[styles.chip, scale === preset.value ? styles.chipActive : null]}
            onPress={() => onScaleChange(preset.value)}>
            <Text style={[styles.chipText, scale === preset.value ? styles.chipTextActive : null]}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Camera</Text>
      <View style={styles.row}>
        {TITAN_PREVIEW_CAMERA_PRESETS.map((preset) => (
          <Pressable
            key={preset.id}
            style={[styles.chip, cameraPresetId === preset.id ? styles.chipActive : null]}
            onPress={() => onCameraPresetChange(preset.id)}>
            <Text
              style={[
                styles.chipText,
                cameraPresetId === preset.id ? styles.chipTextActive : null,
              ]}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>
        Animazioni ({animationNames.length})
      </Text>
      <ScrollView style={styles.animationList} nestedScrollEnabled>
        {animationNames.length === 0 ? (
          <Text style={styles.muted}>Nessuna animazione nel GLB.</Text>
        ) : (
          animationNames.map((name) => (
            <Pressable
              key={name}
              style={[styles.animRow, activeAnimation === name ? styles.animRowActive : null]}
              onPress={() => onAnimationChange(name)}>
              <Text
                style={[
                  styles.animText,
                  activeAnimation === name ? styles.animTextActive : null,
                ]}>
                {name}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 320,
    maxHeight: '88%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 32, 30, 0.92)',
    borderWidth: 1,
    borderColor: aotTheme.border,
    gap: 8,
    zIndex: 10,
  },
  title: {
    color: aotTheme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    color: aotTheme.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  section: {
    color: aotTheme.bronze,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: aotTheme.border,
    backgroundColor: aotTheme.surface,
  },
  chipActive: {
    borderColor: aotTheme.bronze,
    backgroundColor: aotTheme.militaryGreen,
  },
  chipText: {
    color: aotTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: aotTheme.textPrimary,
  },
  animationList: {
    maxHeight: 200,
  },
  animRow: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  animRowActive: {
    backgroundColor: 'rgba(201, 165, 106, 0.22)',
  },
  animText: {
    color: aotTheme.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  animTextActive: {
    color: aotTheme.textPrimary,
    fontWeight: '700',
  },
  muted: {
    color: aotTheme.textMuted,
    fontSize: 12,
  },
});
