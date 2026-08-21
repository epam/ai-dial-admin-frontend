/** A variable in scope for a JSONata expression, named without its leading `$`. */
export interface JsonataVariable {
  name: string;
  description?: string;
}
