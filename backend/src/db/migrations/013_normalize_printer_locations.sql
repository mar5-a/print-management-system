UPDATE printers
SET location = CASE name
    WHEN 'HP MFP M830 - 22/339' THEN 'Room 339 - Building 22'
    WHEN 'Printer A1' THEN 'Room 101 - Building A'
    WHEN 'Printer B2' THEN 'Room 202 - Building B'
    WHEN 'Printer C3' THEN 'Room 303 - Building C'
    WHEN 'Printer D1' THEN 'Room 001 - Library'
    ELSE location
END
WHERE name IN (
    'HP MFP M830 - 22/339',
    'Printer A1',
    'Printer B2',
    'Printer C3',
    'Printer D1'
);
