/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEV_UNLOCK_ROUTES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __DEV__: boolean;
