# src/clients/dart_client.py
import io
import time
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Literal

import requests

from src.config.settings import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

ReportCode = Literal["11011", "11012", "11013", "11014"]
# 11011: 사업보고서 | 11012: 반기보고서 | 11013: 1분기 | 11014: 3분기

FsDiv = Literal["CFS", "OFS"]
# CFS: 연결재무제표 | OFS: 별도재무제표


@dataclass
class CorpInfo:
    corp_code: str
    corp_name: str
    stock_code: str | None
    corp_cls: str   # Y: 코스피, K: 코스닥, N: 코넥스, E: 기타
    ceo_nm: str | None
    induty_code: str | None


@dataclass
class FinancialItem:
    account_nm: str
    thstrm_amount: str   # 당기 금액 (문자열, 콤마 포함)
    frmtrm_amount: str   # 전기 금액


class DartClient:
    BASE_URL = "https://opendart.fss.or.kr/api"

    def __init__(self) -> None:
        self._session = requests.Session()
        self._session.params = {"crtfc_key": settings.dart_api_key}  # type: ignore[assignment]

    # ── 전체 기업 목록 (ZIP → XML 파싱) ─────────────────────────────

    def fetch_corp_code_list(self) -> list[dict]:
        """
        DART 전체 기업 corpCode ZIP 다운로드 후 파싱
        반환: [{"corp_code": "00126380", "corp_name": "삼성전자", "stock_code": "005930"}]
        """
        logger.info("DART corp code list 다운로드 시작")

        resp = self._session.get(
            f"{self.BASE_URL}/corpCode.xml",
            timeout=30,
        )
        resp.raise_for_status()

        with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
            xml_bytes = z.read(z.namelist()[0])

        root = ET.fromstring(xml_bytes)
        companies = []

        for item in root.findall("list"):
            stock_code = item.findtext("stock_code", "").strip()
            if not stock_code:
                continue  # 비상장 기업 제외

            companies.append({
                "corp_code":  item.findtext("corp_code", "").strip(),
                "corp_name":  item.findtext("corp_name", "").strip(),
                "stock_code": stock_code,
            })

        logger.info(f"DART 상장기업 {len(companies)}개 파싱 완료")
        return companies

    # ── 단일 기업 상세 정보 ──────────────────────────────────────────

    def fetch_company_info(self, corp_code: str) -> CorpInfo | None:
        try:
            resp = self._session.get(
                f"{self.BASE_URL}/company.json",
                params={"corp_code": corp_code},
                timeout=10,
            )
            data = resp.json()

            if data.get("status") != "000":
                logger.warning(f"[{corp_code}] DART company info 실패: {data.get('message')}")
                return None

            return CorpInfo(
                corp_code=data["corp_code"],
                corp_name=data["corp_name"],
                stock_code=data.get("stock_code") or None,
                corp_cls=data.get("corp_cls", ""),
                ceo_nm=data.get("ceo_nm") or None,
                induty_code=data.get("induty_code") or None,
            )
        except Exception as e:
            logger.error(f"[{corp_code}] fetch_company_info 오류: {e}")
            return None

    # ── 재무제표 ──────────────────────────────────────────────────────

    def fetch_financial_statement(
        self,
        corp_code: str,
        year: int,
        fs_div: FsDiv = "CFS",
        reprt_code: ReportCode = "11011",
    ) -> list[FinancialItem]:
        try:
            resp = self._session.get(
                f"{self.BASE_URL}/fnlttSinglAcntAll.json",
                params={
                    "corp_code":  corp_code,
                    "bsns_year":  year,
                    "reprt_code": reprt_code,
                    "fs_div":     fs_div,
                },
                timeout=15,
            )
            data = resp.json()

            if data.get("status") == "013":   # 데이터 없음
                return []
            if data.get("status") != "000":
                logger.warning(f"[{corp_code}/{year}] DART 재무제표 실패: {data.get('message')}")
                return []

            return [
                FinancialItem(
                    account_nm=item.get("account_nm", "").strip(),
                    thstrm_amount=item.get("thstrm_amount", ""),
                    frmtrm_amount=item.get("frmtrm_amount", ""),
                )
                for item in (data.get("list") or [])
            ]
        except Exception as e:
            logger.error(f"[{corp_code}/{year}] fetch_financial_statement 오류: {e}")
            return []

    def close(self) -> None:
        self._session.close()
