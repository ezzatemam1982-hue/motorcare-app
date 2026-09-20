import urllib.request

url1 = 'https://script.google.com/macros/s/AKfycbw9i9HjQRN3909_EPXzWz6ZzbDqXJDYoIudlwPVa6mvECeCx9PQoXNDnwpo9RrpxjKe2A/exec'
url2 = 'https://script.google.com/macros/s/AKfycbwvSY5bjKSPoC59wi-fYg-pqFq8KrAjZMoRyujKx7NEmYsWMxCx1oZ6c_R3LaoHiDNc/exec'

for idx, u in enumerate([url1, url2]):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            with open(f'scratch/url{idx+1}.html', 'w', encoding='utf-8') as out:
                out.write(html)
            print(f'Saved url{idx+1}.html ({len(html)} bytes)')
    except Exception as e:
        print(f'URL {idx+1} error: {e}')
