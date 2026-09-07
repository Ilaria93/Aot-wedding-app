export type LoginLocationState = {
  from?: string;
  /** Set by the envelope invite page so registration opens with the name already filled in. */
  prefill?: {
    firstName: string;
    lastName: string;
  };
};
