UPDATE printers
SET
    connector_type = 'windows_queue',
    connector_target = 'HP-M830-22-339',
    connector_options = COALESCE(connector_options, '{}'::jsonb) || jsonb_build_object(
        'windowsQueueTarget', 'HP-M830-22-339',
        'windowsQueueShare', '\\PRINTSOL-STU1\HP-M830-22-339',
        'windowsDriver', 'HP LaserJet flow MFP M830 PCL 6',
        'copyStrategy', 'submit_each_copy'
    ),
    hosted_on = 'Windows connector',
    notes = CONCAT_WS(
        E'\n',
        NULLIF(notes, ''),
        'MVP release path now prioritizes Windows queue connector submission. Raw socket remains a legacy diagnostic.'
    ),
    updated_at = NOW()
WHERE name = 'HP MFP M830 - 22/339';
