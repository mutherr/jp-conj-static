export type Conjugation = {
  dictionary: string;
  negative: string;
  polite: string;
  negativePolite: string;
  past: string;
  negativePast: string;
  pastPolite: string;
  negativePastPolite: string;
  te: string;
  potential: string;
  potentialPolite: string;
  passive: string;
  passivePolite: string;
  causative: string;
  causativePolite: string;
  imperative: string;
  volitional: string;
  volitionalPolite: string;
};

// The invariant lead-in and the part that actually carries the grammar,
// e.g. 書く's negative splits into stem "書" + ending "かない".
export type ConjugationPart = { stem: string; ending: string };
export type ConjugationParts = Record<keyof Conjugation, ConjugationPart>;

type KanaMap = Record<string, string>;

const aGyou: KanaMap = {
  う: "わ",
  つ: "た",
  る: "ら",
  む: "ま",
  ふ: "は",
  ぶ: "ば",
  ぬ: "な",
  く: "か",
  ぐ: "が",
  す: "さ",
};

const iGyou: KanaMap = {
  う: "い",
  つ: "ち",
  る: "り",
  む: "み",
  ふ: "ひ",
  ぶ: "び",
  ぬ: "に",
  く: "き",
  ぐ: "ぎ",
  す: "し",
};

const eGyou: KanaMap = {
  う: "え",
  つ: "て",
  る: "れ",
  む: "め",
  ふ: "へ",
  ぶ: "べ",
  ぬ: "ね",
  く: "け",
  ぐ: "げ",
  す: "せ",
};

const oGyou: KanaMap = {
  う: "お",
  つ: "と",
  る: "ろ",
  む: "も",
  ふ: "ほ",
  ぶ: "ぼ",
  ぬ: "の",
  く: "こ",
  ぐ: "ご",
  す: "そ",
};

const pastEndings: KanaMap = {
  う: "った",
  つ: "った",
  る: "った",
  む: "んだ",
  ふ: "んだ",
  ぶ: "んだ",
  ぬ: "んだ",
  く: "いた",
  ぐ: "いだ",
  す: "した",
};

const teEndings: KanaMap = {
  う: "って",
  つ: "って",
  る: "って",
  む: "んで",
  ふ: "んで",
  ぶ: "んで",
  ぬ: "んで",
  く: "いて",
  ぐ: "いで",
  す: "して",
};

function getStem(verb: string): string {
  if (!verb || verb.length === 0) {
    return "";
  }
  return verb.slice(0, -1);
}

