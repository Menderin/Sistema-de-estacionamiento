from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from .database import Base

class RoleEnum(str, enum.Enum):
    admin = "admin"
    staff = "staff"
    user = "user"

class EstadoEnum(str, enum.Enum):
    disponible = "disponible"
    ocupado = "ocupado"
    solicitado = "solicitado"
    inhabilitado = "inhabilitado"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.user, nullable=False)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

class Sector(Base):
    __tablename__ = "sectores"

    id = Column(String(50), primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    imagen = Column(String(255), nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    actualizado_en = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    espacios = relationship("Espacio", back_populates="sector", cascade="all, delete-orphan")

class Espacio(Base):
    __tablename__ = "espacios"

    id = Column(String(50), primary_key=True, index=True)
    sector_id = Column(String(50), ForeignKey("sectores.id"), nullable=False, index=True)
    estado = Column(SQLEnum(EstadoEnum), default=EstadoEnum.disponible, nullable=False)
    observaciones = Column(String(255), nullable=True)
    foto_base64 = Column(Text, nullable=True)
    actualizado_por = Column(String(100), nullable=False, default="sistema")
    actualizado_en = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sector = relationship("Sector", back_populates="espacios")

class HistorialEspacio(Base):
    __tablename__ = "historial_espacios"

    id = Column(Integer, primary_key=True, index=True)
    espacio_id = Column(String(50), ForeignKey("espacios.id", ondelete="CASCADE"), nullable=False, index=True)
    estado_anterior = Column(SQLEnum(EstadoEnum), nullable=False)
    estado_nuevo = Column(SQLEnum(EstadoEnum), nullable=False)
    actualizado_por = Column(String(100), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    observaciones = Column(String(255), nullable=True)
    foto_base64 = Column(Text, nullable=True)

    espacio = relationship("Espacio")
