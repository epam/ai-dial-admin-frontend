export enum FormDataType {
  Text = 'text',
  File = 'file',
}

export interface FormDataPart {
  name: string;
  type: FormDataType;
  value: string;
}
