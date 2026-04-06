/** Merge predefined tags and custom free-form tags into a single array. */
export function getTags(data: { tags?: string[]; customTags?: string[] }): string[] {
  return [...(data.tags ?? []), ...(data.customTags ?? [])];
}
