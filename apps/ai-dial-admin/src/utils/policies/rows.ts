import { DialFileNodeType } from '@/src/models/dial/file';

interface ListedRow {
  path: string;
  nodeType?: DialFileNodeType;
}

/** The paths of the records in a listing: a cost object folder row is a folder, not a policy to pick. */
export const getItemPaths = (rows: ListedRow[]): string[] =>
  rows.filter((row) => row.nodeType === DialFileNodeType.ITEM).map((row) => row.path);
