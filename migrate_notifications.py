import asyncio
import sys
import os

# Add backend to path
sys.path.append("/home/abdurauf/dasturlash/loyihalarim/CRM-oquv_markazlar")

from app.database import engine, Base
from app.models.system import Notification

async def main():
    print("Dropping notifications table...")
    async with engine.begin() as conn:
        await conn.run_sync(Notification.__table__.drop, checkfirst=True)
        await conn.run_sync(Base.metadata.create_all)
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
