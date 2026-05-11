# src/clients/kis_client.py
import time
from dataclasses import dataclass
from datetime import datetime

import requests

from src.config.settings import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


@dataclass
class DailyPrice:
    date: str          # YYYYMMDD
    open: int
    high: int
    low: int
    close: int
    volume: int
    change_rate: float


class KisClient:
    def __init__(self) -> None:
        self._session = requests.Session()
        self._session.headers.update({"content-type": "application/json"})
        self._access_token: str | None = None
        self._token_expires_at: datetime | None = None

    # ── 토큰 관리 ────────────────────────────────────────────────────

    def _get_access_token(self) -> str:
        if (
            self._access_token
            and self._token_expires_at
            and datetime.now() < self._token_expires_at
        ):
            return self._access_token

        resp = self._session.post(
            f"{settings.kis_base_url}/oauth2/tokenP",
            json={
                "grant_type": "client_credentials",
                "appkey":     settings.kis_app_key,
                "appsecret":  settings.kis_app_secret,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        self._access_token = data["access_token"]
        # 만료 10분 전에 갱신
        expires_in = int(data.get("expires_in", 86400))
        self._token_expires_at = datetime.fromtimestamp(
            time.time() + expires_in - 600
        )

        logger.info("KIS 액세스 토큰 발급 완료")
        return self._access_token

    def _auth_headers(self, tr_id: str) -> dict:
        return {
            "authorization": f"Bearer {self._get_access_token()}",
            "appkey":        settings.kis_app_key,
            "appsecret":     settings.kis_app_secret,
            "tr_id":         tr_id,
        }

    # ── 일별 주가 조회 ────────────────────────────────────────────────

    def fetch_daily_prices(
        self,
        stock_code: str,
        start_date: str,  # YYYYMMDD
        end_date: str,    # YYYYMMDD
    ) -> list[DailyPrice]:
        """
        기간별 일별 주가 (최대 100일)
        100일 초과 시 분할 호출 필요
        """
        try:
            resp = self._session.get(
                f"{settings.kis_base_url}/uapi/domestic-stock/v1/quotations/inquire-daily-price",
                headers=self._auth_headers("FHKST01010400"),
                params={
                    "FID_COND_MRKT_DIV_CODE": "J",
                    "FID_INPUT_ISCD":         stock_code,
                    "FID_INPUT_DATE_1":        start_date,
                    "FID_INPUT_DATE_2":        end_date,
                    "FID_PERIOD_DIV_CODE":     "D",
                    "FID_ORG_ADJ_PRC":         "0",  # 수정주가
                },
                timeout=10,
            )
            data = resp.json()

            if data.get("rt_cd") != "0":
                logger.warning(f"[{stock_code}] KIS 주가 조회 실패: {data.get('msg1')}")
                return []

            return [
                DailyPrice(
                    date=item["stck_bsop_date"],
                    open=int(item["stck_oprc"]),
                    high=int(item["stck_hgpr"]),
                    low=int(item["stck_lwpr"]),
                    close=int(item["stck_clpr"]),
                    volume=int(item["acml_vol"]),
                    change_rate=float(item["prdy_ctrt"]),
                )
                for item in (data.get("output2") or [])
                if item.get("stck_clpr", "0") != "0"  # 거래 없는 날 제외
            ]
        except Exception as e:
            logger.error(f"[{stock_code}] fetch_daily_prices 오류: {e}")
            return []

    def close(self) -> None:
        self._session.close()
