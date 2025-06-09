export const getParsedError = (error: string): ErrorObject => {
  try {
    return JSON.parse(error) as ErrorObject;
  } catch {
    return {};
  }
};

export const getError = (parsedError: ErrorObject): string => {
  const error = parsedError.error;
  return typeof error === 'object' || !error ? 'Request error' : error;
};

export const getErrorMessage = (parsedError: ErrorObject, status: number): string => {
  const mess = parsedError.message;
  return typeof mess === 'object' || !mess ? `Error status: ${status}` : mess;
};

interface ErrorObject {
  message?: string;
  status?: number;
  error?: string;
}
