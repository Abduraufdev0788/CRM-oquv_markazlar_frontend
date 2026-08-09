import urllib.request
import json

try:
    req = urllib.request.Request("http://localhost:8001/api/v1/finance/payments/", headers={"Authorization": "Bearer fake"})
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"Error: {e}")
