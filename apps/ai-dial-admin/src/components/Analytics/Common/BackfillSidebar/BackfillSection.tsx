import { FC, ReactNode, useId } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

/**
 * One of the drawer's three blocks, on a background a step lighter than the panel's (`layer-3`) so the blocks read
 * apart without borders. `layer-4` is the lightest step, so a row inside takes `layer-3` for hover and selection.
 */
const BackfillSection: FC<Props> = ({ title, children }) => {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-y-4 rounded-lg bg-layer-4 p-4">
      <h3 id={headingId} className="text-primary">
        {title}
      </h3>
      {children}
    </section>
  );
};

export default BackfillSection;
