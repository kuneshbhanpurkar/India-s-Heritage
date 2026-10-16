import os
from PIL import Image

def process_logo():
    source_file = r"c:\Users\bhanp\OneDrive\Documents\SIH_all_projects\aryan_work\DHAROHAR\DHAROHAR\Timeless Logo with Embossed Lotus.png"
    website_public = r"c:\Users\bhanp\OneDrive\Documents\SIH_all_projects\aryan_work\DHAROHAR\DHAROHAR\Website\public"
    website_icons = os.path.join(website_public, "icons")
    admin_public = r"c:\Users\bhanp\OneDrive\Documents\SIH_all_projects\aryan_work\DHAROHAR\DHAROHAR\Admin\public"
    admin_icons = os.path.join(admin_public, "icons")

    for d in [website_public, website_icons, admin_public, admin_icons]:
        os.makedirs(d, exist_ok=True)

    # Open 2000x2000 source image
    img = Image.open(source_file).convert("RGBA")
    width, height = img.size

    # Background color: (71, 13, 31, 255)
    bg_color = (71, 13, 31, 255)

    # 1. Full Square Logo (800x800)
    logo_800 = img.resize((800, 800), Image.Resampling.LANCZOS)
    for p in [os.path.join(website_public, "logo.png"), os.path.join(admin_public, "logo.png")]:
        logo_800.save(p, "PNG", optimize=True)
    print("Saved logo.png (800x800)")

    # 2. Tight cropped version (lotus + text) with balanced padding
    # Bounding box is X: 340..1640, Y: 600..1280
    crop_x1 = 280
    crop_x2 = 1720
    crop_y1 = 550
    crop_y2 = 1350
    cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    # Resize to max height 240 for web header
    cropped_ratio = cropped.width / cropped.height
    tight_h = 240
    tight_w = int(tight_h * cropped_ratio)
    logo_tight = cropped.resize((tight_w, tight_h), Image.Resampling.LANCZOS)
    for p in [os.path.join(website_public, "logo-brand.png"), os.path.join(admin_public, "logo-brand.png")]:
        logo_tight.save(p, "PNG", optimize=True)
    print("Saved logo-brand.png")

    # 3. Emblem/Lotus only crop (X: 500..1500, Y: 600..1100)
    lotus_crop = img.crop((500, 580, 1500, 1140))
    # Place on square burgundy background with margin
    emblem_square = Image.new("RGBA", (800, 800), bg_color)
    lotus_resized = lotus_crop.resize((650, int(650 * lotus_crop.height / lotus_crop.width)), Image.Resampling.LANCZOS)
    offset_x = (800 - lotus_resized.width) // 2
    offset_y = (800 - lotus_resized.height) // 2
    emblem_square.paste(lotus_resized, (offset_x, offset_y), lotus_resized)
    for p in [os.path.join(website_public, "logo-emblem.png"), os.path.join(admin_public, "logo-emblem.png")]:
        emblem_square.save(p, "PNG", optimize=True)
    print("Saved logo-emblem.png")

    # 4. PWA Icons (192, 512, maskable 512, apple touch 180, favicon 64)
    # 512x512
    icon_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    for p in [os.path.join(website_icons, "icon-512.png"), os.path.join(admin_icons, "icon-512.png")]:
        icon_512.save(p, "PNG", optimize=True)

    # 192x192
    icon_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    for p in [os.path.join(website_icons, "icon-192.png"), os.path.join(admin_icons, "icon-192.png")]:
        icon_192.save(p, "PNG", optimize=True)

    # Maskable 512 (with 15% inner padding to meet Android safe area specs)
    maskable = Image.new("RGBA", (512, 512), bg_color)
    content_scaled = img.resize((410, 410), Image.Resampling.LANCZOS)
    maskable.paste(content_scaled, (51, 51), content_scaled)
    for p in [os.path.join(website_icons, "maskable-512.png"), os.path.join(admin_icons, "maskable-512.png")]:
        maskable.save(p, "PNG", optimize=True)

    # Apple Touch Icon (180x180)
    apple_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
    for p in [os.path.join(website_icons, "apple-touch-icon.png"), os.path.join(admin_icons, "apple-touch-icon.png")]:
        apple_180.save(p, "PNG", optimize=True)

    # Favicon 64x64
    fav_64 = img.resize((64, 64), Image.Resampling.LANCZOS)
    for p in [os.path.join(website_public, "favicon.png"), os.path.join(admin_public, "favicon.png")]:
        fav_64.save(p, "PNG", optimize=True)

    print("All PWA icons and logos processed successfully for Website & Admin!")

if __name__ == "__main__":
    process_logo()
