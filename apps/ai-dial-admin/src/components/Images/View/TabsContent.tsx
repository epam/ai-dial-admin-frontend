'use client';

import { DialLabelledText } from '@epam/ai-dial-ui-kit';
import { FC, useMemo } from 'react';

import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import ImageFields from '@/src/components/Images/Fields/ImageFields';
import Containers from '@/src/components/Images/View/Containers/Containers';
import FirewallSettings from '@/src/components/Images/View/FirewallSettings/FirewallSettings';
import InstallationLog from '@/src/components/Images/View/InstallationLog/InstallationLog';
import { IMAGE_TYPE_I18N_KEYS, SOURCE_TYPES } from '@/src/constants/deployments/images';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  activeTab: EntityViewTab;
  selectedImage: Image;
  imageVersions: ImageVersion[];
  onChange: (image: Image) => void;
  onChangeVersions: (versions: ImageVersion[]) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedImage, onChange, onChangeVersions, imageVersions }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const sourcesList = SOURCE_TYPES(t);

  const headerPrefix = useMemo(() => {
    return <DialLabelledText label={t(EntityFieldsI18nKey.type)} text={t(IMAGE_TYPE_I18N_KEYS[selectedImage.$type])} />;
  }, [selectedImage.$type, t]);

  const headerPostfix = useMemo(() => {
    return (
      <>
        <DialLabelledText
          label={t(EntitiesI18nKey.SourceType)}
          text={sourcesList?.find((source) => source.value === selectedImage.source.$type)?.label}
        />
        <DialLabelledText label={t(EntityFieldsI18nKey.status)}>
          <StatusIndicator status={selectedImage.buildStatus} />
        </DialLabelledText>
      </>
    );
  }, [selectedImage.buildStatus, selectedImage.source.$type, sourcesList, t]);

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent
          entity={selectedImage}
          view={ApplicationRoute.Images}
          id={selectedImage.id}
          headerPrefix={headerPrefix}
          headerPostfix={headerPostfix}
        >
          <ImageFields image={selectedImage} setImage={onChange} setImageVersions={onChangeVersions} />
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.RelatedContainers && (
        <Containers
          image={selectedImage}
          route={ApplicationRoute.Images}
          versions={imageVersions}
          disabled={isReadOnlyAdmin}
        />
      )}
      {activeTab === EntityViewTab.InstallationLog && <InstallationLog imageBuildId={selectedImage.id} />}
      {activeTab === EntityViewTab.Firewall && (
        <FirewallSettings
          image={selectedImage}
          setImage={onChange}
          route={ApplicationRoute.Images}
          disabled={isReadOnlyAdmin}
        />
      )}
    </>
  );
};

export default TabsContent;
