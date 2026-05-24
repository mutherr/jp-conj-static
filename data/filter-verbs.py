import json
import os
import difflib

DICT_PATH = "all/"

def align(kanji: str, hiragana: str, log=False) -> str:
    matcher = difflib.SequenceMatcher(None, kanji, hiragana, autojunk=False)
    if log:
        print("------")
    furigana = ""
    for op, i1, i2, j1, j2 in matcher.get_opcodes():   
        if log:
            print(f"{op:7} | {kanji[i1:i2]!r:10} → {hiragana[j1:j2]!r}")
        if op == "equal":
            furigana += hiragana[j1:j2]
        elif op == "replace":
            furigana += f"<ruby>{kanji[i1:i2]}<rt>{hiragana[j1:j2]}</rt></ruby>"
    return furigana

def isKanji(char: str) -> bool:
    return '\u4e00' <= char <= '\u9faf' or '\u3400' <= char <= '\u4dbf'

def alignToSingleKanji(reading: str, term: str) -> str:
    innerKana = reading[1:-1]
    alignment = align(term, reading[1:], log=True)
    furigana = alignment.replace(innerKana, f"{reading[0]}{innerKana}")
    return alignment, furigana

class VerbEntry:
    def __init__(self, entry, id):
        self.id = id
        self.term = entry[0]
        self.reading = entry[1] if len(entry) > 1 else ""
        self.type = entry[3]
        self.tags = entry[2].split() if len(entry) > 2 else []
        self.furigana = ""

    def generateFurigana(self):
        furigana = ""
        if self.reading == self.term:
            furigana = ""
        else:
            #workaround for the alignment being greedy with leading "いい" in verbs like
            # いい伝える → いいつたえる
            if self.term[0:2] == "言い":
                furigana = f"<ruby>{self.term[0]}<rt>{self.reading[0]}</rt></ruby>い" + align(self.term[2:], self.reading[2:])
            elif self.reading[0] == self.reading[-1]: 
                #greedily align anything that matches in the beginning
                index = 0
                greedy = ""
                while index < len(self.reading) and self.term[index] == self.reading[index]:
                    greedy += self.reading[index]
                    index += 1

                if greedy:
                    alignment = align(self.term[index:], self.reading[index:])
                    furigana = greedy + alignment
                elif len(self.term) == 2:
                    alignment, furigana = alignToSingleKanji(self.reading, self.term)
                elif len(self.term) == 3 and isKanji(self.term[0]) and isKanji(self.term[1]):
                    firstKanji = self.term[0]
                    secondKanji = self.term[1]
                    alignment, furigana = alignToSingleKanji(self.reading, self.term[1:])
                    furigana = furigana.replace(secondKanji, f"{firstKanji}{secondKanji}")
                else:
                    alignment = align(self.term, self.reading, log=True)
                    furigana = alignment
                # print("=========")
                # print(f"Warning: {self.term} has same first and last reading character")
                # print(f"Term: {self.term}, Reading: {self.reading}")
                # print(f"Alignment: {alignment}")
                # print(f"Furigana: {furigana}")
            else:
                furigana = align(self.term, self.reading)

        self.furigana = furigana

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

    print("Total entries:", len(data))
    print("Verbs:", len(verbs))
    
    verbs = [VerbEntry(v, i) for i, v in enumerate(verbs)]
    [v.generateFurigana() for v in verbs]

    output_path = "../astro_site/src/data/verbs.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([v.to_dict() for v in verbs], f, ensure_ascii=False, indent=2)