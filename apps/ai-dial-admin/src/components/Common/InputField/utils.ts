const lessThanOnePattern = /^0+\.(\d+)?$/;
const leadingZerosPattern = /^0+/;

export const getInputValue = (inputValue: string | number): string | number => {
  if (!inputValue) {
    return '';
  }
  return String(inputValue)?.match(lessThanOnePattern)
    ? String(inputValue)?.replace(leadingZerosPattern, '0')
    : Number(inputValue);
};
