# Database Schema

> Task: "Design a database schema for a multi-tenant SaaS app"

---

🏗️ **Architect**: Proposed schema using shared-database, shared-schema with `tenant_id` discrimination:

```sql
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  email       TEXT NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  project_id  UUID NOT NULL REFERENCES projects(id),
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Key decisions:
- Every table has `tenant_id` — no joins needed for isolation
- UUID primary keys — safe for distributed ID generation
- `UNIQUE(tenant_id, email)` — same email can exist across tenants
- No soft delete — keep it simple for v1

@Challenger?

---

😈 **Challenger**: Four issues, two are critical:

**CRITICAL:**
1. **No row-level security (RLS).** The schema relies entirely on application code to add `WHERE tenant_id = ?` to every query. One missed WHERE clause = cross-tenant data leak. With RLS, the database enforces isolation regardless of application bugs. This is the single most important security control in multi-tenant systems.

2. **CASCADE on tenant delete is a nuke.** If `REFERENCES tenants(id)` gets `ON DELETE CASCADE` (even accidentally), deleting a tenant wipes all their users, projects, and tasks in a single statement. For a SaaS app, tenant deletion should be a multi-step process with a grace period, not a cascade.

**Medium:**
3. **No indexes on `tenant_id`.** Every query will filter by tenant_id. Without indexes, you're doing full table scans. On a shared table with 10k tenants, this matters immediately.

4. **No `updated_at` column.** Every table needs it for sync, caching, and debugging. Adding it later requires a migration on every table.

---

🏗️ **Architect**: All valid. Revisions:

1. Enable RLS on all tables. Set policy: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`. Application sets `SET LOCAL app.tenant_id = '...'` at the start of each request.
2. No CASCADE on tenant FK. Default `RESTRICT` — application handles tenant deactivation with a `deactivated_at` column and a background job for cleanup after 30 days.
3. Add `CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id)` for all tables. Composite indexes where needed (e.g., `(tenant_id, project_id)` on tasks).
4. Add `updated_at TIMESTAMPTZ DEFAULT now()` to all tables with a trigger to auto-update.

@Builder: proceed with the revised migration.

---

💻 **Builder**: Implemented. Single migration file:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON projects
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON tasks
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_projects_tenant ON projects(tenant_id);
CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX idx_tasks_tenant_project ON tasks(tenant_id, project_id);
CREATE INDEX idx_tasks_tenant_assigned ON tasks(tenant_id, assigned_to);

-- Updated timestamps
ALTER TABLE tenants ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE projects ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

@Reviewer @Breaker: ready.

---

🔍 **Reviewer**: Solid migration. One issue:

The RLS policies only have `USING` (which controls SELECT/UPDATE/DELETE). They're missing `WITH CHECK` (which controls INSERT). Without `WITH CHECK`, a user in tenant A could potentially INSERT a row with `tenant_id` pointing to tenant B. Add `WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid)` to each policy.

Everything else is correct. The trigger approach for `updated_at` is standard. Indexes look right.

---

🧪 **Breaker**: Testing attack scenarios:

1. **Superuser bypasses RLS.** If the application connects as a superuser (or the table owner), RLS is silently skipped. Verify the app uses a non-owner role. Fix: `ALTER TABLE ... FORCE ROW LEVEL SECURITY` to enforce even for table owners.

2. **Cross-tenant reference via foreign key.** `tasks.assigned_to` references `users(id)` — but nothing prevents assigning a task to a user in a *different* tenant. A composite FK `REFERENCES users(tenant_id, id)` would enforce this at the database level, but requires a unique constraint on `(tenant_id, id)` in users. Worth the migration complexity.

3. **`current_setting` with unset variable.** If the application forgets to `SET app.tenant_id`, `current_setting()` throws. This is actually *good* — fail-closed. But add `current_setting('app.tenant_id', true)` to return NULL instead of erroring, then add `AND tenant_id IS NOT NULL` to the policy. This way a missing tenant_id returns zero rows instead of crashing.

4. **Tenant slug enumeration.** `slugs` are unique and in a non-RLS table. An attacker can probe `SELECT slug FROM tenants WHERE slug = 'competitor'` to discover which companies use the platform. Consider whether this matters for your threat model.

Bug 1 is critical — most ORMs connect as the table owner by default.

---

📊 **5 agents** · 6 messages · 2 revisions · 4 bugs caught · 1 file · 110s
