export function replacePlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(/<<\[(.+?)\]>>/g, (_match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : _match;
  });
}
