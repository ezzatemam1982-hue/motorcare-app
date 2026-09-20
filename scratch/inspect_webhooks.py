import urllib.request
import re

url1 = 'https://script.google.com/macros/s/AKfycbw9i9HjQRN3909_EPXzWz6ZzbDqXJDYoIudlwPVa6mvECeCx9PQoXNDnwpo9RrpxjKe2A/exec'
url2 = 'https://script.google.com/macros/s/AKfycbwvSY5bjKSPoC59wi-fYg-pqFq8KrAjZMoRyujKx7NEmYsWMxCx1oZ6c_R3LaoHiDNc/exec'

for idx, u in enumerate([url1, url2]):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            m = re.search(r'iframe\s+src="([^"]+)"', html)
            if m:
                iframe_url = m.group(1)
                print(f'URL {idx+1} iframe: {iframe_url[:100]}...')
                req2 = urllib.request.Request(iframe_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req2) as resp2:
                    body2 = resp2.read().decode('utf-8', errors='ignore')
                    print(f'URL {idx+1} content:\n{body2[:500]}\n')
            else:
                print(f'URL {idx+1} no iframe: {html[:300]}\n')
    except Exception as e:
        print(f'URL {idx+1} error: {e}')
