import urllib.request
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script\s+src=[\x22\x27]([^\x22\x27]+)[\x22\x27]', html)
styles = re.findall(r'<link\s+[^>]*href=[\x22\x27]([^\x22\x27]+\.css)[\x22\x27]', html)

items = [s for s in scripts + styles if not s.startswith('http')]
print(f'Testing {len(items)} local script and stylesheet links...')

failed = []
for item in items:
    url = f'http://127.0.0.1:8089/{item}'
    try:
        with urllib.request.urlopen(url) as req:
            if req.status != 200:
                failed.append((item, req.status))
    except Exception as e:
        failed.append((item, str(e)))

if failed:
    print('Failed resources:', failed)
else:
    print(f'ALL {len(items)} LOCAL MODULAR ASSETS RETURN 200 OK!')
