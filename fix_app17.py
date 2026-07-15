with open('src/App.tsx', 'r') as f:
    code = f.read()

aside_start = code.find('<aside className={`')
aside_end = code.find('</aside>', aside_start) + len('</aside>')
aside_content = code[aside_start:aside_end]

def count_divs(text):
    opens = text.count('<div')
    closes = text.count('</div>')
    return opens, closes

o, c = count_divs(aside_content)
print(f"Aside block: opens {o}, closes {c}")

if c > o:
    excess = c - o
    print(f"Removing {excess} extra </div> from aside block")
    parts = aside_content.rsplit('</div>', excess + 1)
    new_aside_content = '</div>'.join(parts[:-1]) + parts[-1]
    code = code.replace(aside_content, new_aside_content)
elif o > c:
    deficit = o - c
    print(f"Adding {deficit} </div> to aside block")
    # Add them right before </aside>
    new_aside_content = aside_content.replace('</aside>', ('</div>\n' * deficit) + '</aside>')
    code = code.replace(aside_content, new_aside_content)

with open('src/App.tsx', 'w') as f:
    f.write(code)
