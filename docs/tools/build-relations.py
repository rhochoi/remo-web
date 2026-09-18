#!/usr/bin/env python3
"""관계 맵 데이터 생성 — 안 B (docs/plan-06-relation-map.md)

입력: 로컬에만 있는 원본 JSON (실명 포함, 저장소 밖). 노션 REMO OS v4.1 07장에서 추출한 형식:
  {"nodes":[{"id":이름,"x":..,"y":..,"r":..}], "edges":[{"s":이름,"t":이름,"tp":유형,"w":1~3}]}
출력: site/data/relations.json — 익명 번호 노드 + 동의된 유형만. 실명은 나가지 않는다.

사용: python3 docs/tools/build-relations.py <원본.json> --exclude 이름 [--types synergy,cover,collab] --caption "..."
동의 표(노션)와 대조한 뒤에만 실행한다. 실행 결과를 커밋하는 것이 곧 "공개"다.
"""
import argparse, json, pathlib, random, sys

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("--exclude", action="append", default=[], help="데이터에만 있고 팀에 없는 인원 등 제외할 표기명")
ap.add_argument("--types", default="synergy,cover,collab", help="동의된 유형 키 (쉼표)")
ap.add_argument("--caption", default="팀 진단 도구(REMO OS)의 관계 데이터. 노드에 이름은 없다.")
ap.add_argument("--seed", type=int, default=None, help="번호 매김 셔플 시드 (미지정 시 원본 순서). 원본 순서가 팀 내에서 식별 단서가 되면 지정")
ap.add_argument("--out", default="site/data/relations.json")
a = ap.parse_args()

d = json.load(open(a.src))
types = [t.strip() for t in a.types.split(",") if t.strip()]
nodes = [n for n in d["nodes"] if n["id"] not in a.exclude]
order = list(range(len(nodes)))
if a.seed is not None:
    random.Random(a.seed).shuffle(order)
num = {nodes[i]["id"]: k + 1 for k, i in enumerate(order)}
out_nodes = [{"n": num[n["id"]], "x": n["x"], "y": n["y"], "r": n["r"]} for n in nodes]
out_edges = [{"s": num[e["s"]], "t": num[e["t"]], "tp": e["tp"], "w": e["w"]}
             for e in d["edges"] if e["tp"] in types and e["s"] in num and e["t"] in num]
out = {"caption": a.caption, "types": types, "nodes": sorted(out_nodes, key=lambda x: x["n"]), "edges": out_edges}
p = pathlib.Path(a.out); p.parent.mkdir(parents=True, exist_ok=True)
p.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"nodes {len(out_nodes)} · edges {len(out_edges)} · types {types} → {p}", file=sys.stderr)
