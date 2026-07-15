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
  imperative: string;
  volitional: string;
  volitionalPolite: string;
};

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

export function conjugate(verb: string, type: string): Conjugation {
  let polite = "";
  let negative = "";
  let past = "";
  let negativePast = "";
  let pastPolite = "";
  let negativePolite = "";
  let negativePastPolite = "";
  let te = "";
  let potential = "";
  let potentialPolite = "";
  let passive = "";
  let passivePolite = "";
  let causative = "";
  let imperative = "";
  let volitional = "";
  let volitionalPolite = "";

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

  if (isSuru) {
    const stem = suruSuffix ? verb.slice(0, -suruSuffix.length) : "";
    negative = stem + "しない";
    polite = stem + "します";
    negativePolite = stem + "しません";
    past = stem + "した";
    negativePast = stem + "しなかった";
    pastPolite = stem + "しました";
    negativePastPolite = stem + "しませんでした";
    te = stem + "して";
    potential = stem + "できる";
    potentialPolite = stem + "できます";
    passive = stem + "される";
    passivePolite = stem + "されます";
    causative = stem + "させる";
    imperative = stem + "しろ";
    volitional = stem + "しよう";
    volitionalPolite = stem + "しましょう";
  } else if (isKuru) {
    const stem = kuruSuffix ? verb.slice(0, -kuruSuffix.length) : "";
    negative = stem + "こない";
    polite = stem + "きます";
    negativePolite = stem + "きません";
    past = stem + "きた";
    negativePast = stem + "こなかった";
    pastPolite = stem + "きました";
    negativePastPolite = stem + "きませんでした";
    te = stem + "きて";
    potential = stem + "こられる";
    potentialPolite = stem + "こられます";
    passive = stem + "こられる";
    passivePolite = stem + "こられます";
    causative = stem + "こさせる";
    imperative = stem + "こい";
    volitional = stem + "こよう";
    volitionalPolite = stem + "きましょう";
  } else if (type.includes("v1")) {
    const stem = verb.slice(0, -1);
    negative = stem + "ない";
    polite = stem + "ます";
    negativePolite = stem + "ません";
    past = stem + "た";
    negativePast = stem + "なかった";
    pastPolite = stem + "ました";
    negativePastPolite = stem + "ませんでした";
    te = stem + "て";
    potential = stem + "られる";
    potentialPolite = stem + "られます";
    passive = stem + "られる";
    passivePolite = stem + "られます";
    causative = stem + "させる";
    imperative = stem + "ろ";
    volitional = stem + "よう";
    volitionalPolite = stem + "ましょう";
  } else if (type.includes("v5")) {
    const lastChar = verb.slice(-1);
    const stem = getStem(verb);
    const aRow = aGyou[lastChar];
    const iRow = iGyou[lastChar];
    const eRow = eGyou[lastChar];
    const oRow = oGyou[lastChar];

    if (!aRow || !iRow || !eRow || !oRow) {
      return {
        dictionary: verb,
        polite,
        negative,
        negativePolite,
        past,
        negativePast,
        pastPolite,
        negativePastPolite,
        te,
        potential,
        potentialPolite,
        passive,
        passivePolite,
        causative,
        imperative,
        volitional,
        volitionalPolite,
      };
    }

    negative = stem + aRow + "ない";
    polite = stem + iRow + "ます";
    negativePolite = stem + iRow + "ません";
    past = isIkuException ? stem + "った" : stem + pastEndings[lastChar];
    negativePast = stem + aRow + "なかった";
    pastPolite = stem + iRow + "ました";
    negativePastPolite = stem + iRow + "ませんでした";
    te = isIkuException ? stem + "って" : stem + teEndings[lastChar];
    potential = stem + eRow + "る";
    potentialPolite = stem + eRow + "ます";
    passive = stem + aRow + "れる";
    passivePolite = stem + aRow + "れます";
    causative = stem + aRow + "せる";
    imperative = stem + eRow;
    volitional = stem + oRow + "う";
    volitionalPolite = stem + iRow + "ましょう";
  }
  return {
    dictionary: verb,
    polite,
    negative,
    negativePolite,
    past,
    negativePast,
    pastPolite,
    negativePastPolite,
    te,
    potential,
    potentialPolite,
    passive,
    passivePolite,
    causative,
    imperative,
    volitional,
    volitionalPolite,
  };
}
