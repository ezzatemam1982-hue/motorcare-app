with open(r'd:\car\motorcare-modular\scratch\test_user_session_isolation.cjs', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "let lastNotification = null;",
    """Object.keys(elements).forEach(k => {
    if (!elements[k].dispatchEvent) elements[k].dispatchEvent = () => true;
    if (!elements[k].style) elements[k].style = { setProperty: () => {}, removeProperty: () => {} };
    if (!elements[k].children) elements[k].children = [];
    if (!elements[k].classList) elements[k].classList = { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false };
});
let lastNotification = null;"""
)

with open(r'd:\car\motorcare-modular\scratch\test_user_session_isolation.cjs', 'w', encoding='utf-8') as f:
    f.write(code)

print('Updated elements mock')
