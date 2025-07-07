const ENDPOINT_REGEX =
  /^https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}(\.[a-zA-Z0-9()]{1,6})?\b(:[0-9]{1,5})?([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

const WARNING_ENDPOINT_REGEX = /^http:\/\//;

export const isValidHttpUrl = (value: string) => {
  let url: URL | null = null;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return url && (url.protocol === 'http:' || url.protocol === 'https:');
};

export const isValidEndpoint = (value: string) => {
  return ENDPOINT_REGEX.test(value);
};

export const isDangerEndpoint = (value: string) => {
  return WARNING_ENDPOINT_REGEX.test(value);
};
