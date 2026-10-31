import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Primary: MySQL 8.0, Fallback: SQLite
MYSQL_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/roadguard_tn")
SQLITE_FALLBACK_URL = "sqlite:///./roadguard_tn.db"

try:
    engine = create_engine(
        MYSQL_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={"connect_timeout": 5}
    )
    # Quick probe
    with engine.connect() as conn:
        pass
    print(f"Connected successfully to MySQL Database: {MYSQL_URL.split('@')[-1]}")
except Exception as e:
    print(f"MySQL connection unavailable ({e}). Falling back to SQLite local database.")
    engine = create_engine(SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

