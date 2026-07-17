from __future__ import annotations

# 4개 repository(company/financial/stock/company_score)가 공유하는
# snake_case→camelCase 변환 + upsert 패턴
import uuid

from sqlalchemy.orm import Session


def snake_to_camel(key: str) -> str:
    head, *rest = key.split("_")
    return head + "".join(w[:1].upper() + w[1:] for w in rest)


def upsert_by_filter(session: Session, model: type, mapped: dict, filter_keys: list[str]) -> None:
    filters = {k: mapped[k] for k in filter_keys}
    existing = session.query(model).filter_by(**filters).first()
    if existing:
        for key, val in mapped.items():
            if key not in filter_keys and hasattr(existing, key):
                setattr(existing, key, val)
    else:
        session.add(model(id=str(uuid.uuid4()), **mapped))
