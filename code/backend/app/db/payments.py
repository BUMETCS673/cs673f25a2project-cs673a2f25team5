"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

import logging
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any, cast
from uuid import UUID, uuid4

from sqlalchemy import (
    Column,
    DateTime,
    MetaData,
    Numeric,
    String,
    Table,
    and_,
    func,
    insert,
    select,
    update,
)
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.dialects.postgresql import UUID as SQLUUID
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql.elements import ColumnElement

from app.db.db import engine
from app.db.filters import FilterOperation
from app.models.payments import PaymentCreate, PaymentRead, PaymentStatus

logger = logging.getLogger(__name__)

metadata = MetaData()

# Map to existing DB enum type created by init SQL: payment_status
payment_status = PG_ENUM(
    "created",
    "processing",
    "succeeded",
    "failed",
    "canceled",
    name="payment_status",
    create_type=False,  # type already exists in DB from init SQL
)


payments = Table(
    "payments",
    metadata,
    Column("payment_id", SQLUUID(as_uuid=True), primary_key=True),
    Column("event_id", SQLUUID(as_uuid=True), nullable=False),
    Column("user_id", SQLUUID(as_uuid=True), nullable=False),
    Column("amount_usd", Numeric(10, 2), nullable=False),
    Column("currency", String(10), nullable=False),
    Column("status", cast(Any, payment_status), nullable=False),
    Column("stripe_checkout_session_id", String(128)),
    Column("stripe_payment_intent_id", String(128)),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)


def _apply_filters(q, cq, filters: list[FilterOperation] | None):
    if not filters:
        return q, cq
    conds: list[ColumnElement[Any]] = []
    for f in filters:
        col = getattr(payments.c, f.field, None)
        if col is None:
            raise ValueError(f"Invalid column: {f.field}")
        op = f.op.lower()
        if op in ("eq", "="):
            conds.append(col == f.value)
        elif op in ("neq", "!="):
            conds.append(col != f.value)
        elif op == "gt":
            conds.append(col > f.value)
        elif op == "gte":
            conds.append(col >= f.value)
        elif op == "lt":
            conds.append(col < f.value)
        elif op == "lte":
            conds.append(col <= f.value)
        elif op == "like":
            conds.append(col.like(f.value))
        elif op == "ilike":
            conds.append(col.ilike(f.value))
        else:
            raise ValueError(f"Unsupported op: {f.op}")
    if conds:
        wc = and_(*conds)
        q = q.where(wc)
        cq = cq.where(wc)
    return q, cq


async def create_payment_db(p: PaymentCreate) -> PaymentRead:
    try:
        now = datetime.now(UTC)
        vals = {
            "payment_id": uuid4(),
            "event_id": p.event_id,
            "user_id": p.user_id,
            "amount_usd": Decimal(p.amount_usd),
            "currency": p.currency,
            "status": p.status.value,
            "stripe_checkout_session_id": p.stripe_checkout_session_id,
            "stripe_payment_intent_id": p.stripe_payment_intent_id,
            "created_at": now,
            "updated_at": now,
        }
        stmt = insert(payments).values(vals).returning(payments)
        async with engine.begin() as conn:
            row = (await conn.execute(stmt)).mappings().first()
            return PaymentRead.model_validate(dict(row))
    except SQLAlchemyError as e:
        logger.error(f"create_payment_db error: {e}")
        raise ValueError(str(e)) from e


async def set_checkout_id(payment_id: UUID, checkout_id: str) -> None:
    try:
        stmt = (
            update(payments)
            .where(payments.c.payment_id == payment_id)
            .values(stripe_checkout_session_id=checkout_id, updated_at=datetime.now(UTC))
        )
        async with engine.begin() as conn:
            await conn.execute(stmt)
    except SQLAlchemyError as e:
        raise ValueError(str(e)) from e


async def set_status_by_checkout_session(
    checkout_id: str, *, status: PaymentStatus, payment_intent_id: str | None = None
) -> None:
    try:
        vals: dict[str, Any] = {"status": status.value, "updated_at": datetime.now(UTC)}
        if payment_intent_id:
            vals["stripe_payment_intent_id"] = payment_intent_id
        stmt = (
            update(payments)
            .where(payments.c.stripe_checkout_session_id == checkout_id)
            .values(**vals)
        )
        async with engine.begin() as conn:
            await conn.execute(stmt)
    except SQLAlchemyError as e:
        raise ValueError(str(e)) from e


async def get_payments_db(filters: list[FilterOperation] | None, offset: int, limit: int):
    try:
        q = select(payments)
        cq = select(func.count()).select_from(payments)
        q, cq = _apply_filters(q, cq, filters)
        q = q.order_by(payments.c.created_at.desc()).offset(offset).limit(limit)
        async with engine.begin() as conn:
            rows = (await conn.execute(q)).mappings().all()
            items = [PaymentRead.model_validate(dict(r)) for r in rows]
            total = int((await conn.scalar(cq)) or 0)
            return items, total
    except SQLAlchemyError as e:
        raise ValueError(str(e)) from e
