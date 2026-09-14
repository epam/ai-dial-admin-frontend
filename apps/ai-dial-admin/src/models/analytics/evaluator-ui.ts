/**
 * Which refinement an llm output declares. The service refuses the two together, and takes neither — but
 * an output that declares neither is a defect on its side, so the console offers no such choice: a
 * transform is the default, and leaving its field empty is what sends nothing.
 */
export enum OutputRefinementKind {
  Values = 'values',
  Jsonata = 'jsonata',
}

/**
 * An output while it is being edited. The wire shape keys outputs by name, which a draft cannot do: two
 * rows may share a name — a collision the editor reports — or carry none at all while being filled in.
 */
export interface OutputRow {
  id: string;
  name: string;
  /** Prose for an `llm` evaluator, the expression for a `sql` one; the type decides which is sent. */
  text: string;
  /** Which of the two refinements is sent; the other keeps what was typed and is left out. */
  refinement: OutputRefinementKind;
  values: string[];
  jsonata: string;
}
