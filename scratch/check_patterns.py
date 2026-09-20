import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

checks = [
    'Saving to Cloud Firestore database',
    'Dispatching customer confirmation',
    'Saving & sending real email',
    'FEEDBACK_SUBMISSION',
    'action.*FEEDBACK',
    'تم استرجاع كراجك من السحابة',
    'القناة 1: الإرسال عبر خادم الويب هوك',
]

for term in checks:
    import re
    found = bool(re.search(term, content))
    print(term[:50] + ':', 'FOUND' if found else 'NOT FOUND')
