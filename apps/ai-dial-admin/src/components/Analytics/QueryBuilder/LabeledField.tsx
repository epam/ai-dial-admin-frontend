import { FC, ReactNode } from 'react';

interface Props {
  title: string;
  pill?: string;
  children: ReactNode;
}

const LabeledField: FC<Props> = ({ title, pill, children }) => (
  <section className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <h3 className="dial-small-semi text-primary">{title}</h3>
      {pill && (
        <span className="rounded bg-layer-4 px-2 py-0.5 font-mono uppercase text-secondary dial-tiny-text">{pill}</span>
      )}
    </div>
    {children}
  </section>
);

export default LabeledField;
