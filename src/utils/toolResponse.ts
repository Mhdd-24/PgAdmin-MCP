export function toolText(text: string, isError = false) {
  return { isError, content: [{ type: 'text' as const, text }] };
}

export function toolError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  return { isError: true, content: [{ type: 'text' as const, text }] };
}
