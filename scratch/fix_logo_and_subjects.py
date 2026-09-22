# -*- coding: utf-8 -*-
"""
Fix:
1. Remove emojis from ALL email subjects (they show as diamonds in some mail clients)
2. Replace MC text blocks with professional SVG logo in all email HTML templates
3. Remove emojis from email HTML h1 headings
"""

# Professional compact SVG logo for dark email headers (inline, no external resources)
LOGO_SVG_HEADER = (
    '<div style="display:inline-block;margin-bottom:10px;">'
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 72" width="160" height="58">'
    '<rect width="200" height="72" rx="12" fill="rgba(0,0,0,0.25)"/>'
    '<g transform="translate(8,5)">'
    '<path d="M18 38 C18 31,30 25,44 25 L140 25 C154 25,166 31,166 38 L173 50 C175 54,171 58,165 58 L19 58 C13 58,9 54,11 50 Z" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/>'
    '<path d="M60 25 L71 9 L113 9 L124 25 Z" fill="rgba(255,255,255,0.28)"/>'
    '<rect x="12" y="43" width="7" height="4" rx="1" fill="#ffffff" opacity="0.9"/>'
    '<rect x="165" y="43" width="7" height="4" rx="1" fill="#fca5a5" opacity="0.85"/>'
    '<circle cx="52" cy="58" r="10" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.65)" stroke-width="2.5"/>'
    '<circle cx="52" cy="58" r="3.5" fill="rgba(255,255,255,0.4)"/>'
    '<circle cx="132" cy="58" r="10" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.65)" stroke-width="2.5"/>'
    '<circle cx="132" cy="58" r="3.5" fill="rgba(255,255,255,0.4)"/>'
    '</g>'
    '<text x="100" y="69" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">Motor<tspan fill="#7dd3fc">Care</tspan></text>'
    '</svg>'
    '</div>'
)

files = ['index.html', 'src/index.html']

