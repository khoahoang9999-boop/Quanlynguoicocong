with open('src/App.tsx', 'r') as f:
    code = f.read()

# I will write a simple python script to parse tags and find the mismatch.
# For simplicity, we just strip all strings, template literals, comments, etc.
# But it's easier to just do it mentally by printing the structure.

opens = []
for i, line in enumerate(code.split('\n'), start=1):
    if 730 <= i <= 1010:
        o = line.count('<div')
        c = line.count('</div>')
        if o > 0 or c > 0:
            print(f"Line {i:4d}: +{o} -{c}  | {line.strip()}")
