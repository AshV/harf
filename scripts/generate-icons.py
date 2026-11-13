import zlib
import struct
import os

def create_png(width, height, draw_func, filename):
    # RGBA image buffer: scanlines preceded by filter byte 0
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter byte 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    compressed = zlib.compress(bytes(raw_data), 9)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', len(ihdr_data)))
    png.extend(b'IHDR')
    png.extend(ihdr_data)
    png.extend(struct.pack('>I', ihdr_crc))
    
    # IDAT
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png.extend(struct.pack('>I', len(compressed)))
    png.extend(b'IDAT')
    png.extend(compressed)
    png.extend(struct.pack('>I', idat_crc))
    
    # IEND
    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(struct.pack('>I', iend_crc))
    
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Created {filename} ({width}x{height})")

def render_harf_icon(x, y, w, h, maskable=False):
    # Normalize coordinates from -1.0 to 1.0
    nx = (x - w / 2) / (w / 2)
    ny = (y - h / 2) / (h / 2)
    dist = (nx * nx + ny * ny) ** 0.5

    # Safe zone for maskable icon is within radius 0.8
    bg_radius = 0.95 if not maskable else 1.0

    # Colors
    bg_dark = (44, 24, 16, 255)       # #2C1810
    bg_terracotta = (184, 74, 42, 255) # #B84A2A
    gold = (212, 175, 55, 255)         # #D4AF37
    cream = (253, 251, 247, 255)       # #FDFBF7

    if not maskable and dist > bg_radius:
        return (0, 0, 0, 0)

    # Base background gradient (subtle diagonal)
    t = (nx + ny + 2) / 4.0
    r = int(bg_dark[0] * (1 - t) + bg_terracotta[0] * t)
    g = int(bg_dark[1] * (1 - t) + bg_terracotta[1] * t)
    b = int(bg_dark[2] * (1 - t) + bg_terracotta[2] * t)

    # Golden outer ring
    ring_radius = 0.72 if maskable else 0.82
    ring_width = 0.04
    if abs(dist - ring_radius) < ring_width:
        return gold

    # Inner decorative dots or circle
    inner_ring = 0.65 if maskable else 0.74
    if abs(dist - inner_ring) < 0.015:
        return (212, 175, 55, 180)

    # Center book / 'H' motif (Stylized 'ह' representation using geometric strokes)
    # Shirorekha (Top horizontal line)
    sy_top = -0.32 if maskable else -0.36
    if abs(ny - sy_top) < 0.05 and abs(nx) < 0.35:
        return cream

    # Little vertical stem
    if sy_top <= ny <= sy_top + 0.16 and abs(nx) < 0.045:
        return cream

    # Upper hook curve of 'ह'
    upper_c_dist = (nx * nx + (ny - (sy_top + 0.28)) ** 2) ** 0.5
    if 0.10 < upper_c_dist < 0.19 and nx > -0.05:
        return cream

    # Lower loop of 'ह'
    lower_c_dist = ((nx + 0.04) ** 2 + (ny - (sy_top + 0.48)) ** 2) ** 0.5
    if 0.12 < lower_c_dist < 0.21 and (nx < 0.12 or ny > sy_top + 0.45):
        return cream

    # Inner tail curve
    tail_dist = ((nx - 0.08) ** 2 + (ny - (sy_top + 0.60)) ** 2) ** 0.5
    if 0.08 < tail_dist < 0.16 and ny > sy_top + 0.52 and nx > -0.08:
        return gold

    return (r, g, b, 255)

os.makedirs('public', exist_ok=True)

# Generate standard PWA icons
create_png(192, 192, lambda x, y, w, h: render_harf_icon(x, y, w, h, False), 'public/pwa-192x192.png')
create_png(512, 512, lambda x, y, w, h: render_harf_icon(x, y, w, h, False), 'public/pwa-512x512.png')
create_png(512, 512, lambda x, y, w, h: render_harf_icon(x, y, w, h, True), 'public/pwa-maskable-512x512.png')
create_png(180, 180, lambda x, y, w, h: render_harf_icon(x, y, w, h, False), 'public/apple-touch-icon.png')
create_png(64, 64, lambda x, y, w, h: render_harf_icon(x, y, w, h, False), 'public/favicon.ico')
