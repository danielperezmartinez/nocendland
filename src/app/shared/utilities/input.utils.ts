export function selectInputContent(event: FocusEvent): void {
  (event.target as HTMLInputElement).select()
}
