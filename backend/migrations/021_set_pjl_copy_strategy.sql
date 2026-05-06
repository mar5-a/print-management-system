UPDATE printers
SET
    connector_options = COALESCE(connector_options, '{}'::jsonb) || jsonb_build_object(
        'copyStrategy', 'pjl_qty',
        'storedJobMode', 'pin_to_print',
        'hpPjlHold', 'STORE',
        'hpPjlHoldType', 'PRIVATE'
    ),
    updated_at = NOW()
WHERE connector_type = 'hp_pjl_stored_job';
