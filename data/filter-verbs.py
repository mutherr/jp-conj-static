import json
import os

DICT_PATH = "all/"

class VerbEntry:
    def __init__(self, entry, id):
        self.id = id
        self.term = entry[0]
        self.reading = entry[1] if len(entry) > 1 else ""
        self.type = entry[3]
        self.tags = entry[2].split() if len(entry) > 2 else []

    def to_dict(self):
        return {
            "id": self.id,
            "term": self.term,
            "reading": self.reading,
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

    output_path = "verbs.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([v.to_dict() for v in verbs], f, ensure_ascii=False, indent=2)