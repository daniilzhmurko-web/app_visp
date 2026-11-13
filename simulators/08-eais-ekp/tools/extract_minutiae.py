#!/usr/bin/env python3
"""Извлечение эталонных минуций из изображений assets/fingerprints/*.webp (скелетизация гребней).
Результат: data/fp_minutiae.json — для каждого изображения список точек в логических координатах 0..400.
Требуются (только для разработки): numpy, scipy, opencv-python, scikit-image.   Запуск: python3 tools/extract_minutiae.py [--debug]"""
import json, os, sys
import numpy as np, cv2
from scipy import ndimage as ndi
from skimage.morphology import skeletonize

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NB = [(-1, -1), (-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1)]

def neighbours(sk, y, x):
    h, w = sk.shape
    return [(y + dy, x + dx) for dy, dx in NB if 0 <= y + dy < h and 0 <= x + dx < w and sk[y + dy, x + dx]]

def crossing(sk, y, x):
    ring = [sk[y + dy, x + dx] for dy, dx in NB]
    return sum(abs(int(ring[i]) - int(ring[(i + 1) % 8])) for i in range(8)) // 2

def prune_spurs(sk, L=9):
    """Удаляет короткие ответвления (< L пикселей), заканчивающиеся окончанием и упирающиеся в разветвление."""
    sk = sk.copy()
    for _ in range(2):
        ys, xs = np.nonzero(sk)
        for y, x in zip(ys, xs):
            if not sk[y, x] or crossing(sk, y, x) != 1: continue
            path = [(y, x)]; prev = None; cur = (y, x)
            while len(path) <= L:
                nxt = [p for p in neighbours(sk, *cur) if p != prev and p not in path]
                if len(nxt) != 1:
                    break
                prev, cur = cur, nxt[0]; path.append(cur)
                if crossing(sk, *cur) >= 3: break
            else:
                continue
            if len(nxt) >= 2 or (len(nxt) == 0 and False) or crossing(sk, *cur) >= 3:
                if len(path) < L:
                    for p in path[:-1]: sk[p] = False
        sk = skeletonize(sk)
    return sk

