import { FC } from 'react';

interface Props {
  beVersion: string | null;
}

const Footer: FC<Props> = ({ beVersion }) => {
  return (
    <div className="hidden lg:flex absolute bottom-0 right-0 caption text-right pr-4 pb-1">
      <span className="mr-1">FE: {process.env.NEXT_PUBLIC_APP_VERSION}</span>
      <span>BE: {beVersion}</span>
    </div>
  );
};

export default Footer;
