/**
 * The one size every Analytics chip shares, so a status pill and an identity tag side by side are the same
 * height. `w-fit` keeps a chip to its label where a flex-column parent, such as a grid cell's wrapper, would
 * otherwise stretch it.
 */
export const CHIP_CLASS =
  'inline-flex w-fit shrink-0 items-center whitespace-nowrap px-2 py-0.5 uppercase font-semibold dial-tiny-text';
