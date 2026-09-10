-- Audit finding: user_role_history.source could not record a startup reconciliation,
-- so legacy accounts whose users.role predated UserRoleSyncService had no way to be
-- realigned and traced. Add RECONCILIATION as a fourth valid source.
DO $$
DECLARE cname text;
BEGIN
    SELECT con.conname INTO cname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'user_role_history'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%source%';
    IF cname IS NOT NULL THEN
        EXECUTE 'ALTER TABLE user_role_history DROP CONSTRAINT ' || quote_ident(cname);
    END IF;
END $$;

ALTER TABLE user_role_history
    ADD CONSTRAINT user_role_history_source_check
    CHECK (source IN ('MANDATE_CHANGE', 'STATUS_CHANGE', 'ADMIN_OVERRIDE', 'RECONCILIATION'));
