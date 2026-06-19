/** Position spline colors for each camera path segment (dev helpers). */
export const CAMERA_PATH_SEGMENT_COLORS = {
  streetOpening: '#8a9a8e',
  rooftops: '#b88a52',
  giantWalls: '#67a57d',
  titanCorridor: '#5f84bf',
  finalArena: '#cf5d73',
} as const;

/** LookAt spline colors — dimmed tint of each segment color. */
export const CAMERA_PATH_SEGMENT_TARGET_COLORS = {
  streetOpening: 'rgba(138, 154, 142, 0.55)',
  rooftops: 'rgba(184, 138, 82, 0.55)',
  giantWalls: 'rgba(103, 165, 125, 0.55)',
  titanCorridor: 'rgba(95, 132, 191, 0.55)',
  finalArena: 'rgba(207, 93, 115, 0.55)',
} as const;

export type CameraPathSegmentId = keyof typeof CAMERA_PATH_SEGMENT_COLORS;
