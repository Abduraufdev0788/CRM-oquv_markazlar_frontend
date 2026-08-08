import asyncio
from httpx import AsyncClient

async def test():
    async with AsyncClient(base_url="http://localhost:8001/api/v1") as client:
        # User auth token is needed for get_group, but let's see if we can get list_groups
        # since list_groups might have room eagerly loaded now.
        pass

if __name__ == "__main__":
    asyncio.run(test())
