import {
  TITAN_PREVIEW_CAMERA_PRESETS,
  TITAN_PREVIEW_MODEL_LABELS,
  TITAN_SCALE_PRESETS,
  type TitanPreviewModelId,
} from '@/constants/titanPreviewAssets';
import './styles/TitanPreviewDebugPanel.scss';

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
    <aside className="titan-preview-panel">
      <h1 className="titan-preview-panel__title">Titan Preview</h1>
      <p className="titan-preview-panel__hint">Scala assurda + camera al piede = test verità.</p>

      <p className="titan-preview-panel__section">Modello GLB</p>
      <div className="titan-preview-panel__row">
        {(Object.keys(TITAN_PREVIEW_MODEL_LABELS) as TitanPreviewModelId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`titan-preview-panel__chip${modelId === id ? ' is-active' : ''}`}
            onClick={() => onModelChange(id)}>
            {TITAN_PREVIEW_MODEL_LABELS[id]}
          </button>
        ))}
      </div>

      <p className="titan-preview-panel__section">Scala</p>
      <div className="titan-preview-panel__row">
        {TITAN_SCALE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`titan-preview-panel__chip${scale === preset.value ? ' is-active' : ''}`}
            onClick={() => onScaleChange(preset.value)}>
            {preset.label}
          </button>
        ))}
      </div>

      <p className="titan-preview-panel__section">Camera</p>
      <div className="titan-preview-panel__row">
        {TITAN_PREVIEW_CAMERA_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`titan-preview-panel__chip${cameraPresetId === preset.id ? ' is-active' : ''}`}
            onClick={() => onCameraPresetChange(preset.id)}>
            {preset.label}
          </button>
        ))}
      </div>

      <p className="titan-preview-panel__section">Animazioni ({animationNames.length})</p>
      <div className="titan-preview-panel__animation-list">
        {animationNames.length === 0 ? (
          <p className="titan-preview-panel__muted">Nessuna animazione nel GLB.</p>
        ) : (
          animationNames.map((name) => (
            <button
              key={name}
              type="button"
              className={`titan-preview-panel__anim-row${activeAnimation === name ? ' is-active' : ''}`}
              onClick={() => onAnimationChange(name)}>
              {name}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
