import re
import os

def check_file(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Just a very simple check for unmatched { } inside return ( ... );
    # This is not perfect for JSX but can help.
    stack = []
    lines = content.split('\n')
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char == '{':
                stack.append((i+1, j+1))
            elif char == '}':
                if stack:
                    stack.pop()
                else:
                    print(f"Unmatched }} at {filename}:{i+1}:{j+1}")
    if stack:
        print(f"Unmatched {{ in {filename} at {stack[-1]}")
    
    stack = []
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char == '(':
                stack.append((i+1, j+1))
            elif char == ')':
                if stack:
                    stack.pop()
                else:
                    print(f"Unmatched ) at {filename}:{i+1}:{j+1}")
    if stack:
        print(f"Unmatched ( in {filename} at {stack[-1]}")
        
    print(f"Checked {filename}")

check_file('src/pages/student/StudentDashboard.tsx')
check_file('src/pages/teacher/TeacherGroupDetails.tsx')
check_file('src/pages/admin/Users.tsx')
