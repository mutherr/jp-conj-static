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
};

const aGyou: { [key: string]: string } = {
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

const iGyou: { [key: string]: string } = {
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

const eGyou: { [key: string]: string } = {
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

const oGyou: { [key: string]: string } = {
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

const pastEndings: { [key: string]: string } = {
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

const teEndings: { [key: string]: string } = {
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

function getStem(verb: string, type: string): string {
  if (!verb || verb.length === 0) {
    return "";
  }
  if (type.includes("v1")) {
    return verb.slice(0, -1);
  } else if (type.includes("v5")) {
    return verb.slice(0, -1);
  }
  return verb;
}

export function conjugate(verb: string, type: string): Conjugation {
  // This is a placeholder implementation. You would need to implement the actual conjugation logic here.
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
  if (type.includes("v1")) {
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
  } else if (type.includes("v5")) {
    const lastChar = verb.slice(-1);
    const stem = getStem(verb, type);
    negative = stem + aGyou[lastChar] + "ない";
    polite = stem + iGyou[lastChar] + "ます";
    negativePolite = stem + iGyou[lastChar] + "ません";
    past = stem + pastEndings[lastChar];
    negativePast = stem + aGyou[lastChar] + "なかった";
    pastPolite = stem + iGyou[lastChar] + "ました";
    negativePastPolite = stem + iGyou[lastChar] + "ませんでした";
    te = stem + teEndings[lastChar];
    potential = stem + eGyou[lastChar] + "る";
    potentialPolite = stem + eGyou[lastChar] + "ます";
    passive = stem + eGyou[lastChar] + "られる";
    passivePolite = stem + eGyou[lastChar] + "られます";
    causative = stem + "させる";
    imperative = oGyou[lastChar];
    volitional = stem + "う";
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
  };
}