export function conjugateParts(verb: string, type: string): ConjugationParts {
  const isKuru = type.includes("vk");
  const isSuru =
    !isKuru &&
    !type.includes("v1") &&
    !type.includes("v5") &&
    (type.includes("vs") || type === "999999");
  const isIkuException = /(行く|往く|逝く|いく|ゆく)$/.test(verb);
  const suruSuffix = verb.endsWith("する") ? "する" : "";
  const kuruSuffix = verb.endsWith("くる")
    ? "くる"
    : verb.endsWith("来る")
      ? "来る"
      : "";

  const blank: ConjugationPart = { stem: "", ending: "" };
  const parts: ConjugationParts = {
    dictionary: { stem: verb, ending: "" },
    negative: blank,
    polite: blank,
    negativePolite: blank,
    past: blank,
    negativePast: blank,
    pastPolite: blank,
    negativePastPolite: blank,
    te: blank,
    potential: blank,
    potentialPolite: blank,
    passive: blank,
    passivePolite: blank,
    causative: blank,
    causativePolite: blank,
    imperative: blank,
    volitional: blank,
    volitionalPolite: blank,
  };

  if (isSuru) {
    const stem = suruSuffix ? verb.slice(0, -suruSuffix.length) : "";
    const set = (key: keyof Conjugation, ending: string) => {
      parts[key] = { stem, ending };
    };
    set("dictionary", verb.slice(stem.length));
    set("negative", "しない");
    set("polite", "します");
    set("negativePolite", "しません");
    set("past", "した");
    set("negativePast", "しなかった");
    set("pastPolite", "しました");
    set("negativePastPolite", "しませんでした");
    set("te", "して");
    set("potential", "できる");
    set("potentialPolite", "できます");
    set("passive", "される");
    set("passivePolite", "されます");
    set("causative", "させる");
    set("causativePolite", "させます");
    set("imperative", "しろ");
    set("volitional", "しよう");
    set("volitionalPolite", "しましょう");
  } else if (isKuru) {
    const stem = kuruSuffix ? verb.slice(0, -kuruSuffix.length) : "";
    const set = (key: keyof Conjugation, ending: string) => {
      parts[key] = { stem, ending };
    };
    set("dictionary", verb.slice(stem.length));
    set("negative", "こない");
    set("polite", "きます");
    set("negativePolite", "きません");
    set("past", "きた");
    set("negativePast", "こなかった");
    set("pastPolite", "きました");
    set("negativePastPolite", "きませんでした");
    set("te", "きて");
    set("potential", "こられる");
    set("potentialPolite", "こられます");
    set("passive", "こられる");
    set("passivePolite", "こられます");
    set("causative", "こさせる");
    set("causativePolite", "こさせます");
    set("imperative", "こい");
    set("volitional", "こよう");
    set("volitionalPolite", "きましょう");
  } else if (type.includes("v1")) {
    const stem = verb.slice(0, -1);
    const set = (key: keyof Conjugation, ending: string) => {
      parts[key] = { stem, ending };
    };
    set("dictionary", verb.slice(stem.length));
    set("negative", "ない");
    set("polite", "ます");
    set("negativePolite", "ません");
    set("past", "た");
    set("negativePast", "なかった");
    set("pastPolite", "ました");
    set("negativePastPolite", "ませんでした");
    set("te", "て");
    set("potential", "られる");
    set("potentialPolite", "られます");
    set("passive", "られる");
    set("passivePolite", "られます");
    set("causative", "させる");
    set("causativePolite", "させます");
    set("imperative", "ろ");
    set("volitional", "よう");
    set("volitionalPolite", "ましょう");
  } else if (type.includes("v5")) {
    const lastChar = verb.slice(-1);
    const stem = getStem(verb);
    const aRow = aGyou[lastChar];
    const iRow = iGyou[lastChar];
    const eRow = eGyou[lastChar];
    const oRow = oGyou[lastChar];

    if (!aRow || !iRow || !eRow || !oRow) {
      return parts;
    }

    const set = (key: keyof Conjugation, ending: string) => {
      parts[key] = { stem, ending };
    };
    set("dictionary", lastChar);
    set("negative", aRow + "ない");
    set("polite", iRow + "ます");
    set("negativePolite", iRow + "ません");
    set("past", isIkuException ? "った" : pastEndings[lastChar]);
    set("negativePast", aRow + "なかった");
    set("pastPolite", iRow + "ました");
    set("negativePastPolite", iRow + "ませんでした");
    set("te", isIkuException ? "って" : teEndings[lastChar]);
    set("potential", eRow + "る");
    set("potentialPolite", eRow + "ます");
    set("passive", aRow + "れる");
    set("passivePolite", aRow + "れます");
    set("causative", aRow + "せる");
    set("causativePolite", aRow + "せます");
    set("imperative", eRow);
    set("volitional", oRow + "う");
    set("volitionalPolite", iRow + "ましょう");
  }

  return parts;
}

export function conjugate(verb: string, type: string): Conjugation {
  const parts = conjugateParts(verb, type);
  return Object.fromEntries(
    (Object.keys(parts) as Array<keyof Conjugation>).map((key) => [
      key,
      parts[key].stem + parts[key].ending,
    ]),
  ) as Conjugation;
}
