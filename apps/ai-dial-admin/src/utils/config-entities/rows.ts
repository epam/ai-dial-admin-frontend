import { ConfigEntityOption, ConfigEntityRow } from '@/src/models/dial/config-file';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getConfigEntityReference } from '@/src/utils/config-entities/options';

/**
 * Adapts options to the `BaseEntity` rows the shared pickers render.
 *
 * `name` carries the *reference*, not the bare name. The pickers match a stored selection with
 * `entity.name === selected` (`getInterceptorsGridData`), and Core stores an API-written entity's
 * canonical id — so putting the bare name here would leave such a selection permanently unmatched.
 * `origin` is carried through so the grid can label the row's population. That label is the only thing
 * that explains an empty Description cell — neither of Core's listings provides a description, so
 * without it the emptiness reads as missing data rather than as a property of the source.
 */
export const toConfigEntityRows = (options: ConfigEntityOption[], type: ConfigFileEntityType): ConfigEntityRow[] =>
  options.map((option) => ({
    name: getConfigEntityReference(option, type),
    displayName: option.name,
    origin: option.origin,
  }));
