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

export type Transitivity = "transitive" | "intransitive" | "ambitransitive";

// JMDict-Yomitan tags transitivity directly on the verb (vt/vi); a handful
// of verbs (e.g. 開く/開ける pairs collapsed to one entry) carry both.
export function getTransitivity(tags: string[]): Transitivity | null {
  const vt = tags.includes("vt");
  const vi = tags.includes("vi");
  if (vt && vi) return "ambitransitive";
  if (vt) return "transitive";
  if (vi) return "intransitive";
  return null;
}

const transitivityLabels: Record<Transitivity, string> = {
  transitive: "Transitive",
  intransitive: "Intransitive",
  ambitransitive: "Transitive & Intransitive",
};

export function getTransitivityLabel(transitivity: Transitivity): string {
  return transitivityLabels[transitivity];
}
