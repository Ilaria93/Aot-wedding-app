/** Global scroll progress where the street sprint ends and the first ODM rooftop launch begins. */
export const OPERATION_RAVENNA_GROUND_SPRINT_END = 0.06;

/** Global scroll progress where aerial rooftop ODM traversal ends. */
export const OPERATION_RAVENNA_ROOFTOPS_END = 0.52;

/** Global scroll progress where the giant-wall approach segment ends. */
export const OPERATION_RAVENNA_WALLS_APPROACH_END = 0.61;

/** Global scroll progress where the wall-launch segment ends. */
export const OPERATION_RAVENNA_WALL_LAUNCH_END = 0.67;

/** Global scroll progress where the titan corridor segment ends. */
export const OPERATION_RAVENNA_TITAN_CORRIDOR_END = 0.84;

/** Local aerial progress (0–1) through which the first hook launch tuning stays active. */
export const OPENING_FIRST_ODM_LAUNCH_AERIAL_END = 0.32;

/** Share of rooftop scroll spent on the initial vertical hook (readable lift above roofs). */
export const OPENING_AERIAL_LAUNCH_SCROLL_SHARE = 0.38;

/** Share of the aerial path covered during the initial hook window. */
export const OPENING_AERIAL_LAUNCH_PATH_SHARE = 0.24;

/** Eye height while sprinting on the street (meters) — low, heroic angle. */
export const OPENING_SPRINT_EYE_HEIGHT = 1.46;

/** Eye height on the street during the opening (meters). */
export const OPENING_STREET_EYE_HEIGHT = OPENING_SPRINT_EYE_HEIGHT;

/** Vertical head-bob while walking (meters). */
export const OPENING_WALK_BOB_AMPLITUDE = 0.022;

/** Vertical head-bob while running (meters). */
export const OPENING_RUN_BOB_AMPLITUDE = 0.078;

/** Roll / sway amplitude while running (radians). */
export const OPENING_GROUND_ROLL_AMPLITUDE = 0.022;

/** Lateral look-target sway while running (meters). */
export const OPENING_GROUND_SWAY_AMPLITUDE = 0.18;

/** Walking beat disabled — opening starts in a full sprint from the outskirts. */
export const OPENING_WALK_PHASE_END = 0;

/** End of steady sprint — last beats surge into the hook (local progress 0–1). */
export const OPENING_RUN_PHASE_END = 0.58;

/** Global progress when ODM handles and cables begin to appear (late sprint, entering city). */
export const OPENING_ODM_GEAR_REVEAL_START = 0.038;

/** Global progress window where ODM gear reaches full opacity. */
export const OPENING_ODM_GEAR_REVEAL_END = 0.055;

/** Squad choreography progress at the first ODM hook (keyframes align from here). */
export const OPENING_SQUAD_HOOK_CHOREOGRAPHY = 0.22;
