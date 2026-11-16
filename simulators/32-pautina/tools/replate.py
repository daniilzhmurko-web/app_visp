#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Замена настоящих госномеров на ВЫМЫШЛЕННЫЕ (деперсонализация фото для учебных материалов).

Использование:
    python tools/replate.py <папка_с_фото> <выходная_папка> [--font путь/к/шрифту.ttf] [--seed 1]

Для каждого изображения нужен файл разметки YOLO с тем же именем и расширением .txt
(«класс xc yc w h» в долях кадра) — рамка номера. Например, такую разметку содержит набор
Car_plate_detecting_dataset (Hugging Face, CC BY 4.0). Фото без разметки пропускаются.

Результат: в выходной папке — обработанные фото, копии файлов разметки и plates.csv (file;plate),
который читает tools/import-photos.js. Требуется Pillow:  pip install pillow
"""
import csv, os, random, shutil, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageStat

LETTERS = "АВЕКМНОРСТУХ"
FONT_CANDIDATES = [
    "C:/Windows/Fonts/arialnb.ttf", "C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]


def pick_font(path):
    for p in ([path] if path else []) + FONT_CANDIDATES:
        if p and os.path.exists(p):
            return p
    sys.exit("Не найден шрифт с кириллицей. Укажите его параметром --font (например, arialbd.ttf).")


def fake_plate(rnd):
    region = rnd.choice(["77", "99", "177", "197", "50", "78", "23", "16", "63", "52"])
    return rnd.choice(LETTERS) + "%03d" % rnd.randint(1, 999) + rnd.choice(LETTERS) + rnd.choice(LETTERS) + region


def draw_plate(img, box, plate, font_path):
    W, H = img.size
    xc, yc, w, h = box
    x0, y0 = int((xc - w / 2) * W), int((yc - h / 2) * H)
    x1, y1 = int((xc + w / 2) * W), int((yc + h / 2) * H)
    bw, bh = max(8, x1 - x0), max(4, y1 - y0)
    # яркость исходной области — чтобы заплатка не «светилась» на тёмном кадре
    lum = ImageStat.Stat(img.crop((x0, y0, x1, y1)).convert("L")).mean[0]
    k = max(.55, min(1.0, lum / 200 + .35))
    S = 4                                           # рисуем в увеличенном масштабе и уменьшаем (сглаживание)
    pw, ph = bw * S, bh * S
    patch = Image.new("RGB", (pw, ph), tuple(int(240 * k) for _ in range(3)))
    d = ImageDraw.Draw(patch)
    ink = (15, 15, 15)
    t = max(2, int(ph * .045))
    d.rounded_rectangle([0, 0, pw - 1, ph - 1], radius=int(ph * .08), outline=ink, width=t)
    split = int(pw * .76)
    d.line([(split, int(ph * .12)), (split, int(ph * .88))], fill=ink, width=max(2, t // 2))
    main, reg = plate[:6], plate[6:]
    # подбор размера шрифта по высоте/ширине левой части
    size = int(ph * .62)
    while size > 6:
        f = ImageFont.truetype(font_path, size)
        if d.textlength(main, font=f) <= split - int(pw * .06):
            break
        size -= 2
    f = ImageFont.truetype(font_path, size)
    d.text((int((split - d.textlength(main, font=f)) / 2), int(ph * .50)), main, font=f, fill=ink, anchor="lm")
    fr = ImageFont.truetype(font_path, int(ph * (.46 if len(reg) == 2 else .38)))
    d.text((split + int((pw - split - d.textlength(reg, font=fr)) / 2), int(ph * .42)), reg, font=fr, fill=ink, anchor="lm")
    fs = ImageFont.truetype(font_path, int(ph * .17))
    d.text((split + int((pw - split) * .12), int(ph * .80)), "RUS", font=fs, fill=ink, anchor="lm")
    patch = patch.resize((bw, bh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(max(.3, min(bw, 400) / 600)))
    img.paste(patch, (x0, y0))


def main():
    a = sys.argv[1:]
    if len(a) < 2:
        sys.exit(__doc__)
    src, dst = a[0], a[1]
    font_path = pick_font(a[a.index("--font") + 1] if "--font" in a else None)
    rnd = random.Random(int(a[a.index("--seed") + 1]) if "--seed" in a else 1)
    os.makedirs(dst, exist_ok=True)
    rows, skipped = [], []
    for fn in sorted(os.listdir(src)):
        stem, ext = os.path.splitext(fn)
        if ext.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        lab = os.path.join(src, stem + ".txt")
        if not os.path.exists(lab):
            skipped.append(fn)
            continue
        best = None
        for line in open(lab, encoding="utf-8"):
            p = line.split()
            if len(p) >= 5:
                xc, yc, w, h = map(float, p[1:5])
                if best is None or w * h > best[2] * best[3]:
                    best = (xc, yc, w, h)
        if best is None:
            skipped.append(fn)
            continue
        img = Image.open(os.path.join(src, fn)).convert("RGB")
        plate = fake_plate(rnd)
        draw_plate(img, best, plate, font_path)
        out_name = stem + ".jpg"
        img.save(os.path.join(dst, out_name), quality=90)
        shutil.copy(lab, os.path.join(dst, stem + ".txt"))
        rows.append((out_name, plate))
    with open(os.path.join(dst, "plates.csv"), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["file", "plate"])
        w.writerows(rows)
    print("Обработано: %d; пропущено без разметки: %d" % (len(rows), len(skipped)))
    for s in skipped[:10]:
        print("  пропущено:", s)
    print("Дальше: node tools/import-photos.js", dst)


if __name__ == "__main__":
    main()
