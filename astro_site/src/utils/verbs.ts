export type VerbGroup = "ichidan" | "godan" | "irregular";

export function getVerbGroup(type: string): VerbGroup {
  if (type.includes("v1")) {
    return "ichidan";
  }
  if (type.includes("v5")) {
    return "godan";
  }
  return "irregular";
}

export function getVerbGroupLabel(type: string): string {
  const group = getVerbGroup(type);
  return group.charAt(0).toUpperCase() + group.slice(1);
}
