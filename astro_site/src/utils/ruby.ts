type DiffStep =
  | { kind: "equal"; value: string }
  | { kind: "delete"; value: string }
  | { kind: "insert"; value: string };

type RubyOp =
  | { kind: "equal"; term: string }
  | { kind: "replace"; term: string; reading: string };

const kanaRe = /^[\u3040-\u309f\u30a0-\u30ffー]+$/;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildLcsTable(term: string, reading: string): number[][] {
  const n = term.length;
  const m = reading.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      if (term[i - 1] === reading[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

function buildDiffSteps(term: string, reading: string): DiffStep[] {
  const dp = buildLcsTable(term, reading);
  const steps: DiffStep[] = [];
  let i = term.length;
  let j = reading.length;

  while (i > 0 && j > 0) {
    if (term[i - 1] === reading[j - 1]) {
      steps.push({ kind: "equal", value: term[i - 1] });
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      steps.push({ kind: "delete", value: term[i - 1] });
      i -= 1;
    } else {
      steps.push({ kind: "insert", value: reading[j - 1] });
      j -= 1;
    }
  }

  while (i > 0) {
    steps.push({ kind: "delete", value: term[i - 1] });
    i -= 1;
  }

  while (j > 0) {
    steps.push({ kind: "insert", value: reading[j - 1] });
    j -= 1;
  }

  return steps.reverse();
}

function collapseToRubyOps(steps: DiffStep[]): RubyOp[] {
  const ops: RubyOp[] = [];
  let pendingTerm = "";
  let pendingReading = "";

  const flushPending = () => {
    if (pendingTerm.length > 0 || pendingReading.length > 0) {
      ops.push({ kind: "replace", term: pendingTerm, reading: pendingReading });
      pendingTerm = "";
      pendingReading = "";
    }
  };

  for (const step of steps) {
    if (step.kind === "equal") {
      flushPending();
      const lastOp = ops[ops.length - 1];
      if (lastOp && lastOp.kind === "equal") {
        lastOp.term += step.value;
      } else {
        ops.push({ kind: "equal", term: step.value });
      }
      continue;
    }

    if (step.kind === "delete") {
      pendingTerm += step.value;
    } else {
      pendingReading += step.value;
    }
  }

  flushPending();
  return ops;
}

function getKanaSuffixPrefixOverlap(left: string, right: string): number {
  const max = Math.min(left.length, right.length);
  for (let len = max; len >= 1; len -= 1) {
    const suffix = left.slice(-len);
    const prefix = right.slice(0, len);
    if (suffix === prefix && kanaRe.test(suffix)) {
      return len;
    }
  }
  return 0;
}

function normalizeRubyOps(ops: RubyOp[]): RubyOp[] {
  const normalized = ops.map((op) => ({ ...op }));

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index];
    if (!current || current.kind !== "replace" || !current.reading) {
      continue;
    }

    const previous = normalized[index - 1];
    if (previous && previous.kind === "equal") {
      const overlap = getKanaSuffixPrefixOverlap(
        previous.term,
        current.reading,
      );
      if (overlap > 0 && current.reading.length - overlap >= 1) {
        current.reading = current.reading.slice(overlap);
      }
    }
  }

  return normalized;
}

export function toRuby(term: string, reading: string): string {
  if (!term) {
    return "";
  }

  if (!reading || term === reading) {
    return escapeHtml(term);
  }

  const ops = normalizeRubyOps(
    collapseToRubyOps(buildDiffSteps(term, reading)),
  );
  let output = "";

  for (const op of ops) {
    if (op.kind === "equal") {
      output += escapeHtml(op.term);
      continue;
    }

    if (!op.term) {
      continue;
    }

    if (!op.reading) {
      output += escapeHtml(op.term);
      continue;
    }

    output += `<ruby>${escapeHtml(op.term)}<rt>${escapeHtml(op.reading)}</rt></ruby>`;
  }

  return output || escapeHtml(term);
}
