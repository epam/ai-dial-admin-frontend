import { SchemaTreeNode } from '@/src/components/Common/SchemaGrid/utils';
import { JsonAtaI18nKey } from '@/src/constants/i18n';
import { JSONSchema7 } from 'json-schema';

export interface DocumentationGridSection {
  titleKey: JsonAtaI18nKey;
  buildRows: (schema: JSONSchema7) => DocumentationRow[];
}

export interface DocumentationRow {
  useCase: string;
  expression: string;
  resultType: string;
}

export interface CategorizedFields {
  simpleFields: SchemaTreeNode[];
  objectFields: SchemaTreeNode[];
  arrayFields: SchemaTreeNode[];
  stringFields: FlatField[];
  numberFields: FlatField[];
  nestedPaths: { path: string; type: string }[];
}

interface FlatField {
  path: string;
  name: string;
  type: string;
}
