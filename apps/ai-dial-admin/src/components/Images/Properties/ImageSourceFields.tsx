import React, { FC, useState } from 'react';
import { DialSelectField, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getSourcesTypes } from '@/src/utils/deployments/images';
import { IMAGE_SOURCE_TYPE } from '@/src/types/deployments/images';
import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { getDeploymentsURIError, getDeploymentsURLError } from '@/src/utils/deployments/validation';
import { Image } from '@/src/models/deployments/images';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  route: ApplicationRoute;
}

const ImageSourceFields: FC<Props> = ({ image, setImage, route }) => {
  const t = useI18n();

  const [sourceError, setSourceError] = useState<FieldError | null>(null);

  const sourcesList = getSourcesTypes(t);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4">
        {route === ApplicationRoute.McpDeployments && (
          <div className="max-w-fit">
            <div className="flex flex-row gap-4">
              <div className="min-w-[150px]">
                <DialSelectField
                  elementId="sourceType"
                  value={image.source.$type}
                  options={sourcesList}
                  fieldTitle={t(EntitiesI18nKey.SourceType)}
                  onChange={(sourceId) => {
                    const selectedSource = sourcesList.find((source) => source.value === sourceId) || sourcesList[0];

                    setImage({
                      ...image,
                      source: {
                        ...image.source,
                        $type: selectedSource.value as IMAGE_SOURCE_TYPE,
                      },
                    });
                  }}
                  optional={false}
                />
              </div>
            </div>
          </div>
        )}
        <div className="flex-1">
          {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && route === ApplicationRoute.McpDeployments && (
            <DialTextInputField
              fieldTitle={t(EntityFieldsI18nKey.SourceURL)}
              elementId="url"
              placeholder={t(EntityPlaceholdersI18nKey.URL)}
              value={image.source.url}
              errorText={sourceError?.text}
              invalid={!!sourceError}
              disabled={false}
              onChange={(url?: string) => {
                setSourceError(getDeploymentsURLError(url as string, t));
                setImage({
                  ...image,
                  source: {
                    ...image.source,
                    url,
                  },
                });
              }}
            />
          )}
          {image.source?.$type === IMAGE_SOURCE_TYPE.DOCKER && (
            <DialTextInputField
              fieldTitle={t(EntityFieldsI18nKey.ImageURI)}
              elementId="uri"
              placeholder={t(EntityPlaceholdersI18nKey.URI)}
              value={image.source.imageUri}
              errorText={sourceError?.text}
              invalid={!!sourceError}
              disabled={false}
              onChange={(imageUri?: string) => {
                setSourceError(getDeploymentsURIError(imageUri as string, t));
                setImage({
                  ...image,
                  source: {
                    ...image.source,
                    imageUri,
                  },
                });
              }}
            />
          )}
        </div>
      </div>
      {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <DialTextInputField
                fieldTitle={t(EntityFieldsI18nKey.BranchName)}
                elementId="branch"
                placeholder={t(EntityPlaceholdersI18nKey.Branch)}
                value={image.source.branchName}
                disabled={false}
                optional={true}
                onChange={(branchName?: string) => {
                  setImage({
                    ...image,
                    source: {
                      ...image.source,
                      branchName,
                    },
                  });
                }}
              />
            </div>
            <div className="flex-1">
              <DialTextInputField
                fieldTitle={t(EntityFieldsI18nKey.SHA)}
                elementId="SHA"
                placeholder={t(EntityPlaceholdersI18nKey.SHA)}
                value={image.source.sha}
                disabled={false}
                optional={true}
                onChange={(sha?: string) => {
                  setImage({
                    ...image,
                    source: {
                      ...image.source,
                      sha,
                    },
                  });
                }}
              />
            </div>
          </div>
          <div className="flex">
            <DialTextInputField
              fieldTitle={t(EntityFieldsI18nKey.BaseDirectory)}
              elementId="baseDirectory"
              placeholder={t(EntityPlaceholdersI18nKey.BaseDirectory)}
              value={image.source.baseDirectory}
              disabled={false}
              optional={true}
              onChange={(baseDirectory?: string) => {
                setImage({
                  ...image,
                  source: {
                    ...image.source,
                    baseDirectory,
                  },
                });
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ImageSourceFields;
