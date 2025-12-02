"""
AI-generated code: 95%

Human code: 5%

Framework-generated code: 0%
"""

from unittest.mock import AsyncMock, patch

import pytest

from app.db import db


@pytest.mark.asyncio
@patch("app.db.db.engine")
async def test_init_db_failure(mock_engine: AsyncMock):
    mock_engine.begin.side_effect = Exception("Failed to initialize database")

    with pytest.raises(Exception) as exc_info:
        await db.init_db()

    assert "Failed to initialize database" in str(exc_info.value)
