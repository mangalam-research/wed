export function getText(el: Element): string {
  const text = el.textContent as string;
  return text.trim();
}
