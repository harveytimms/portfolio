"""Resize, rotate and strip metadata from source photos for the site.

Usage (from the repo root):
    python3 tools/prepare_images.py SOURCE.jpg images/<project>/<name>.jpg [--max 1600]

Photos are saved as progressive JPEG (quality 82), diagrams as optimised PNG,
with EXIF (including GPS) removed. Prints the <figure> snippet to paste into
index.html with the correct width and height.
"""
import sys
from pathlib import Path
from PIL import Image, ImageOps


def prepare(src, dst, max_edge=1600):
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)
    if max(im.size) > max_edge:
        im.thumbnail((max_edge, max_edge), Image.LANCZOS)
    if dst.suffix.lower() in (".jpg", ".jpeg"):
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert("RGB")
        im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
    else:
        im.save(dst, "PNG", optimize=True)
    return im.size


if __name__ == "__main__":
    args = sys.argv[1:]
    max_edge = 1600
    if "--max" in args:
        i = args.index("--max")
        max_edge = int(args[i + 1])
        del args[i:i + 2]
    src, dst = args
    w, h = prepare(src, dst, max_edge)
    print(f'<figure class="shot"><img src="{dst}" width="{w}" height="{h}" alt="" loading="lazy" decoding="async"><figcaption>CAPTION</figcaption></figure>')
