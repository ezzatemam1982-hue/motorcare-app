with open(r'd:\car\motorcare-modular\scratch\test_user_session_isolation.cjs', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "console.log('\\n--- TEST 7: User A logs back in with existing credentials ---');",
    "console.log('\\n--- TEST 7: User A logs back in with existing credentials ---');\n    console.log('DEBUG: storage keys =', Object.keys(storage));\n    console.log('DEBUG: ezzat key =', storage['motorCare_AppState_ezzat_pro_gmail_com']);"
)

with open(r'd:\car\motorcare-modular\scratch\test_user_session_isolation.cjs', 'w', encoding='utf-8') as f:
    f.write(code)

print('Added debug prints')
