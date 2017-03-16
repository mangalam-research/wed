/**
 * This module should contain utilities needed by store.ts and associated
 * files. It should remain as tiny as possible.
 */

export function readFile(file: File): Promise<string> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
