"""Генератор СИНТЕТИЧЕСКИХ учебных отпечатков (SVG). Реальных данных не содержит."""
import math, random, os, sys
FP = ['right_thumb','right_index','right_middle','right_ring','right_little',
      'left_little','left_ring','left_middle','left_index','left_thumb']

def make(seed, kind):
    rnd = random.Random(seed)
    cx, cy = 50 + rnd.uniform(-3, 3), 62 + rnd.uniform(-4, 4)
    a1, a2, p1, p2 = rnd.uniform(.03, .08), rnd.uniform(.02, .06), rnd.uniform(0, 6.28), rnd.uniform(0, 6.28)
    paths = []
    for k in range(2, 30):
        r = k * 2.15
        pts = []
        for t in range(0, 361, 6):
            th = math.radians(t)
            rr = r * (1 + a1 * math.sin(2 * th + p1) + a2 * math.sin(3 * th + p2))
            # петля/дуга/завиток: смещаем центр с ростом радиуса
            shift = {'loop': -0.55, 'arch': -0.9, 'whorl': 0}[kind] * k * 0.6
            x = cx + rr * 0.78 * math.cos(th)
            y = cy + shift + rr * 1.02 * math.sin(th) * (0.9 if kind == 'arch' and math.sin(th) < 0 else 1)
            pts.append((x, y))
        d = 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)
        paths.append(f'<path d="{d}"/>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130">'
            '<defs><clipPath id="c"><ellipse cx="50" cy="65" rx="43" ry="58"/></clipPath></defs>'
            '<rect width="100" height="130" fill="#fff"/>'
            '<g clip-path="url(#c)" fill="none" stroke="#222" stroke-width="1.15" stroke-linecap="round" opacity=".85">'
            + ''.join(paths) + '</g></svg>')

def run(card_ids, out):
    for cid in card_ids:
        slug = cid.replace('ДК', 'DK')
        d = os.path.join(out, slug); os.makedirs(d, exist_ok=True)
        for i in range(10):
            kind = ['loop', 'whorl', 'loop', 'arch', 'whorl'][(i + len(cid)) % 5]
            open(os.path.join(d, f'{i+1:02d}.svg'), 'w', encoding='utf-8').write(make(f'{cid}-{i}', kind))

if __name__ == '__main__':
    run(sys.argv[2:], sys.argv[1])
