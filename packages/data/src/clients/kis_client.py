from __future__ import annotations

# src/clients/kis_client.py
import json
import os
import time
from dataclasses import dataclass
from datetime import date, datetime, timedelta

import requests

from src.config.settings import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

_TOKEN_CACHE_PATH = os.path.join(os.path.dirname(__file__), ".kis_token_cache.json")


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
        self._load_cached_token()

    # ── 토큰 관리 ────────────────────────────────────────────────────

    def _load_cached_token(self) -> None:
        try:
            if not os.path.exists(_TOKEN_CACHE_PATH):
                return
            with open(_TOKEN_CACHE_PATH) as f:
                cache = json.load(f)
            expires_at = datetime.fromisoformat(cache["expires_at"])
            if datetime.now() < expires_at:
                self._access_token = cache["access_token"]
                self._token_expires_at = expires_at
                logger.info("KIS 액세스 토큰 캐시에서 로드")
        except Exception:
            pass

    def _save_cached_token(self) -> None:
        try:
            with open(_TOKEN_CACHE_PATH, "w") as f:
                json.dump({
                    "access_token": self._access_token,
                    "expires_at": self._token_expires_at.isoformat(),
                }, f)
        except Exception:
            pass

    def _get_access_token(self) -> str:
        if (
            self._access_token
            and self._token_expires_at
            and datetime.now() < self._token_expires_at
        ):
            return self._access_token

        try:
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
        except Exception as e:
            # KIS limits token issuance to once per day — reuse yesterday's token if available
            logger.warning(f"KIS 토큰 발급 실패 (일일 한도 초과 가능): {e}")
            raise

        data = resp.json()
        self._access_token = data["access_token"]
        expires_in = int(data.get("expires_in", 86400))
        self._token_expires_at = datetime.fromtimestamp(
            time.time() + expires_in - 600
        )
        self._save_cached_token()
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
        기간별 일별 주가.
        KIS FHKST01010400는 호출당 최대 30 거래일을 반환한다. DATE_1을
        이전 청크의 가장 오래된 날짜 - 1일로 이동하며 반복 조회한다.
        API가 이전 청크와 동일한 날짜를 반환하면(페이지 고정) 중단한다.
        """
        start = datetime.strptime(start_date, "%Y%m%d").date()
        seen_dates: set[str] = set()
        all_prices: list[DailyPrice] = []
        current_end = end_date
        prev_oldest: date | None = None

        for _ in range(8):  # 최대 8 청크 = 약 240 거래일
            chunk = self._fetch_price_chunk(stock_code, start_date, current_end)
            if not chunk:
                break

            # 중복 제거 (API가 동일 레코드를 반복 반환하는 경우 대비)
            new_prices = [p for p in chunk if p.date not in seen_dates]
            if not new_prices:
                break
            for p in new_prices:
                seen_dates.add(p.date)
            all_prices.extend(new_prices)

            oldest = min(datetime.strptime(p.date, "%Y%m%d").date() for p in new_prices)
            if oldest == prev_oldest or oldest <= start:
                break
            prev_oldest = oldest
            current_end = (oldest - timedelta(days=1)).strftime("%Y%m%d")
            time.sleep(0.2)

        return all_prices

    def _fetch_price_chunk(
        self,
        stock_code: str,
        start_date: str,
        end_date: str,
    ) -> list[DailyPrice]:
        try:
            resp = self._session.get(
                f"{settings.kis_base_url}/uapi/domestic-stock/v1/quotations/inquire-daily-price",
                headers=self._auth_headers("FHKST01010400"),
                params={
                    "FID_COND_MRKT_DIV_CODE": "J",
                    "FID_INPUT_ISCD":         stock_code,
                    "FID_INPUT_DATE_1":        end_date,    # KIS: DATE_1 = 종료일 (더 최근)
                    "FID_INPUT_DATE_2":        start_date,  # KIS: DATE_2 = 시작일 (더 오래됨)
                    "FID_PERIOD_DIV_CODE":     "D",
                    "FID_ORG_ADJ_PRC":         "0",
                },
                timeout=10,
            )
            data = resp.json()
            rt_cd = data.get("rt_cd")
            msg1 = data.get("msg1", "")

            if rt_cd != "0":
                logger.warning(f"[{stock_code}] KIS 주가 조회 실패 rt_cd={rt_cd}: {msg1}")
                return []

            items = data.get("output") or []
            if not items:
                logger.warning(
                    f"[{stock_code}] KIS chunk ~{end_date}: output 비어있음 "
                    f"(rt_cd={rt_cd}, msg1={msg1})"
                )
            else:
                logger.info(f"[{stock_code}] KIS chunk ~{end_date}: {len(items)}건")

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
                for item in items
                if item.get("stck_clpr", "0") != "0"
            ]
        except Exception as e:
            logger.error(f"[{stock_code}] _fetch_price_chunk 오류: {e}")
            return []

    def close(self) -> None:
        self._session.close()
