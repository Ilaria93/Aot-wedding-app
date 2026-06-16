import {
  isCinematicSceneModelVisible,
  resolveCinematicModelSceneId,
} from '@/utils/sceneModelVisibility';

describe('sceneModelVisibility', () => {
  it('maps countdownTransition to the coupleStrike GLTF slot', () => {
    expect(resolveCinematicModelSceneId('countdownTransition')).toBe('coupleStrike');
  });

  it('keeps scene ids unchanged when they already have a dedicated export', () => {
    expect(resolveCinematicModelSceneId('titanCorridor')).toBe('titanCorridor');
  });

  it('shows only the active scene model entry', () => {
    expect(isCinematicSceneModelVisible('rooftops', 'rooftops')).toBe(true);
    expect(isCinematicSceneModelVisible('titanCorridor', 'rooftops')).toBe(false);
  });

  it('shows the coupleStrike export during countdownTransition', () => {
    expect(isCinematicSceneModelVisible('coupleStrike', 'countdownTransition')).toBe(true);
  });
});
