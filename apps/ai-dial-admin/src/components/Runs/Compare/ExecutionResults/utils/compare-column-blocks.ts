import { ColDef, ColGroupDef } from 'ag-grid-community';

import { EXECUTION_GROUP_HEADER } from '@/src/components/Runs/Compare/ExecutionResults/constants';

const isGroup = (column: ColDef | ColGroupDef): column is ColGroupDef =>
  Array.isArray((column as ColGroupDef).children);

const leafId = (column: ColDef): string | undefined => column.colId ?? column.field;

/**
 * Blocks that move together: status, each metric (run 1, run 2, delta), and each extracted field.
 * The execution group is one flat list of different fields, so it is not a block.
 */
export const collectCompareColumnBlocks = (columnDefs: (ColDef | ColGroupDef)[] | undefined): string[][] => {
  const blocks: string[][] = [];

  const visit = (nodes: (ColDef | ColGroupDef)[]) => {
    for (const node of nodes) {
      if (!isGroup(node) || node.headerName === EXECUTION_GROUP_HEADER) {
        continue;
      }

      const children = node.children as (ColDef | ColGroupDef)[];
      if (children.some(isGroup)) {
        visit(children);
        continue;
      }

      const ids = children.map(leafId).filter((id): id is string => Boolean(id));
      if (ids.length > 1) {
        blocks.push(ids);
      }
    }
  };

  visit(columnDefs ?? []);
  return blocks;
};

const placeBlock = (order: string[], block: string[], movedIds: ReadonlySet<string>): string[] => {
  const members = block.filter((id) => order.includes(id));
  if (members.length < 2) {
    return order;
  }

  const indexOf = (id: string) => order.indexOf(id);
  const start = Math.min(...members.map(indexOf));
  const intact = members.every((id, index) => order[start + index] === id);
  if (intact) {
    return order;
  }

  const moved = members.filter((id) => movedIds.has(id));
  const anchorId = (moved.length ? moved : members).reduce((left, id) => (indexOf(id) < indexOf(left) ? id : left));
  const nonMembersBefore = order.slice(0, indexOf(anchorId)).filter((id) => !members.includes(id)).length;
  const without = order.filter((id) => !members.includes(id));
  without.splice(nonMembersBefore, 0, ...members);
  return without;
};

/** Puts every block back into one contiguous span, in its original column order, at the drop. */
export const orderWithCompareBlocksIntact = (
  order: string[],
  blocks: string[][],
  movedIds: ReadonlySet<string>,
): string[] => blocks.reduce((next, block) => placeBlock(next, block, movedIds), order);
