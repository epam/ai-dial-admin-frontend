import { useSession } from 'next-auth/react';

import { Avatar } from '@epam/ai-dial-ui-kit';

export const UserIcon = () => {
  const { data: session } = useSession();

  return <Avatar name={session?.user?.name ?? ''} src={session?.user?.image ?? undefined} size={24} />;
};
