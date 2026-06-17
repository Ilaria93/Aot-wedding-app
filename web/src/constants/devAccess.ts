/** When true, protected routes stay accessible without login during local previs. */
export const DEV_UNLOCK_ALL_ROUTES =
  import.meta.env.VITE_DEV_UNLOCK_ROUTES !== 'false' && import.meta.env.DEV;
