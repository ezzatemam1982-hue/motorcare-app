# scratch/generate_android_icons.py
import os
from PIL import Image, ImageDraw

def generate_icons():
    source_icon_path = 'icon-512.png'
    if not os.path.exists(source_icon_path):
        source_icon_path = 'icon.png'
    
    img = Image.open(source_icon_path).convert('RGBA')
    print(f"Loaded source icon from {source_icon_path}: {img.size}")

    densities = {
        'mipmap-mdpi': (48, 108),
        'mipmap-hdpi': (72, 162),
        'mipmap-xhdpi': (96, 216),
        'mipmap-xxhdpi': (144, 324),
        'mipmap-xxxhdpi': (192, 432)
    }

    base_res = os.path.join('android', 'app', 'src', 'main', 'res')

    for folder, (icon_size, fg_size) in densities.items():
        folder_path = os.path.join(base_res, folder)
        os.makedirs(folder_path, exist_ok=True)

        # 1. ic_launcher.png (standard icon)
        launcher_img = img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        launcher_path = os.path.join(folder_path, 'ic_launcher.png')
        launcher_img.save(launcher_path, 'PNG')
        print(f"Saved {launcher_path} ({icon_size}x{icon_size})")

        # 2. ic_launcher_round.png (circular mask)
        round_img = Image.new('RGBA', (icon_size, icon_size), (0, 0, 0, 0))
        mask = Image.new('L', (icon_size, icon_size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, icon_size - 1, icon_size - 1), fill=255)
        round_img.paste(launcher_img, (0, 0), mask)
        round_path = os.path.join(folder_path, 'ic_launcher_round.png')
        round_img.save(round_path, 'PNG')
        print(f"Saved {round_path} ({icon_size}x{icon_size})")

        # 3. ic_launcher_foreground.png (adaptive foreground with safe zone padding ~66%)
        fg_img = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        inner_size = int(fg_size * 0.68)
        inner_scaled = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        offset = (fg_size - inner_size) // 2
        fg_img.paste(inner_scaled, (offset, offset), inner_scaled)
        fg_path = os.path.join(folder_path, 'ic_launcher_foreground.png')
        fg_img.save(fg_path, 'PNG')
        print(f"Saved {fg_path} ({fg_size}x{fg_size})")

    print("\n[SUCCESS] Successfully generated all Android mipmap app icons with MotorCare official branding!")

if __name__ == '__main__':
    generate_icons()
