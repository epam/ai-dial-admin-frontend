import { EntitiesI18nKey } from '@/src/constants/i18n';
import { Token } from '@/src/models/auth';
import { getConfigEntityOptions } from '@/src/server/config-entities/read';
import { errorLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';

export interface PluginOptions {
  options: string[];
  error?: EntitiesI18nKey;
}

export async function readPluginOptions(token: Token): Promise<PluginOptions> {
  try {
    const result = await getConfigEntityOptions(token, ConfigFileEntityType.Plugins);
    if (!result.success) {
      errorLog(`Failed to read plugin options from Core: ${result.failure.errorMessage ?? ''}`);
      return { options: [], error: EntitiesI18nKey.OptionListUnavailable };
    }

    const options = result.data.options.map((option) => option.name);
    if (result.data.failures.length) {
      result.data.failures.forEach((failure) => {
        errorLog(`Partial plugin option read from Core: ${failure.reason} ${failure.errorMessage ?? ''}`);
      });
      return { options, error: EntitiesI18nKey.OptionListPartial };
    }

    return { options };
  } catch (error) {
    errorLog(`Failed to read plugin options from Core: ${error instanceof Error ? error.message : String(error)}`);
    return { options: [], error: EntitiesI18nKey.OptionListUnavailable };
  }
}
