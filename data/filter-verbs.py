import json
import os
import re

DICT_PATH = "all/"
KANA_RE = re.compile(r'^[\u3040-\u309f\u30a0-\u30ffー]+$')


def _build_lcs_table(term: str, reading: str):
    n = len(term)
    m = len(reading)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if term[i - 1] == reading[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp


def _build_diff_steps(term: str, reading: str):
    dp = _build_lcs_table(term, reading)
    steps = []
    i = len(term)
    j = len(reading)

    while i > 0 and j > 0:
        if term[i - 1] == reading[j - 1]:
            steps.append(("equal", term[i - 1]))
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            steps.append(("delete", term[i - 1]))
            i -= 1
        else:
            steps.append(("insert", reading[j - 1]))
            j -= 1

    while i > 0:
        steps.append(("delete", term[i - 1]))
        i -= 1

    while j > 0:
        steps.append(("insert", reading[j - 1]))
        j -= 1

    steps.reverse()
    return steps


def _collapse_to_ruby_ops(steps):
    ops = []
    pending_term = ""
    pending_reading = ""

    def flush_pending():
        nonlocal pending_term, pending_reading
        if pending_term or pending_reading:
            ops.append(("replace", pending_term, pending_reading))
            pending_term = ""
            pending_reading = ""

    for kind, value in steps:
        if kind == "equal":
            flush_pending()
            if ops and ops[-1][0] == "equal":
                op_kind, op_term = ops[-1]
                ops[-1] = (op_kind, op_term + value)
            else:
                ops.append(("equal", value))
            continue

        if kind == "delete":
            pending_term += value
        elif kind == "insert":
            pending_reading += value

    flush_pending()
    return ops


def _get_kana_suffix_prefix_overlap(left: str, right: str) -> int:
    max_len = min(len(left), len(right))
    for length in range(max_len, 0, -1):
        suffix = left[-length:]
        prefix = right[:length]
        if suffix == prefix and KANA_RE.fullmatch(suffix):
            return length
    return 0


def _normalize_ruby_ops(ops):
    normalized = ops[:]
    for index, op in enumerate(normalized):
        if op[0] != "replace":
            continue

        _, replace_term, replace_reading = op
        if not replace_reading:
            continue

        if index > 0 and normalized[index - 1][0] == "equal":
            prev_equal = normalized[index - 1][1]
            overlap = _get_kana_suffix_prefix_overlap(prev_equal, replace_reading)
            if overlap > 0 and len(replace_reading) - overlap >= 1:
                replace_reading = replace_reading[overlap:]

        # Heuristic for repeated-kana compounds where LCS may produce:
        # replace(A, x...y), equal(y), replace(B, "").
        # Re-split so y stays in equal and trailing reading moves to B.
        if (
            index + 2 < len(normalized)
            and normalized[index + 1][0] == "equal"
            and normalized[index + 2][0] == "replace"
            and normalized[index + 2][2] == ""
            and KANA_RE.fullmatch(normalized[index + 1][1])
        ):
            equal_chunk = normalized[index + 1][1]
            split_at = replace_reading.find(equal_chunk)
            if split_at > 0:
                before = replace_reading[:split_at]
                after = replace_reading[split_at + len(equal_chunk):]
                moved = after + equal_chunk
                if before and moved:
                    replace_reading = before
                    next_term = normalized[index + 2][1]
                    normalized[index + 2] = ("replace", next_term, moved)

        normalized[index] = ("replace", replace_term, replace_reading)

    return normalized

def align(kanji: str, hiragana: str, log=False) -> str:
    if log:
        print("------")

    steps = _build_diff_steps(kanji, hiragana)
    ops = _normalize_ruby_ops(_collapse_to_ruby_ops(steps))
    furigana = ""

    for op in ops:
        kind = op[0]
        if log:
            if kind == "equal":
                print(f"equal   | {op[1]!r:10} → {op[1]!r}")
            else:
                print(f"replace | {op[1]!r:10} → {op[2]!r}")

        if kind == "equal":
            furigana += op[1]
        elif kind == "replace":
            replace_term = op[1]
            replace_reading = op[2]
            if replace_term and replace_reading:
                furigana += f"<ruby>{replace_term}<rt>{replace_reading}</rt></ruby>"
            elif replace_term:
                furigana += replace_term
            elif replace_reading:
                furigana += replace_reading

    return furigana

# Rules can carry more than one inflection class (e.g. "v5 vs" for classical
# す-ending verbs that JMDict-Yomitan tags as both godan and old-style suru).
# We only implement modern v1/v5/vk/vs conjugation, and the classical suru
# pattern only applies to words ending in する — these don't — so godan is
# the one rule that actually produces correct forms. Resolve to a single
# type here instead of leaving the ambiguity for callers to work around.
_TYPE_PRIORITY = ("v1", "v5", "vk")


def _resolve_type(raw_type: str) -> str:
    tokens = raw_type.split()
    if len(tokens) <= 1:
        return raw_type
    for priority in _TYPE_PRIORITY:
        for token in tokens:
            if token.startswith(priority):
                return token
    return tokens[0]


class VerbEntry:
    def __init__(self, entry, id):
        self.id = id
        self.term = entry[0]
        self.reading = entry[1] if len(entry) > 1 else ""
        self.type = _resolve_type(entry[3])
        self.tags = entry[2].split() if len(entry) > 2 else []
        self.furigana = ""

    def generateFurigana(self):
        if self.reading == self.term:
            self.furigana = ""
            return

        # The robust aligner now handles prior edge cases directly.
        self.furigana = align(self.term, self.reading)

    def to_dict(self):
        return {
            "id": self.id,
            "term": self.term,
            "reading": self.reading,
            "furigana": self.furigana,
            "type": self.type,
            "tags": self.tags,
        }

def loadData():
    files = [os.path.join(DICT_PATH, f) for f in os.listdir(DICT_PATH) if f.startswith("term_")]
    data = []
    for file in files:
        with open(file, "r", encoding="utf-8") as f:
            data.extend(json.load(f))
    return data


def isVerb(entry):
    tags = entry[2].split() if len(entry) > 2 else []
    isVerb = False
    isExpression = False
    for t in tags:
        if t.startswith("v1") or t.startswith("v5") or t.startswith("vk"):
            isVerb = True
        if t=="exp":
            isExpression = True
    return isVerb and not isExpression

if __name__ == "__main__":
    data = loadData()

    verbs = [d[:-1] for d in data if isVerb(d)]
    #deduplicate at headword level by taking first sense of each headword
    verbs = [v for v in verbs if "1" in v[2].split()]
    verbs.append(["する", "する", "vs", "999999"])

    print("Total entries:", len(data))
    print("Verbs:", len(verbs))
    
    verbs = [VerbEntry(v, i) for i, v in enumerate(verbs)]
    [v.generateFurigana() for v in verbs]

    output_path = "../astro_site/src/data/verbs.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([v.to_dict() for v in verbs], f, ensure_ascii=False, indent=2)