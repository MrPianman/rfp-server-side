-- Enable foreign key support (important for SQLite)
PRAGMA foreign_keys = ON;

-- Create Cars table
CREATE TABLE Cars (
    car_id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_name TEXT NOT NULL,
    plate_number TEXT,
    driver TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Create Goods table
CREATE TABLE Goods (
    good_id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    good_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    status TEXT,
    price REAL,
    created_at TEXT DEFAULT (datetime('now')),

    -- Link each good to a car
    FOREIGN KEY (car_id) REFERENCES Cars(car_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
