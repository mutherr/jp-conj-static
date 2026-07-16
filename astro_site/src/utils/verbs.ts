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

// Matches the kanji + badge color established on the homepage's verb-group cards.
const groupBadges: Record<VerbGroup, { kanji: string; badgeClass: string }> = {
  ichidan: { kanji: "一段", badgeClass: "badge-secondary" },
  godan: { kanji: "五段", badgeClass: "badge-primary" },
  irregular: { kanji: "不規則", badgeClass: "badge-neutral" },
};

export function getVerbGroupBadge(type: string) {
  return groupBadges[getVerbGroup(type)];
}
