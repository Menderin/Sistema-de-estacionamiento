from typing import TYPE_CHECKING

try:
    from backend.modules.parking.schemas import (
        Estado,
        EspacioBase,
        EspacioCreate,
        EspacioUpdate,
        EspacioUpdateEstado,
        EspacioOut,
        SectorBase,
        SectorCreate,
        SectorUpdate,
        SectorOut,
    )
    from backend.modules.users.schemas import Role, UserBase, UserCreate, UserUpdate, UserOut
    from backend.modules.auth.schemas import LoginRequest, Token, TokenData
    from backend.modules.dashboard.schemas import DashboardMetrics
except Exception:
    from ..modules.parking.schemas import (
        Estado,
        EspacioBase,
        EspacioCreate,
        EspacioUpdate,
        EspacioUpdateEstado,
        EspacioOut,
        SectorBase,
        SectorCreate,
        SectorUpdate,
        SectorOut,
    )
    from ..modules.users.schemas import Role, UserBase, UserCreate, UserUpdate, UserOut
    from ..modules.auth.schemas import LoginRequest, Token, TokenData
    from ..modules.dashboard.schemas import DashboardMetrics

# Public API
__all__ = [
    "Estado",
    "EspacioBase",
    "EspacioCreate",
    "EspacioUpdate",
    "EspacioUpdateEstado",
    "EspacioOut",
    "SectorBase",
    "SectorCreate",
    "SectorUpdate",
    "SectorOut",
    "Role",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserOut",
    "LoginRequest",
    "Token",
    "TokenData",
    "DashboardMetrics",
]
