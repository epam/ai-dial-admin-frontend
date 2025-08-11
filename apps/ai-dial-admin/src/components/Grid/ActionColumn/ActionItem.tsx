import { EntityOperationDeclaration } from '@/src/models/entity-operations';

interface Props<T> {
  entity: T;
  rowIndex: number;
  item: EntityOperationDeclaration<T>;
}

const ActionItem = <T extends object>({ item, entity, rowIndex }: Props<T>) => {
  return (
    <div
      className="text-secondary flex-row flex w-full h-full gap-2 items-center"
      onClick={() => item.onClick(entity, rowIndex)}
    >
      {item.icon}
      <span className="text-primary small">{item.id}</span>
    </div>
  );
};

export default ActionItem;
