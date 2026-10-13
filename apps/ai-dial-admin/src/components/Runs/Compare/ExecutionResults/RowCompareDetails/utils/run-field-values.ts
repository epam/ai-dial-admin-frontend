import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';

export interface RowDetailRunValue {
  raw: string | null;
  isFailed: boolean;
}

/** The value a row-detail field holds for a run: primary-slot values live on `primary*`, the rest on `secondary*`. */
export const getRowDetailRunValue = (field: RowDetailField, slot: CompareRunSlot): RowDetailRunValue =>
  slot === CompareRunSlot.Primary
    ? { raw: field.primaryRaw, isFailed: field.primaryFailed ?? false }
    : { raw: field.secondaryRaw, isFailed: field.secondaryFailed ?? false };
