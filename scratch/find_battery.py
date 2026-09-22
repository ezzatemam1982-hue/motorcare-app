import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

base = r'd:\car\MotorCare-App'

print("Searching ALL files for BATTERY_MARKET_DATA definition...", flush=True)
for root, dirs, files_list in os.walk(base):
    # Skip node_modules, .git, scratch
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'scratch', '.well-known']]
    for fname in files_list:
        if fname.endswith(('.js', '.html', '.json', '.ts')):
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                if 'BATTERY_MARKET_DATA' in content and ('=' in content[content.find('BATTERY_MARKET_DATA'):content.find('BATTERY_MARKET_DATA')+30]):
                    # Count occurrences of definition vs usage
                    lines = content.split('\n')
                    for i, line in enumerate(lines, 1):
                        if 'BATTERY_MARKET_DATA' in line and ('=' in line[:line.find('BATTERY_MARKET_DATA')+50]) and 'const' in line or 'let' in line or 'var' in line:
                            safe = line.strip()[:120].encode('ascii','replace').decode('ascii')
                            relpath = os.path.relpath(fpath, base)
                            print(f"  {relpath} L{i}: {safe}", flush=True)
            except Exception as e:
                pass

print("\nDone.", flush=True)
