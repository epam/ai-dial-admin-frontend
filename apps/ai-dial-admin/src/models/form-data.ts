export enum FormDataType {
  Text = 'text',
  File = 'file',
  Skill = 'skill',
}

export interface FormDataPart {
  name: string;
  type: FormDataType;
  value: string;
}
