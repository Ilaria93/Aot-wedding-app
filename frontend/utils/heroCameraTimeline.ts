import { CAMERA_PATHS } from '@/src/data/cameraPaths';
import { buildCameraTimelineFromPathDefinitions } from '@/utils/cameraPathEditor';

/** Default hero scroll timeline built from editable camera path definitions. */
export const HERO_CAMERA_TIMELINE = buildCameraTimelineFromPathDefinitions(CAMERA_PATHS);
