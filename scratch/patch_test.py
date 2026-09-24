with open(r'd:\car\motorcare-modular\scratch\test_user_session_isolation.cjs', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("'js/features/dashboard.js',", "'js/features/dashboard.js',\n    'js/features/maintenance.js',\n    'js/features/fuel.js',")
code = code.replace("Date: Date,", "Date: Date,\n    Event: class Event { constructor(type) { this.type = type; } },\n    GOOGLE_OAUTH_CLIENT_ID: 'test_client_id',")

with open(r'd:\car\motorcare-modular\scratch\test_user_session_isolation.cjs', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched successfully')
