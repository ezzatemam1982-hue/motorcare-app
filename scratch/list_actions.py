import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

actions = set(re.findall(r'action\s*:\s*[\'"]([^\'"]+)[\'"]', text))
print('Webhook Actions found:')
for a in sorted(actions):
    print('-', a)
