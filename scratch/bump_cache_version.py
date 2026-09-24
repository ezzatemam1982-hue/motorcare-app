import re

sw_files = [
    'sw.js',
    'service-worker.js',
    'src/sw.js',
    'src/service-worker.js',
    'dist/sw.js',
    'dist/service-worker.js'
]

pattern = re.compile(r"const CACHE_NAME = 'motorcare-cache-v[^']+';")
new_str = "const CACHE_NAME = 'motorcare-cache-v2.0.33';"

for path in sw_files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if pattern.search(content):
        updated = pattern.sub(new_str, content)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(updated)
        print(f'Updated {path} -> {new_str}')
    else:
        print(f'Pattern not found in {path}!')
