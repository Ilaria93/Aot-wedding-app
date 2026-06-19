/** Global scroll progress where the street sequence ends and the first ODM rooftop launch begins. */
export const OPERATION_RAVENNA_GROUND_SPRINT_END = 0.09;

/** Global scroll progress where aerial rooftop traversal ends (existing timeline — do not change). */
export const OPERATION_RAVENNA_ROOFTOPS_END = 0.42;

/** Eye height on the street during the opening (meters). */
export const OPENING_STREET_EYE_HEIGHT = 1.68;

/** Vertical head-bob while walking (meters). */
export const OPENING_WALK_BOB_AMPLITUDE = 0.022;

/** Vertical head-bob while running (meters). */
export const OPENING_RUN_BOB_AMPLITUDE = 0.058;

/** Roll / sway amplitude while running (radians). */
export const OPENING_GROUND_ROLL_AMPLITUDE = 0.016;

/** Lateral look-target sway while running (meters). */
export const OPENING_GROUND_SWAY_AMPLITUDE = 0.14;

/** End of the brief walking beat within the street opening (local progress 0–1). */
export const OPENING_WALK_PHASE_END = 0.24;

/** End of the running beat — after this the trio accelerates into the hook (local progress 0–1). */
export const OPENING_RUN_PHASE_END = 0.62;

/** Global progress window where ODM handles and cables fade in after the first hook. */
export const OPENING_ODM_GEAR_REVEAL_END = 0.105;

/** Squad choreography progress at the first ODM hook (keyframes align from here). */
export const OPENING_SQUAD_HOOK_CHOREOGRAPHY = 0.22;
