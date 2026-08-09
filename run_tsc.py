import subprocess
import os

try:
    result = subprocess.run(['npx', 'tsc', '--noEmit'], 
                            cwd='/home/abdurauf/dasturlash/loyihalarim/CRM-oquv_markazlar_frontend',
                            capture_output=True, text=True)
    with open('ts_errors.txt', 'w') as f:
        f.write(result.stdout)
        f.write(result.stderr)
    print("TypeScript check finished.")
except Exception as e:
    print(f"Error running tsc: {e}")
