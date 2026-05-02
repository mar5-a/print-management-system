CREATE TABLE user_credentials (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_user_credentials_updated_at
    BEFORE UPDATE ON user_credentials
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO user_credentials (user_id, password_hash)
SELECT users.id, 'dev-seed-salt-001:c96f05da1dc69874f15968fcc81cca3dbd74a86d67fc40fb44969ce8362ad2703d2feb56a59e722b35b12c344d1db64e04418f6776fbb38da97f4de13bb33a63'
FROM users
WHERE users.username IN ('admin.user', 'tech.user', 'student.user')
ON CONFLICT (user_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();
