#!/usr/bin/env python3
"""site/lab/wordmark.json(trace-wordmark.py 출력)을 landing.html의 <!--WM:START-->~<!--WM:END--> 사이에 넣는다."""
import json, re, sys
j = json.load(open('site/lab/wordmark.json'))
parts = []
for nm, d in j['letters'].items():
    x0, y0, x1, y1 = j['bbox'][nm]
    inner = f'<path class="body" d="{d}"/>'
    if nm == 'R':
        inner += f'<path class="nose" d="{j["nose"]}"/>'
        for i, (x, y, r) in enumerate(j['eyes']):
            inner += f'<circle class="eye" cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}"/>'
    parts.append(f'<g class="L" id="L-{nm}" data-cx="{(x0+x1)/2:.1f}" data-cy="{(y0+y1)/2:.1f}">{inner}</g>')
block = '\n' + '\n'.join(parts) + '\n'
p = 'site/lab/landing.html'; s = open(p, encoding='utf-8').read()
s2 = re.sub(r'(<!--WM:START-->).*?(<!--WM:END-->)', lambda m: m.group(1) + block + m.group(2), s, flags=re.S)
open(p, 'w', encoding='utf-8').write(s2); print('injected', len(block), 'bytes')
