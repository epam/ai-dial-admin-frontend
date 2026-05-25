import { ColumnGroupId } from '@/src/components/Runs/Export/utils/group-columns';

export interface ColumnItem {
  name: string;
  displayName: string;
  defaultChecked: boolean;
  subGroup?: string;
}

export interface ColumnGroup {
  id: ColumnGroupId;
  columns: ColumnItem[];
}

export interface Props {
  runId: string;
  onClose: () => void;
}
