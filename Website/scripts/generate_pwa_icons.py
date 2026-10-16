import os
import math
from PIL import Image, ImageDraw, ImageFont

def create_heritage_icon(size, is_maskable=False):
    # Create image with transparent or solid background depending on maskable
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size / 2
    
    # Maskable icons must keep content within the inner 80% safe zone circle
    if is_maskable:
        # Full bleed background for maskable
        draw.rectangle([0, 0, size, size], fill=(156, 66, 18, 255)) # Terracotta brand #9C4212
        radius = size * 0.40
    else:
        radius = size * 0.46
        # Anti-aliased rounded circle badge
        draw.ellipse([center - radius, center - radius, center + radius, center + radius], fill=(156, 66, 18, 255))

    # Inner decorative gold ring
    gold_color = (212, 175, 55, 255) # #D4AF37
    inner_gold_radius = radius * 0.88
    ring_width = max(2, int(size * 0.015))
    draw.ellipse(
        [center - inner_gold_radius, center - inner_gold_radius, center + inner_gold_radius, center + inner_gold_radius],
        outline=gold_color,
        width=ring_width
    )

    # Secondary inner decorative dashed ring or soft accent
    soft_radius = inner_gold_radius * 0.94
    accent_color = (255, 235, 180, 140)
    for i in range(16):
        angle = (i * 360 / 16) * math.pi / 180
        dot_r = max(2, int(size * 0.012))
        dx = center + soft_radius * math.cos(angle)
        dy = center + soft_radius * math.sin(angle)
        draw.ellipse([dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r], fill=accent_color)

    # Architectural heritage temple/dome silhouette motif
    # Base platform
    base_w = size * 0.42
    base_h = size * 0.05
    base_top = center + size * 0.16
    draw.rounded_rectangle(
        [center - base_w / 2, base_top, center + base_w / 2, base_top + base_h],
        radius=int(size * 0.01),
        fill=(255, 245, 230, 255)
    )

    # Main monument columns / arches
    col_w = size * 0.04
    col_h = size * 0.16
    col_top = base_top - col_h
    # 4 Pillars
    p_positions = [-0.16, -0.06, 0.06, 0.16]
    for p in p_positions:
        x = center + size * p
        draw.rectangle([x - col_w / 2, col_top, x + col_w / 2, base_top], fill=(255, 245, 230, 255))

    # Central heritage dome / shikhar curve
    dome_bottom = col_top
    dome_top = center - size * 0.18
    # Arch between pillars
    draw.chord(
        [center - size * 0.18, col_top - size * 0.06, center + size * 0.18, col_top + size * 0.10],
        start=180, end=360, fill=(255, 245, 230, 255)
    )

    # Shikhara / Dome pyramid curve
    poly_points = [
        (center - size * 0.18, dome_bottom),
        (center - size * 0.14, dome_bottom - size * 0.10),
        (center - size * 0.06, dome_bottom - size * 0.18),
        (center, dome_top),
        (center + size * 0.06, dome_bottom - size * 0.18),
        (center + size * 0.14, dome_bottom - size * 0.10),
        (center + size * 0.18, dome_bottom)
    ]
    draw.polygon(poly_points, fill=gold_color)

    # Kalash / Finial on top
    kalash_r = max(2, int(size * 0.025))
    draw.ellipse(
        [center - kalash_r, dome_top - kalash_r * 2, center + kalash_r, dome_top],
        fill=(255, 245, 230, 255)
    )
    # Pinnacle spire
    draw.line(
        [(center, dome_top - kalash_r * 2), (center, dome_top - kalash_r * 3.5)],
        fill=gold_color,
        width=max(2, int(size * 0.012))
    )

    # Archway cutout in center for depth
    arch_w = size * 0.09
    arch_h = size * 0.11
    arch_t = base_top - arch_h
    draw.chord(
        [center - arch_w, arch_t - arch_w, center + arch_w, arch_t + arch_w],
        start=180, end=360, fill=(156, 66, 18, 255)
    )
    draw.rectangle([center - arch_w, arch_t, center + arch_w, base_top], fill=(156, 66, 18, 255))

    return img

def main():
    target_dir = r"c:\Users\bhanp\OneDrive\Documents\SIH_all_projects\aryan_work\DHAROHAR\DHAROHAR\Website\public\icons"
    os.makedirs(target_dir, exist_ok=True)

    # 192x192 Standard
    icon_192 = create_heritage_icon(192, is_maskable=False)
    icon_192.save(os.path.join(target_dir, "icon-192.png"), "PNG")
    print("Created icon-192.png")

    # 512x512 Standard
    icon_512 = create_heritage_icon(512, is_maskable=False)
    icon_512.save(os.path.join(target_dir, "icon-512.png"), "PNG")
    print("Created icon-512.png")

    # 512x512 Maskable (Android 8+ adaptive icons)
    maskable_512 = create_heritage_icon(512, is_maskable=True)
    maskable_512.save(os.path.join(target_dir, "maskable-512.png"), "PNG")
    print("Created maskable-512.png")

    # Apple Touch Icon (180x180)
    apple_icon = create_heritage_icon(180, is_maskable=True)
    apple_icon.save(os.path.join(target_dir, "apple-touch-icon.png"), "PNG")
    print("Created apple-touch-icon.png")

if __name__ == "__main__":
    main()
