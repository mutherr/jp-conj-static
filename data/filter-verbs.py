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
        # split_at == 0 (the whole reading chunk IS the repeated kana, e.g.
        # replace("", "き"), equal("き"), replace("切", "")) is the same bug:
        # B still needs a reading, so it must move even though "before" ends
        # up empty — only requiring a non-empty `moved` still guarantees
        # progress, since equal_chunk (and therefore moved) is never empty.
        if (
            index + 2 < len(normalized)
            and normalized[index + 1][0] == "equal"
            and normalized[index + 2][0] == "replace"
            and normalized[index + 2][2] == ""
            and KANA_RE.fullmatch(normalized[index + 1][1])
        ):
            equal_chunk = normalized[index + 1][1]
            split_at = replace_reading.find(equal_chunk)
            if split_at != -1:
                before = replace_reading[:split_at]
                after = replace_reading[split_at + len(equal_chunk):]
                moved = after + equal_chunk
                if moved:
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


# JMdict-Yomitan glosses are structured-content trees rather than plain
# strings, so the definitions for a headword's kept sense (see the "1" in
# tags dedup above) live inside a single "glossary" node: either one {tag:
# "li", content: str} or a list of them, nested inside the sense's one
# top-level structured-content wrapper alongside sibling nodes we don't
# want (references, antonyms, notes).
def _extract_definitions(entry) -> list[str]:
    if len(entry) <= 5 or not entry[5]:
        return []

    categories = entry[5][0]["content"]
    categories = categories if isinstance(categories, list) else [categories]
    for category in categories:
        if category.get("data", {}).get("content") != "glossary":
            continue
        items = category["content"]
        items = items if isinstance(items, list) else [items]
        return [item["content"] for item in items]
    return []


class VerbEntry:
    def __init__(self, entry, id):
        self.id = id
        self.term = entry[0]
        self.reading = entry[1] if len(entry) > 1 else ""
        self.type = _resolve_type(entry[3])
        self.tags = entry[2].split() if len(entry) > 2 else []
        self.definitions = _extract_definitions(entry)
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
            "definitions": self.definitions,
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
    # Deduplicate at headword level by taking the first sense of each
    # headword. JMdict-Yomitan only prefixes a sense number when a headword
    # has more than one sense — a single-sense entry (e.g. 致す) carries no
    # digit at all, so "no digit" must be treated as sense 1, not filtered
    # out. Group by (seq, term, reading) rather than just (term, reading):
    # a seq is one dictionary entry, so this keeps true homographs that
    # share spelling+reading (e.g. させる the causative verb vs. させる the
    # auxiliary) as separate entries, while some kanji spellings only cover
    # a subset of a seq's senses (e.g. 空ける only has senses 3-10, since
    # senses 1-2 belong to the 開ける spelling of the same seq) — so within
    # a group we take the lowest sense number actually present, not "1".
    def _sense_rank(tags_str):
        first_token = tags_str.split()[0] if tags_str.split() else ""
        return int(first_token) if first_token.isdigit() else 1

    first_sense_by_group = {}
    for v in verbs:
        key = (v[6], v[0], v[1])
        rank = _sense_rank(v[2])
        if key not in first_sense_by_group or rank < first_sense_by_group[key][0]:
            first_sense_by_group[key] = (rank, v)
    verbs = [v for _, v in first_sense_by_group.values()]
    # isVerb() excludes "vs" entirely (see project notes), so する has no
    # kept entry of its own — hand-add it with real JMdict glosses so it
    # isn't the one verb on the site missing a definition.
    verbs.append([
        "する", "する", "vs", "999999", 999800,
        [{
            "type": "structured-content",
            "content": {
                "tag": "ul",
                "content": [
                    {"tag": "li", "content": "to do"},
                    {"tag": "li", "content": "to carry out"},
                    {"tag": "li", "content": "to perform"},
                ],
                "data": {"content": "glossary"},
            },
        }],
    ])

    print("Total entries:", len(data))
    print("Verbs:", len(verbs))
    
    verbs = [VerbEntry(v, i) for i, v in enumerate(verbs)]
    [v.generateFurigana() for v in verbs]

    output_path = "../astro_site/src/data/verbs.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([v.to_dict() for v in verbs], f, ensure_ascii=False, indent=2)