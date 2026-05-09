UPDATE printers
SET
    connector_options = COALESCE(connector_options, '{}'::jsonb)
        || jsonb_build_object(
            'storedJobMode', 'personal_pin_to_print',
            'hpPjlHold', 'ON',
            'hpPjlHoldType', 'PRIVATE',
            'retentionBehavior', 'delete_after_panel_release_when_supported'
        ),
    notes = CONCAT_WS(
        E'\n',
        NULLIF(notes, ''),
        'Updated HP PJL mode to private personal job semantics so device storage should clear after panel release when supported by the printer.'
    ),
    updated_at = NOW()
WHERE connector_type = 'hp_pjl_stored_job';
