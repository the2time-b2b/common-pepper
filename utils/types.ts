/** Atleast one of the task parameter should be defined. */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> =
  Partial<T> & U[keyof U];
