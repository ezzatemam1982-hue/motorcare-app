# -*- coding: utf-8 -*-
import urllib.request, re, base64, sys
sys.stdout.reconfigure(encoding='utf-8')

client_id = '681024358152-hg4p231ebqr7572ckq3apf73prv3e2s5.apps.googleusercontent.com'

test_uris = [
    'https://ezzatemam1982-hue.github.io',
    'https://ezzatemam1982-hue.github.io/',
    'https://ezzatemam1982-hue.github.io/MotorCare-App',
    'https://ezzatemam1982-hue.github.io/MotorCare-App/',
    'https://ezzatemam1982-hue.github.io/index.html',
    'https://ezzatemam1982-hue.github.io/MotorCare-App/index.html',
    'http://localhost',
    'http://localhost/',
    'http://localhost/index.html',
    'http://localhost:3000',
    'http://localhost:3000/',
    'http://localhost:3000/index.html',
    'http://localhost:8080',
    'http://localhost:8080/',
    'http://localhost:8089',
    'http://localhost:8089/',
    'http://localhost:8089/index.html',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8089',
    'http://127.0.0.1:8089/index.html',
    'https://motorcare.app',
    'https://motorcare.app/',
    'https://motorcare-app.web.app',
    'https://motorcare-app.firebaseapp.com'
]

for uri in test_uris:
    u = f'https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}&redirect_uri={urllib.parse.quote(uri, safe="")}&response_type=token%20id_token&scope=openid%20profile%20email&prompt=select_account&nonce=123'
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as resp:
            final_url = resp.geturl()
            if 'authError=' in final_url:
                err_b64 = final_url.split('authError=')[1].split('&')[0]
                try:
                    dec = base64.b64decode(err_b64 + '===').decode('utf-8', errors='ignore')
                    err_name = dec[:30].replace('\n', ' ')
                except:
                    err_name = 'error'
                print(f"[FAIL] {uri} -> {err_name}")
            else:
                print(f"[SUCCESS MATCH!] ===> {uri} <===")
    except urllib.error.HTTPError as e:
        print(f"[HTTP {e.code}] {uri}")
    except Exception as ex:
        print(f"[EX] {uri} -> {ex}")
