#!/usr/bin/env python3
"""홈 섹션을 카드뉴스 기준표로 잰다. 사용: python3 docs/tools/card-lint.py site/index.html
기준(plan-16 §2, v2): 제목 ≤ 24자 · h2 1개 · 조작 요소 ≤ 4개 · 글자는 두 방식으로 잰다.
  - 카드가 없는 섹션: 섹션 전체 ≤ 160자(첫 장 ≤ 80자)
  - 카드(ol.rows li, li.proj, li.slide)가 있는 섹션: 카드 한 장 ≤ 90자, 카드 밖 글자 ≤ 120자
글자 수는 공백 제외, svg·script·style·hidden 요소 제외. 실무 관행에서 온 눈금이라 절대값이 아니다."""
import re, sys
from html.parser import HTMLParser

class P(HTMLParser):
    def __init__(s): super().__init__(); s.secs=[]; s.cur=None; s.skip=0; s.h=None; s.rows=0; s.card=None; s.hid=[]
    def handle_starttag(s, t, a):
        a=dict(a); cls=a.get('class') or ''
        if t=='section': s.cur=dict(id=a.get('id') or '?', hero='hero' in cls, text=0, out=0, cards=[], h=[], ctl=0); s.secs.append(s.cur)
        if t in ('script','style','svg'): s.skip+=1
        if 'hidden' in a and t in ('button','a','div','span'): s.hid.append(t); s.skip+=1
        if not s.cur or s.skip: return
        if t=='ol' and 'rows' in cls.split(): s.rows=1
        if t=='li' and (s.rows or {'proj','slide'} & set(cls.split())): s.card=0
        if t in ('h1','h2'): s.h=''
        if t in ('a','button'): s.cur['ctl']+=1
    def handle_endtag(s, t):
        if t in ('script','style','svg'): s.skip=max(0,s.skip-1)
        if s.hid and t==s.hid[-1]: s.hid.pop(); s.skip=max(0,s.skip-1)
        if not s.cur: return
        if t in ('h1','h2') and s.h is not None: s.cur['h'].append(re.sub(r'\s+','',s.h)); s.h=None
        if t=='li' and s.card is not None: s.cur['cards'].append(s.card); s.card=None
        if t=='ol': s.rows=0
        if t=='section': s.cur=None
    def handle_data(s, d):
        if s.cur and not s.skip:
            n=len(re.sub(r'\s+','',d)); s.cur['text']+=n
            if s.card is not None: s.card+=n
            else: s.cur['out']+=n
            if s.h is not None: s.h+=d

p=P(); p.feed(open(sys.argv[1],encoding='utf-8').read())
print(f"{'섹션':<10}{'제목':>5}{'조작':>5}{'카드':>5}{'카드당 최대':>10}{'카드 밖/전체':>12}  판정")
for c in p.secs:
    hl=max([len(x) for x in c['h']] or [0]); bad=[]; cards=c['cards']
    if hl>24: bad.append(f'제목 {hl}자>24')
    if c['ctl']>4 and not cards: bad.append(f"조작 {c['ctl']}>4")
    if len(c['h'])>1 and not c['hero']: bad.append('h2 여러 개')
    if cards:
        if max(cards)>90: bad.append(f'카드 {max(cards)}자>90')
        if c['out']>120: bad.append(f"카드 밖 {c['out']}자>120")
        mid=f"{c['out']}"
    else:
        lim=80 if c['hero'] else 160
        if c['text']>lim: bad.append(f"글자 {c['text']}>{lim}")
        mid=f"{c['text']}"
    print(f"{c['id']:<10}{hl:>5}{c['ctl']:>5}{len(cards):>5}{(max(cards) if cards else 0):>10}{mid:>12}  {'OK' if not bad else ', '.join(bad)}")
