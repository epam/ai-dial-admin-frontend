import WelcomeView from '@/src/components/WelcomeView/WelcomeView';
import { getMenuItems } from '@/src/utils/env/get-menu-items';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <WelcomeView
      disableMenuItems={getMenuItems(process.env.DISABLE_MENU_ITEMS)}
      docLink={process.env.DIAL_ADMIN_DOCUMENTATION}
      dialLink={process.env.DIAL_LINK}
      dialButtonName={process.env.DIAL_LINK_BUTTON_NAME}
    />
  );
}
