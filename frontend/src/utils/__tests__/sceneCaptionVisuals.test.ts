import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import { resolveSceneCaptionVisuals } from '@/utils/sceneCaptionVisuals';
import { resolveSceneTimelineState } from '@/utils/sceneTimeline';

describe('resolveSceneCaptionVisuals', () => {
  it('returns rooftop captions mid-scene', () => {
    const state = resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, 0.14);
    const visuals = resolveSceneCaptionVisuals(state);

    expect(visuals.opacity).toBeGreaterThan(0);
    expect(visuals.leftTitleKey).toBe('landing.cinematic.scenes.rooftops.leftTitle');
    expect(visuals.rightTitleKey).toBe('landing.cinematic.scenes.rooftops.rightTitle');
  });

  it('hides captions during countdown transition', () => {
    const state = resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, 0.9);
    const visuals = resolveSceneCaptionVisuals(state);

    expect(visuals.opacity).toBe(0);
    expect(visuals.leftTitleKey).toBeNull();
    expect(visuals.rightTitleKey).toBeNull();
  });

  it('shows impact tagline near couple strike cross', () => {
    const state = resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, 0.82);
    const visuals = resolveSceneCaptionVisuals(state);

    expect(visuals.impactTaglineKey).toBe('landing.cinematic.scenes.coupleStrike.impactTagline');
    expect(visuals.impactTaglineOpacity).toBeGreaterThan(0);
  });
});
