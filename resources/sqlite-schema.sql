CREATE TABLE punches (
    id TEXT PRIMARY KEY,
    project TEXT NOT NULL,
    inAt INTEGER NOT NULL,
    outAt INTEGER,
    rate REAL DEFAULT 0.0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    punchID TEXT REFERENCES punches,
    comment TEXT NOT NULL,
    createdAt TEXT NOT NULL
);
CREATE INDEX commentsToPunchesIndex ON comments(punchID);