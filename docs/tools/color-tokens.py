#!/usr/bin/env python3
"""브랜드 색 3개(로고에서 실측)로 OKLCH 톤 스케일을 만들고, 대비·색각 이상 시뮬레이션을 검사해 site/assets/tokens.css를 쓴다.
사용: python3 docs/tools/color-tokens.py [--check]   (--check는 파일을 쓰지 않고 표만 출력)
브랜드 원값: 주황 #FF6A00, 블루 #3659E3, 잉크 #1A1A1A, 종이 #F7F6F2 (docs/assets-src/ 로고 픽셀 실측, 종이는 기존 사이트 값).
OKLCH 공식은 Björn Ottosson의 OKLab 정의. 색각 시뮬레이션은 Machado 외(2009) 행렬(심각도 1.0)."""
import math, sys

def hex2rgb(h): h = h.lstrip('#'); return [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
def rgb2hex(c): return '#' + ''.join(f'{round(max(0, min(1, v)) * 255):02X}' for v in c)
def lin(c): return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
def delin(c): return 12.92 * c if c <= .0031308 else 1.055 * c ** (1 / 2.4) - .055
def rgb2oklab(rgb):
    r, g, b = [lin(v) for v in rgb]
    l = .4122214708 * r + .5363325363 * g + .0514459929 * b; m = .2119034982 * r + .6806995451 * g + .1073969566 * b; s = .0883024619 * r + .2817188376 * g + .6299787005 * b
    l, m, s = [v ** (1 / 3) for v in (l, m, s)]
    return (.2104542553 * l + .7936177850 * m - .0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .8086757660 * s)
def oklab2rgb(L, a, b, clamp=True):
    l = (L + .3963377774 * a + .2158037573 * b) ** 3; m = (L - .1055613458 * a - .0638541728 * b) ** 3; s = (L - .0894841775 * a - 1.2914855480 * b) ** 3
    rgb = [delin(v) for v in (4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.7076147010 * s)]
    return rgb
def inside(rgb): return all(-1e-4 <= v <= 1 + 1e-4 for v in rgb)
def lch2hex(L, C, h):
    lo, hi = 0, C
    rgb = oklab2rgb(L, C * math.cos(h), C * math.sin(h))
    if not inside(rgb):                      # 색역을 벗어나면 채도를 줄여 맞춘다(스케일이 깨지지 않게)
        for _ in range(30):
            mid = (lo + hi) / 2
            if inside(oklab2rgb(L, mid * math.cos(h), mid * math.sin(h))): lo = mid
            else: hi = mid
        rgb = oklab2rgb(L, lo * math.cos(h), lo * math.sin(h))
    return rgb2hex(rgb)
def hex2lch(h):
    L, a, b = rgb2oklab(hex2rgb(h)); return L, math.hypot(a, b), math.atan2(b, a)
def rl(h): r, g, b = [lin(v) for v in hex2rgb(h)]; return .2126 * r + .7152 * g + .0722 * b
def cr(a, b): x, y = sorted([rl(a), rl(b)], reverse=True); return (x + .05) / (y + .05)

BRAND = dict(orange='#FF6A00', blue='#3659E3', ink='#1A1A1A', paper='#F7F6F2')
STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

def ramp(name, brand_step):
    """브랜드 원값을 brand_step에 고정하고, 위쪽은 .97까지 아래쪽은 .26까지 명도를 고르게 나눠 파생한다."""
    Lb, C0, h = hex2lch(BRAND[name]); k = STEPS.index(brand_step); out = {}
    for i, s in enumerate(STEPS):
        if i == k: out[s] = BRAND[name]; continue
        L = Lb + (.97 - Lb) * (k - i) / k if i < k else Lb - (Lb - .26) * (i - k) / (len(STEPS) - 1 - k)
        f = 1 - max(0, (L - .75)) * 2.4 if L > .75 else 1 - max(0, (.55 - L)) * 1.2     # 양 끝에서 채도를 줄인다
        out[s] = lch2hex(L, C0 * max(.18, f), h)
    return out, brand_step

orange, ok = ramp('orange', 500); blue, bk = ramp('blue', 600)

# 색각 이상 시뮬레이션(선형 RGB에 행렬 적용)
CVD = {'적색약(P)': [[.152286, 1.052583, -.204868], [.114503, .786281, .099216], [-.003882, -.048116, 1.051998]],
       '녹색약(D)': [[.367322, .860646, -.227968], [.280085, .672501, .047413], [-.011820, .042940, .968881]],
       '청색약(T)': [[1.255528, -.076749, -.178779], [-.078411, .930809, .147602], [.004733, .691367, .303900]]}
def cvd(h, M):
    c = [lin(v) for v in hex2rgb(h)]; return rgb2hex([delin(max(0, min(1, sum(M[i][j] * c[j] for j in range(3))))) for i in range(3)])
def de(a, b): A, B = rgb2oklab(hex2rgb(a)), rgb2oklab(hex2rgb(b)); return math.dist(A, B)

PAIRS = [  # (전경, 배경, 최소비율, 용도)
 ('ink', 'paper', 4.5, '본문 글자'), ('ink', 'soft', 4.5, '구획 위 글자'), ('ink', 'white', 4.5, '카드 위 글자'),
 ('ink', 'orange500', 4.5, '주황 채움 위 글자'), ('white', 'blue600', 4.5, '블루 섹션 위 글자'),
 ('muted', 'paper', 4.5, '보조 글자'), ('muted', 'soft', 4.5, '구획 위 보조 글자'), ('muted', 'white', 4.5, '카드 위 보조 글자'),
 ('orange700', 'paper', 4.5, '밝은 바탕 위 주황 라벨'), ('orange700', 'soft', 4.5, '구획 위 주황 라벨'), ('orange700', 'white', 4.5, '카드 위 주황 라벨'),
 ('ink', 'blue200', 4.5, '블루 위 옅은 도형 위 글자'), ('ink', 'blue600', 3.0, '블루 위 외곽선(그래픽)'), ('white', 'blue700', 4.5, '블루 눌림 상태 위 글자'),
 ('orange500', 'paper', 3.0, '주황 채움 면(그래픽)', 'outline'), ('blue600', 'paper', 3.0, '블루 면(그래픽)'), ('ink', 'paper', 3.0, '포커스 링'),
]
NAMED = {**BRAND, 'white': '#FFFFFF', 'soft': '#EEECE5', 'line': '#D8D6CE', 'muted': '#6C6A64', 'orange500': orange[500] if ok == 500 else orange[ok],
         'orange700': '', 'blue600': blue[bk], 'blue200': blue[200], 'blue700': blue[700]}
# 주황 글자용: 종이·구획·흰 바탕 모두 4.5 이상이 되는 가장 밝은 스텝을 고른다
for s in (600, 700, 800, 900):
    if all(cr(orange[s], NAMED[b]) >= 4.5 for b in ('paper', 'soft', 'white')): NAMED['orange700'] = orange[s]; ot = s; break
NAMED['orange500'] = BRAND['orange']

def report():
    print('## 스케일 (OKLCH, 브랜드 원값은 *)')
    print('| 스텝 | 주황 | 블루 |'); print('|---|---|---|')
    for s in STEPS: print(f"| {s} | `{orange[s]}`{'*' if orange[s] == BRAND['orange'] else ''} | `{blue[s]}`{'*' if blue[s] == BRAND['blue'] else ''} |")
    print(f"\n주황 글자용 스텝: {ot} → {NAMED['orange700']}")
    print('\n## 대비 검사 (WCAG 2.x 비율)'); print('| 전경 | 배경 | 비율 | 기준 | 판정 | 용도 |'); print('|---|---|---|---|---|---|')
    bad = 0
    for f, b, need, use, *flag in PAIRS:
        r = cr(NAMED[f], NAMED[b]); ok_ = r >= need; need_outline = flag and not ok_; bad += (not ok_) and not need_outline
        print(f"| {f} `{NAMED[f]}` | {b} `{NAMED[b]}` | {r:.2f} | {need} | {'통과' if ok_ else ('규칙: 잉크 외곽선 필수' if need_outline else '**실패**')} | {use} |")
    print('\n## 색각 이상 시뮬레이션: 브랜드 색끼리 구별되는가 (OKLab 거리, 0.10 미만이면 구별 어려움)')
    pr = [('orange', 'blue'), ('orange', 'ink'), ('blue', 'ink'), ('orange', 'paper'), ('blue', 'paper')]
    print('| 쌍 | 정상 | ' + ' | '.join(CVD) + ' |'); print('|---|---|' + '---|' * len(CVD))
    for a, b in pr:
        vals = [de(BRAND[a], BRAND[b])] + [de(cvd(BRAND[a], M), cvd(BRAND[b], M)) for M in CVD.values()]
        print(f"| {a}/{b} | " + ' | '.join(f"{v:.2f}{' ⚠' if v < .10 else ''}" for v in vals) + ' |')
    L1, C1, h1 = hex2lch(BRAND['orange']); L2, C2, h2 = hex2lch(BRAND['blue'])
    print(f"\n## 명도·채도 (OKLCH)\n- 주황 L {L1:.2f} C {C1:.2f} h {math.degrees(h1):.0f}°\n- 블루 L {L2:.2f} C {C2:.2f} h {math.degrees(h2):.0f}°\n- 명도 차 {abs(L1-L2):.2f}, 색상각 차 {abs(math.degrees(h1)-math.degrees(h2)):.0f}° (180°에 가까울수록 보색)")
    return bad

def css():
    L = ['/* 자동 생성: python3 docs/tools/color-tokens.py. 손으로 고치지 말고 스크립트와 plan-18을 고친다.',
         '   브랜드 원값 3개(주황·블루·잉크)는 로고 픽셀 실측. 나머지 스텝은 OKLCH에서 명도만 바꿔 만든 파생값. */', ':root {',
         '  /* 중립 */', f"  --ink: {BRAND['ink']};", f"  --paper: {BRAND['paper']};", '  --soft: #EEECE5;', '  --line: #D8D6CE;', '  --muted: #6C6A64;', '  --white: #FFFFFF;', '  /* 주황 (브랜드 = 500) */']
    L += [f'  --orange-{s}: {orange[s]};' for s in STEPS] + ['  /* 블루 (브랜드 = 600) */'] + [f'  --blue-{s}: {blue[s]};' for s in STEPS]
    L += ['  /* 역할: 화면에서는 역할 이름만 쓴다 */', '  --orange: var(--orange-500);', f'  --orange-text: var(--orange-{ot});   /* 밝은 바탕 위 주황 글자 */', '  --orange-soft: var(--orange-100);     /* 선택·강조의 옅은 배경 */',
          '  --blue: var(--blue-600);', '  --blue-hover: var(--blue-700);', '  --blue-tint: var(--blue-200);         /* 블루 위 비활성 도형 */', '  --on-blue: var(--white);', '  --on-orange: var(--ink);', '}']
    return '\n'.join(L) + '\n'

if __name__ == '__main__':
    bad = report()
    if '--check' not in sys.argv:
        open('site/assets/tokens.css', 'w', encoding='utf-8').write(css()); print('\n→ site/assets/tokens.css 작성')
    sys.exit(1 if bad else 0)
