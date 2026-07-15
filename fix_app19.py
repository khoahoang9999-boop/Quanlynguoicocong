with open('src/App.tsx', 'r') as f:
    code = f.read()

# Let's count divs in the whole file
opens = code.count('<div')
closes = code.count('</div>')
print(f"Total: opens {opens}, closes {closes}")

# Let's count in the whole aside block
aside_start = code.find('<aside className={`')
aside_end = code.find('</aside>', aside_start) + len('</aside>')
aside_content = code[aside_start:aside_end]

o = aside_content.count('<div')
c = aside_content.count('</div>')
print(f"Aside block: opens {o}, closes {c}")
