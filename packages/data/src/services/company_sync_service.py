from sqlalchemy.orm import Session

from src.clients.dart_client import DartClient
from src.repositories.company_repository import CompanyRepository
from src.utils.logger import get_logger

logger = get_logger(__name__)


class CompanySyncService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._dart = DartClient()
        self._company_repo = CompanyRepository(session)

    def sync(self) -> dict:
        companies = self._dart.fetch_corp_code_list()
        saved = self._company_repo.upsert_bulk(companies)
        self._session.commit()
        logger.info(f"기업 목록 동기화 완료: {saved}개")
        return {"synced": saved}

    def close(self) -> None:
        self._dart.close()
