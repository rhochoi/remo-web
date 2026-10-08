#!/usr/bin/env python3
"""워드마크 PNG/WebP(검정 외곽선 + 투명/흰 바탕)를 글자별 SVG 경로로 변환한다.

방법: 선(어두운 픽셀)이 아닌 영역을 연결 성분으로 나눠 글자 안쪽(fill)을 찾고, 선 굵기의 절반만큼
팽창시킨 뒤 경계를 추적해(마칭 스퀘어 방식) RDP로 줄이고 Chaikin으로 부드럽게 한다.
SVG에서는 이 경로를 흰 채움 + 같은 굵기 stroke로 그리면 원본 외곽선이 재현된다.

사용: python3 docs/tools/trace-wordmark.py <wordmark.webp> <out.json>
의존: Pillow, numpy, scipy.  출력 좌표는 0.5배(가로 1000 기준)로 축소한다.
"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SCALE = 0.5


def contours(mask):
    """이진 마스크의 모든 경계 루프(바깥·구멍)를 픽셀 모서리 좌표 리스트로 반환."""
    m = np.pad(mask, 1)
    up = m[1:-1, 1:-1] & ~m[:-2, 1:-1]
    dn = m[1:-1, 1:-1] & ~m[2:, 1:-1]
    lf = m[1:-1, 1:-1] & ~m[1:-1, :-2]
    rt = m[1:-1, 1:-1] & ~m[1:-1, 2:]
    nxt = {}
    for (ys, xs), kind in ((np.nonzero(up), 'u'), (np.nonzero(rt), 'r'), (np.nonzero(dn), 'd'), (np.nonzero(lf), 'l')):
        for y, x in zip(ys.tolist(), xs.tolist()):
            if kind == 'u': a, b = (x, y), (x + 1, y)
            elif kind == 'r': a, b = (x + 1, y), (x + 1, y + 1)
            elif kind == 'd': a, b = (x + 1, y + 1), (x, y + 1)
            else: a, b = (x, y + 1), (x, y)
            nxt.setdefault(a, []).append(b)
    loops = []
    while nxt:
        start = next(iter(nxt)); loop = [start]; cur = start
        while True:
            outs = nxt.get(cur)
            if not outs: break
            n = outs.pop()
            if not outs: del nxt[cur]
            if n == start: break
            loop.append(n); cur = n
        if len(loop) > 8: loops.append(loop)
    return loops


def rdp(pts, eps):
    pts = np.asarray(pts, float); n = len(pts)
    keep = np.zeros(n, bool); keep[0] = keep[-1] = True; stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1: continue
        a, b = pts[i], pts[j]; d = b - a; L = np.hypot(*d)
        seg = pts[i + 1:j]
        dist = np.hypot(*(seg - a).T) if L == 0 else np.abs(d[0] * (seg[:, 1] - a[1]) - d[1] * (seg[:, 0] - a[0])) / L
        k = int(np.argmax(dist))
        if dist[k] > eps:
            k += i + 1; keep[k] = True; stack += [(i, k), (k, j)]
    return pts[keep]


def smooth(p, it=2):
    for _ in range(it):
        q = np.roll(p, -1, axis=0)
        out = np.empty((len(p) * 2, 2)); out[0::2] = .75 * p + .25 * q; out[1::2] = .25 * p + .75 * q
        p = out
    return p


def area(lp):
    p = np.asarray(lp, float); x, y = p[:, 0], p[:, 1]
    return abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))) / 2


def to_path(loops, eps=1.6, min_area=1500):
    """min_area 미만의 작은 루프(눈이 있던 구멍 등)는 버린다. 눈은 SVG에서 따로 그려 움직인다."""
    d = []
    for lp in loops:
        if area(lp) < min_area: continue
        p = rdp(lp + [lp[0]], eps)[:-1]
        if len(p) < 3: continue
        p = smooth(p) * SCALE
        d.append('M' + ' '.join(f'{x:.1f} {y:.1f}' for x, y in p[:1]) + 'L' + ' '.join(f'{x:.1f} {y:.1f}' for x, y in p[1:]) + 'Z')
    return ''.join(d)


def main(src, out):
    a = np.array(Image.open(src).convert('RGBA'))
    dark = (a[..., 3] > 128) & (a[..., :3].mean(2) < 110)
    lab, n = ndi.label(~dark)               # 4-연결
    H, W = dark.shape
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1)); objs = ndi.find_objects(lab)
    comps = []
    for i in range(1, n + 1):
        sl = objs[i - 1]; comps.append(dict(id=i, area=int(sizes[i - 1]), x0=sl[1].start, x1=sl[1].stop, y0=sl[0].start, y1=sl[0].stop))
    comps = [c for c in comps if not (c['x0'] == 0 and c['y0'] == 0)]       # 바깥 배경 제외
    big = sorted([c for c in comps if c['area'] > 50000], key=lambda c: c['x0'])
    assert len(big) == 4, f'글자 4개를 기대했으나 {len(big)}'
    names = ['R', 'E', 'M', 'O']
    # 선 굵기: 가운데 행의 어두운 런 길이 중앙값
    runs = []; row = dark[H // 2]; c = 0
    for v in row:
        if v: c += 1
        elif c: runs.append(c); c = 0
    w = float(np.median(runs)); r = int(round(w / 2)); print('stroke', w, 'dilate', r)
    st = ndi.generate_binary_structure(2, 2)
    res = dict(w=W * SCALE, h=H * SCALE, stroke=w * SCALE, letters={}, bbox={})
    holes = [c for c in comps if 1000 < c['area'] < 50000]
    for nm, c in zip(names, big):
        fill = lab == c['id']
        # 글자 안에 완전히 들어 있는 작은 영역(O의 구멍)은 구멍으로 둔다. 코는 따로 그린다.
        d = ndi.binary_dilation(fill, st, iterations=r)
        res['letters'][nm] = to_path(contours(d))
        res['bbox'][nm] = [c['x0'] * SCALE, c['y0'] * SCALE, c['x1'] * SCALE, c['y1'] * SCALE]
    # 코(R 안쪽의 작은 닫힌 영역)
    nose = [c for c in holes if c['x0'] > big[0]['x0'] and c['x1'] < big[0]['x1']]
    if nose:
        c = max(nose, key=lambda c: c['area']); d = ndi.binary_dilation(lab == c['id'], st, iterations=r)
        res['nose'] = to_path(contours(d))
    # 눈: R 안쪽 어두운 덩어리
    el, en = ndi.label(dark); eyes = []
    for i, sl in enumerate(ndi.find_objects(el), 1):
        if sl is None: continue
        ys, xs = sl; area = int((el[sl] == i).sum())
        if 300 < area < 1500 and big[0]['x0'] < xs.start and xs.stop < big[0]['x1'] and ys.start < H * .45:
            cy, cx = ndi.center_of_mass(el == i); eyes.append([cx * SCALE, cy * SCALE, (area / np.pi) ** .5 * SCALE])
    res['eyes'] = sorted(eyes)
    json.dump(res, open(out, 'w'), ensure_ascii=False)
    print({k: (len(v) if isinstance(v, (str, list)) else v) for k, v in res.items() if k != 'letters'}, {k: len(v) for k, v in res['letters'].items()}, 'eyes', res['eyes'])


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
