export enum FormDataType {
  Text = 'text',
}

export interface FormDataPart {
  name: string;
  type: FormDataType;
  value: string;
}
