from src.clients.dart_client import DartClient
from src.repositories.company_repository import CompanyRepository


class CompanySyncService:
    def __init__(self, db):
        self.db = db
        self.dart_client = DartClient()
        self.company_repository = CompanyRepository(db)

    async def sync(self):
        companies = await self.dart_client.get_corp_codes()

        for company in companies:
            stock_code = company.get("stock_code")

            if not stock_code:
                continue

            self.company_repository.upsert_company(
                {
                    "corp_code": company["corp_code"],
                    "corp_name": company["corp_name"],
                    "stock_code": stock_code,
                }
            )

        self.db.commit()