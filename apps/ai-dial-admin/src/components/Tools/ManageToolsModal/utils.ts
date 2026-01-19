import { ErrorType } from '@/src/types/error-type';

export const generateUniqueName = (names: string[], defaultName: string) => {
  let name = defaultName;
  let counter = 2;

  while (names.includes(name)) {
    name = `${defaultName}-${counter}`;
    counter++;
  }

  return name;
};

export const getCustomToolErrorType = (customToolName: string, allTools: string[]) => {
  let errorType: ErrorType | null = null;
  const currentToolIndex = allTools.findIndex((tool) => tool === customToolName);
  if (currentToolIndex !== -1) {
    allTools.splice(currentToolIndex, 1);
  }
  if (!customToolName) {
    errorType = ErrorType.EMPTY;
  } else if (allTools.includes(customToolName)) {
    errorType = ErrorType.EXISTING;
  } else {
    errorType = null;
  }

  return errorType;
};
