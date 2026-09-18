/**
 * Which generation of the design system the trigger should look like. The control itself is shared,
 * so the caller states the generation of the surface it sits on; `Legacy` keeps every existing call
 * site unchanged.
 */
export enum TimeFilterAppearance {
  Legacy = 'legacy',
  Modern = 'modern',
}
