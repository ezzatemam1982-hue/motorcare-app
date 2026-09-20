import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

txt = open('scratch/fix_feedback_and_messages.py', 'r', encoding='utf-8').read()

# Remove emoji characters from print statements
lines = txt.split('\n')
new_lines = []
for line in lines:
    if 'print(' in line and any(ord(c) > 127 for c in line):
        # Keep but replace emojis
        line = line.replace('\u2705', '[OK]').replace('\u26a0\ufe0f', '[WARN]').replace('\u2139\ufe0f', '[INFO]').replace('\u274c', '[ERR]')
    new_lines.append(line)
txt = '\n'.join(new_lines)
open('scratch/fix_feedback_and_messages.py', 'w', encoding='utf-8').write(txt)
print('done')
