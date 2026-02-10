"""Couche de persistance SQLite pour le compteur de ciment."""

import sqlite3
import uuid
from datetime import datetime
from contextlib import contextmanager


class Database:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with self._connect() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    started_at TEXT NOT NULL,
                    ended_at TEXT,
                    total_conforme INTEGER DEFAULT 0,
                    total_rejete INTEGER DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS count_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    status TEXT NOT NULL,
                    identifier TEXT NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES sessions(id)
                );
                CREATE INDEX IF NOT EXISTS idx_events_session
                    ON count_events(session_id);
                CREATE INDEX IF NOT EXISTS idx_events_timestamp
                    ON count_events(timestamp);
            """)

    @contextmanager
    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())[:8]
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO sessions (id, started_at) VALUES (?, ?)",
                (session_id, datetime.now().isoformat()),
            )
        return session_id

    def end_session(self, session_id: str):
        with self._connect() as conn:
            conn.execute(
                "UPDATE sessions SET ended_at = ? WHERE id = ?",
                (datetime.now().isoformat(), session_id),
            )

    def add_event(self, session_id: str, status: str, identifier: str):
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO count_events (session_id, timestamp, status, identifier) VALUES (?, ?, ?, ?)",
                (session_id, datetime.now().isoformat(), status, identifier),
            )
            field = "total_conforme" if status == "conforme" else "total_rejete"
            conn.execute(
                f"UPDATE sessions SET {field} = {field} + 1 WHERE id = ?",
                (session_id,),
            )

    def get_session(self, session_id: str) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM sessions WHERE id = ?", (session_id,)
            ).fetchone()
            return dict(row) if row else None

    def get_events(self, session_id: str, limit=50, offset=0) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM count_events WHERE session_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?",
                (session_id, limit, offset),
            ).fetchall()
            return [dict(r) for r in rows]

    def get_all_sessions(self) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM sessions ORDER BY started_at DESC"
            ).fetchall()
            return [dict(r) for r in rows]

    def get_hourly_stats(self, session_id: str) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT
                    strftime('%H:00', timestamp) as hour,
                    SUM(CASE WHEN status = 'conforme' THEN 1 ELSE 0 END) as conforme,
                    SUM(CASE WHEN status = 'rejete' THEN 1 ELSE 0 END) as rejete
                FROM count_events
                WHERE session_id = ?
                GROUP BY hour
                ORDER BY hour
                """,
                (session_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    def get_event_count(self, session_id: str) -> int:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(*) as cnt FROM count_events WHERE session_id = ?",
                (session_id,),
            ).fetchone()
            return row["cnt"] if row else 0
