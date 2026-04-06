/** Merge all tag fields (文體 + 主題 + 自訂) into a single deduplicated array. */
export function getTags(data: { tags?: string[]; themeTags?: string[]; customTags?: string[] }): string[] {
  return [...new Set([
    ...(data.tags ?? []),
    ...(data.themeTags ?? []),
    ...(data.customTags ?? []),
  ])];
}
