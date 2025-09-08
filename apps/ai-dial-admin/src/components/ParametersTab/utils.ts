import {
  DialApplicationScheme,
  DialApplicationSchemeProperty,
  DialApplicationSchemePropertyType,
} from '@/src/models/dial/application';
import { DialApplicationSchemeControl, SchemeTypeDefinition } from './models';

export const generateControlsFromScheme = (scheme: DialApplicationScheme): DialApplicationSchemeControl[] => {
  const controls: DialApplicationSchemeControl[] = [];
  const requiredProperties = scheme.required || [];
  const properties = scheme.properties;

  for (const key in properties) {
    const control = {} as DialApplicationSchemeControl;
    const value = properties[key];

    const type = value.type || getType(value);
    if (type === 'array') {
      control.itemsTypes = getItemsTypes(value);
    }
    if (type === void 0) {
      control.types = getTypes(value);
    }
    if (type) {
      control.type = type;
    }
    control.id = key;
    control.label = value.title;
    control.optional = !requiredProperties.includes(key);
    control.nullable = value.type ? false : getIsNullable(value);
    controls.push(control);
  }

  return controls;
};

export const getType = (property: DialApplicationSchemeProperty): string | undefined => {
  if (property.items || property.oneOf?.length) return undefined;

  const types = extractTypes(property.anyOf ?? []).filter((t) => t !== 'null');

  return types.length === 1 ? types[0] : undefined;
};

export const getTypes = (property: DialApplicationSchemeProperty): SchemeTypeDefinition[] => {
  const types: SchemeTypeDefinition[] = [];

  const generateTypeObjects = (typesArray: DialApplicationSchemePropertyType[] | undefined, isMultiple: boolean) => {
    typesArray?.forEach((p) => {
      if (p.type || p.$ref) {
        const type = p.type === 'array' ? p.items?.type || p.items?.$ref : p.type || p.$ref;
        types.push({
          type,
          isArray: p.type === 'array',
          isMultiple,
        });
      }
    });
  };

  generateTypeObjects(property.oneOf, false);
  generateTypeObjects(property.anyOf, true);

  return types;
};

export const getItemsTypes = (property: DialApplicationSchemeProperty): string[] => {
  const types: string[] = [];

  if (property.items?.anyOf) {
    types.push(...extractTypes(property.items.anyOf));
  }

  const anyOfItems = property.anyOf?.[0]?.items;
  if (anyOfItems) {
    const type = anyOfItems.type || anyOfItems.$ref;
    if (anyOfItems.anyOf) {
      types.push(...extractTypes(anyOfItems.anyOf));
    } else if (type) {
      types.push(type);
    }
  }

  return types;
};

export const extractTypes = (typeArray: DialApplicationSchemePropertyType[]) =>
  typeArray.map((p) => p.type || p.$ref || '').filter(Boolean);

export const getIsNullable = (property: DialApplicationSchemeProperty): boolean =>
  property.anyOf?.some((p) => p.type === 'null') ?? false;
