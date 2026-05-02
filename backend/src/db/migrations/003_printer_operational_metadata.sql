ALTER TABLE printers
    ADD COLUMN serial_number VARCHAR(255),
    ADD COLUMN notes TEXT,
    ADD COLUMN toner_level INTEGER NOT NULL DEFAULT 100 CHECK (toner_level >= 0 AND toner_level <= 100);

UPDATE printers
SET
    serial_number = 'HP-M830-22-339',
    notes = 'Primary MVP test printer. Raw socket and Windows queue spikes have both printed successfully.',
    toner_level = 100
WHERE name = 'HP MFP M830 - 22/339';