def coherence(gray, win=17):
    gx = cv2.Sobel(gray.astype(np.float32), cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(gray.astype(np.float32), cv2.CV_32F, 0, 1, ksize=3)
    a = cv2.boxFilter(gx * gx, -1, (win, win)); b = cv2.boxFilter(gy * gy, -1, (win, win)); c = cv2.boxFilter(gx * gy, -1, (win, win))
    lam = np.sqrt((a - b) ** 2 + 4 * c ** 2)
    coh = lam / (a + b + 1e-6)
    ang = 0.5 * np.arctan2(2 * c, a - b)    # направление градиента
    return coh, (ang + np.pi / 2) % np.pi   # ориентация гребня

def gabor_enhance(gray, ori, period=8.5, n=16):
    g = (gray.astype(np.float32) - cv2.GaussianBlur(gray.astype(np.float32), (0, 0), 12))
    g = g / (np.sqrt(cv2.GaussianBlur(g * g, (0, 0), 12)) + 1e-3)
    r = 13; y, x = np.mgrid[-r:r + 1, -r:r + 1].astype(np.float32); resp = []
    for i in range(n):
        t = np.pi * i / n
        xr = x * np.cos(t + np.pi / 2) + y * np.sin(t + np.pi / 2)
        k = np.exp(-(x * x + y * y) / (2 * 4.2 ** 2)) * np.cos(2 * np.pi * xr / period); resp.append(cv2.filter2D(g, -1, k / np.abs(k).sum()))
    idx = np.round(ori / np.pi * n).astype(int) % n
    return np.take_along_axis(np.stack(resp), idx[None], axis=0)[0]

def extract(path, mask_rows, GW, GH):
    g0 = cv2.imread(path, 0); h, w = g0.shape
    g = cv2.GaussianBlur(g0, (0, 0), 1.0)
    coh, ori = coherence(g0, 15)
    enh = gabor_enhance(255 - g0, cv2.GaussianBlur(np.cos(2 * ori).astype(np.float32), (0, 0), 3) * 0 + ori)   # гребни светлые на инвертированном
    b = enh > 0.02
    b = ndi.binary_opening(b); b = ndi.binary_closing(b)
    m = np.zeros((h, w), bool)
    for r in range(GH):
        for c in range(GW):
            if mask_rows[r][c] == '1': m[int(r * h / GH):int((r + 1) * h / GH), int(c * w / GW):int((c + 1) * w / GW)] = True
    m_in = ndi.binary_erosion(m, iterations=9)
    sk = skeletonize(b & m)
    lab, nl = ndi.label(sk, structure=np.ones((3, 3)))
    size = ndi.sum(sk, lab, range(1, nl + 1))
    islands = []
    for i, s in enumerate(size, 1):               # короткие изолированные гребни = островки; совсем мелкие — шум
        if 7 <= s <= 18:
            yy, xx = np.nonzero(lab == i); islands.append((int(xx.mean()), int(yy.mean())))
        if s < 19: sk[lab == i] = False
    sk = prune_spurs(sk)
    dark = cv2.boxFilter(b.astype(np.float32), -1, (21, 21))
    pts = []
    ys, xs = np.nonzero(sk & m_in)
    for y, x in zip(ys, xs):
        if y < 2 or x < 2 or y >= h - 2 or x >= w - 2: continue
        cn = crossing(sk, y, x)
        if cn not in (1, 3): continue
        if coh[y, x] < 0.38 or dark[y, x] > 0.68 or dark[y, x] < 0.30: continue   # пятна, смазанные и пустые зоны
        t = 'ending' if cn == 1 else 'bifurcation'
        # направление для окончания — по трассировке скелета
        ang = float(np.degrees(ori[y, x]))
        if t == 'ending':
            path = [(y, x)]; cur = (y, x)
            for _ in range(8):
                nx = [p for p in neighbours(sk, *cur) if p not in path]
                if not nx: break
                cur = nx[0]; path.append(cur)
            ang = float(np.degrees(np.arctan2(y - path[-1][0], x - path[-1][1])) % 360)
        pts.append([x, y, t, ang, float(coh[y, x])])
    for x, y in islands:
        if m_in[y, x] and coh[y, x] > 0.25: pts.append([x, y, 'island', float(np.degrees(ori[y, x])), float(coh[y, x])])
    # слияние близких точек и отбраковка «разорванных» гребней/шипов
    pts.sort(key=lambda p: -p[4]); keep = []
    for p in pts:
        if all(np.hypot(p[0] - q[0], p[1] - q[1]) > 9 for q in keep): keep.append(p)
    final = []
    for p in keep:
        near = [q for q in keep if q is not p and np.hypot(p[0] - q[0], p[1] - q[1]) < 14]
        if p[2] == 'ending' and any(q[2] == 'ending' for q in near if np.hypot(p[0]-q[0],p[1]-q[1]) < 8): continue          # два окончания напротив = разрыв гребня
        if p[2] == 'ending' and any(q[2] == 'bifurcation' for q in near if np.hypot(p[0]-q[0],p[1]-q[1]) < 8): continue   # шип у разветвления
        final.append(p)
    return h, w, final

def main():
    masks = json.load(open(os.path.join(ROOT, 'data', 'fp_masks.json'))); GW, GH = masks['w'], masks['h']
    out = []; dbg = '--debug' in sys.argv
    for i in range(60):
        h, w, pts = extract(os.path.join(ROOT, 'assets', 'fingerprints', f'fp_{i:02d}.webp'), masks['masks'][i], GW, GH)
        out.append([{'x': round(p[0] / w * 400), 'y': round(p[1] / h * 400), 'type': p[2], 'angle': round(p[3]) % 360} for p in sorted(pts, key=lambda p: -p[4])])
        if dbg:
            im = cv2.cvtColor(cv2.imread(os.path.join(ROOT, 'assets', 'fingerprints', f'fp_{i:02d}.webp'), 0), cv2.COLOR_GRAY2BGR)
            col = {'ending': (255, 80, 0), 'bifurcation': (0, 200, 0), 'island': (0, 140, 255)}
            for p in pts: cv2.circle(im, (int(p[0]), int(p[1])), 4, col[p[2]], 1)
            cv2.imwrite(f'/tmp/min_{i:02d}.png', cv2.resize(im, (w * 2, h * 2)))
    with open(os.path.join(ROOT, 'data', 'fp_minutiae.json'), 'w', encoding='utf-8') as f:
        f.write('[\n' + ',\n'.join(json.dumps(x, separators=(',', ':')) for x in out) + '\n]\n')
    n = [len(x) for x in out]
    print('минуций на изображение: min', min(n), 'медиана', sorted(n)[len(n) // 2], 'max', max(n))
    from collections import Counter
    print(Counter(p['type'] for x in out for p in x))

if __name__ == '__main__': main()
