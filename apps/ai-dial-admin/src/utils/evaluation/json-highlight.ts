const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const highlightJson = (json: string): string => {
  const escaped = escapeHtml(json);
  return escaped
    .replace(/(&quot;|")((?:\\.|[^"\\])*)(&quot;|")\s*:/g, '<span class="text-accent-secondary">"$2"</span>:')
    .replace(/:\s*(&quot;|")((?:\\.|[^"\\])*)(&quot;|")/g, ': <span class="text-accent-tertiary">"$2"</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-accent-primary">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="text-warning">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="text-secondary italic">$1</span>');
};

export const generateLineNumbers = (text: string): string => {
  const count = text.split('\n').length;
  return Array.from({ length: count }, (_, i) => i + 1).join('\n');
};

export const formatJsonSize = (json: string): string => {
  const bytes = new Blob([json]).size;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};