for filename in files:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content

        # =====================================================================
        # FIX 1: Remove 🚗 emoji from feedback user subject line
        # =====================================================================
        content = content.replace(
            'const userSubject = `\U0001f697 \u062a\u0623\u0643\u064a\u062f \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0642\u062a\u0631\u0627\u062d\u0643 / \u0631\u0633\u0627\u0644\u062a\u0643 \u0628\u0646\u062c\u0627\u062d | \u0639\u0627\u0626\u0644\u0629 MotorCare`;',
            'const userSubject = `[MotorCare] \u062a\u0623\u0643\u064a\u062f \u0627\u0633\u062a\u0644\u0627\u0645 \u0631\u0633\u0627\u0644\u062a\u0643 | \u0639\u0627\u0626\u0644\u0629 MotorCare`;'
        )

        # =====================================================================
        # FIX 2: Remove 🚗 emoji from plainText body
        # =====================================================================
        content = content.replace(
            '\u0623\u0647\u0644\u0627\u064b \u0628\u0643 \u0645\u0639\u0646\u0627 \u0641\u064a \u0639\u0627\u0626\u0644\u0629 MotorCare! \U0001f697',
            '\u0623\u0647\u0644\u0627\u064b \u0628\u0643 \u0645\u0639\u0646\u0627 \u0641\u064a \u0639\u0627\u0626\u0644\u0629 MotorCare!'
        )

        # =====================================================================
        # FIX 3: Remove 🚗 emoji from HTML h1 in user confirmation email
        # Line 25623: <h1 ...>أهلاً بك معنا في عائلة MotorCare! 🚗</h1>
        # =====================================================================
        content = content.replace(
            '\u0623\u0647\u0644\u0627\u064b \u0628\u0643 \u0645\u0639\u0646\u0627 \u0641\u064a \u0639\u0627\u0626\u0644\u0629 MotorCare! \U0001f697<',
            '\u0623\u0647\u0644\u0627\u064b \u0628\u0643 \u0645\u0639\u0646\u0627 \u0641\u064a \u0639\u0627\u0626\u0644\u0629 MotorCare!<'
        )
        # Also in HTML body paragraph
        content = content.replace(
            '\u0623\u0647\u0644\u0627\u064b \u0628\u0643 \u0645\u0639\u0646\u0627 \u0641\u064a \u0639\u0627\u0626\u0644\u0629 MotorCare! \U0001f697<br>',
            '\u0623\u0647\u0644\u0627\u064b \u0628\u0643 \u0645\u0639\u0646\u0627 \u0641\u064a \u0639\u0627\u0626\u0644\u0629 MotorCare!<br>'
        )

        # =====================================================================
        # FIX 4: Replace MC text block with SVG logo in user feedback email
        # =====================================================================
        old_mc = (
            '<div style="display: inline-block; width: 52px; height: 52px; '
            'line-height: 52px; background: rgba(255,255,255,0.18); border: 2px solid '
            'rgba(255,255,255,0.3); border-radius: 18px; font-size: 24px; font-weight: 900; '
            'color: #ffffff; margin-bottom: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.2);">MC</div>'
        )
        content = content.replace(old_mc, LOGO_SVG_HEADER)

        # =====================================================================
        # FIX 5: Replace MC text block in account activation email
        # =====================================================================
        old_mc2 = (
            '<div style="display: inline-block; width: 48px; height: 48px; '
            'line-height: 48px; background: rgba(255,255,255,0.12); border: 2px solid '
            'rgba(255,255,255,0.25); border-radius: 18px; margin-bottom: 12px; '
            'font-size: 22px; font-weight: 900; color: #ffffff;">MC</div>'
        )
        content = content.replace(old_mc2, LOGO_SVG_HEADER)

        # =====================================================================
        # FIX 6: Add logo before h1 in OTP email (no MC block there)
        # =====================================================================
        old_otp_h1 = (
            '<h1 style="margin: 0; font-size: 26px; font-weight: 900; '
            'letter-spacing: -1px;">\u0631\u0645\u0632 \u062a\u0641\u0639\u064a\u0644 '
            '\u0648\u062a\u0648\u062b\u064a\u0642 \u062d\u0633\u0627\u0628\u0643 \u0641\u064a MotorCare</h1>'
        )
        new_otp_h1 = (
            LOGO_SVG_HEADER +
            '<h1 style="margin: 8px 0 0 0; font-size: 26px; font-weight: 900; '
            'letter-spacing: -1px;">\u0631\u0645\u0632 \u062a\u0641\u0639\u064a\u0644 '
            '\u0648\u062a\u0648\u062b\u064a\u0642 \u062d\u0633\u0627\u0628\u0643 \u0641\u064a MotorCare</h1>'
        )
        content = content.replace(old_otp_h1, new_otp_h1)

        # =====================================================================
        # FIX 7: Add logo before h1 in activation success email
        # =====================================================================
        old_act_h1 = (
            '<h1 style="margin: 0; font-size: 26px; font-weight: 900; '
            'letter-spacing: -0.5px;">\u0645\u0631\u062d\u0628\u0627\u064b '
            '\u0628\u0643 \u0641\u064a MotorCare</h1>'
        )
        new_act_h1 = (
            LOGO_SVG_HEADER +
            '<h1 style="margin: 8px 0 0 0; font-size: 26px; font-weight: 900; '
            'letter-spacing: -0.5px;">\u0645\u0631\u062d\u0628\u0627\u064b '
            '\u0628\u0643 \u0641\u064a MotorCare</h1>'
        )
        content = content.replace(old_act_h1, new_act_h1)

        # =====================================================================
        # FIX 8: Add logo before h1 in forgot password email
        # =====================================================================
        old_forgot_h1 = (
            '<h1 style="margin: 0; font-size: 26px; font-weight: 900; '
            'letter-spacing: -1px;">\u0631\u0645\u0632 \u0627\u0633\u062a\u0639\u0627\u062f\u0629 '
            '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</h1>'
        )
        new_forgot_h1 = (
            LOGO_SVG_HEADER +
            '<h1 style="margin: 8px 0 0 0; font-size: 26px; font-weight: 900; '
            'letter-spacing: -1px;">\u0631\u0645\u0632 \u0627\u0633\u062a\u0639\u0627\u062f\u0629 '
            '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</h1>'
        )
        content = content.replace(old_forgot_h1, new_forgot_h1)

        if content != original:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            changed = sum(1 for a, b in zip(original.split('\n'), content.split('\n')) if a != b)
            print('[OK] Fixed ' + filename + ' (' + str(changed) + ' lines changed)')
        else:
            print('[WARN] No changes in: ' + filename)

    except FileNotFoundError:
        print('[SKIP] Not found: ' + filename)
    except Exception as e:
        print('[ERR] ' + filename + ': ' + str(e))

print('Done.')
