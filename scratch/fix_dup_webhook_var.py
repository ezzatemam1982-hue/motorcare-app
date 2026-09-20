# -*- coding: utf-8 -*-
"""
Fix duplicate const webhookUrl in sendAccountActivatedSuccessEmail
"""

for fpath in ['index.html', 'src/index.html']:
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()

    target = """  <div style="background: #f1f5f9; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.8;">
    نتمنى لك دائماً قيادة آمنة وتجربة استثنائية مع سيارتك<br>
    <strong>فريق عمل MotorCare</strong> • <span style="direction: ltr; display: inline-block;">motorcare.auto@gmail.com</span>
  </div>
</div>`;

            const webhookUrl = getAppWebhookUrl();
            const welcomePayload = {"""

    replacement = """  <div style="background: #f1f5f9; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.8;">
    نتمنى لك دائماً قيادة آمنة وتجربة استثنائية مع سيارتك<br>
    <strong>فريق عمل MotorCare</strong> • <span style="direction: ltr; display: inline-block;">motorcare.auto@gmail.com</span>
  </div>
</div>`;

            const welcomePayload = {"""

    if target in c:
        c = c.replace(target, replacement, 1)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f'[{fpath}] Fixed duplicate webhookUrl declaration.')
    else:
        print(f'[{fpath}] Pattern not found!')
