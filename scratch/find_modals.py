import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    l = line.strip()
    if any(k in l for k in ['type="file"', 'accept="image', 'handleImageInput', 'CameraSource', 'openImageAttachmentActionSheet']):
        print(f"L{i}: {l[:150]}")
