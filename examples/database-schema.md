# Database Schema

> Task: "Design a database schema for a multi-tenant SaaS app"

---

🏗️ **Architect**: Proposed schema using shared-database, shared-schema with a `tenant_id` discriminator:

```sql
tenants
  id            UUID PRIMARY KEY
  name          VARCHAR(255) NOT NULL
  slug          VARCHAR(63) UNIQUE NOT NULL
  plan          VARCHAR(20) DEFAULT 'free'
  created_at    TIMESTAMPTZ DEFAULT now()

users
  id            UUID PRIMARY KEY
  tenant_id     UUID REFERENCES tenants(id)
  email         VARCHAR(255) NOT NULL
  password_hash VARCHAR(255) NOT NULL
  role          VARCHAR(20) DEFAULT 'member'
  created_at    TIMESTAMPTZ DEFAULT now()
  UNIQUE(tenant_id, email)

projects
  id            UUID PRIMARY KEY
  tenant_id     UUID REFERENCES tenants(id)
  name          VARCHAR(255) NOT NULL
  owner_id      UUID REFERENCES users(id)
  created_at    TIMESTAMPTZ DEFAULT now()

tasks
  id            UUID PRIMARY KEY
  project_id    UUID REFERENCES projects(id)
  title         VARCHAR(500) NOT NULL
  status        VARCHAR(20) DEFAULT 'open'
  assignee_id   UUID REFERENCES users(id)
  created_at    TIMESTAMPTZ DEFAULT now()
```

Key decisions:
- Shared schema with `tenant_id` on every table — simpler ops than schema-per-tenant
- UUIDs everywhere — no sequential ID leakage
- Unique email scoped to tenant — same person can exist in multiple tenants

@Challenger: attack this.

---

😈 **Challenger**: Five issues, two critical:

**CRITICAL:**
1. **No row-level security (RLS).** Every query must include `WHERE tenant_id = ?` manually. One missed WHERE clause in any query and you have a cross-tenant data leak. This is the #1 multi-tenant vulnerability. Enable Postgres RLS with a policy that filters on `current_setting('app.tenant_id')`, set per-request.

2. **CASCADE deletes are missing — or worse, implicit.** If a tenant is deleted, what happens to their users, projects, and tasks? With no `ON DELETE` clause, Postgres defaults to `RESTRICT`, so deleting a tenant fails. But if someone adds `CASCADE` later to "fix" it, a single `DELETE FROM tenants` wipes all associated data instantly with no soft-delete recovery.

**Medium:**
3. **No soft delete.** In a SaaS app, "delete" almost never means "destroy." Add `deleted_at TIMESTAMPTZ` columns and filter on `deleted_at IS NULL` in queries (or better, in the RLS policy).

4. **`tasks` has no `tenant_id`.** You're relying on joining through `projects` to get the tenant. This means every task query requires a join to projects just to enforce tenant isolation. Add `tenant_id` directly to `tasks` — denormalize for safety.

5. **No `updated_at` anywhere.** Every table needs `updated_at TIMESTAMPTZ` for audit trails, conflict detection, and cache invalidation.

---

🏗️ **Architect**: All valid, especially the RLS point. Revisions:

1. Enable RLS on all tenant-scoped tables. Policy: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`. Application sets this per-request with `SET LOCAL app.tenant_id = ?` inside the transaction.
2. Explicit `ON DELETE RESTRICT` on all foreign keys. Tenant deletion goes through a service that soft-deletes the tenant and all children in a transaction.
3. Add `deleted_at TIMESTAMPTZ` to tenants, users, projects, tasks. RLS policy amended: `AND deleted_at IS NULL`.
4. Add `tenant_id` to tasks with a foreign key to tenants. Denormalization is worth it for security.
5. Add `updated_at TIMESTAMPTZ DEFAULT now()` with a trigger to auto-update on row modification.

@Builder: create the migration.

---

💻 **Builder**: Migration SQL:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenants
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(63) UNIQUE NOT NULL,
  plan        VARCHAR(20) NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'member',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ,
  UNIQUE(tenant_id, email)
);

-- Projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name        VARCHAR(255) NOT NULL,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- Tasks
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  title       VARCHAR(500) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'open',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row-Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenants
  USING (id = current_setting('app.tenant_id')::uuid AND deleted_at IS NULL);
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id')::uuid AND deleted_at IS NULL);
CREATE POLICY tenant_isolation ON projects
  USING (tenant_id = current_setting('app.tenant_id')::uuid AND deleted_at IS NULL);
CREATE POLICY tenant_isolation ON tasks
  USING (tenant_id = current_setting('app.tenant_id')::uuid AND deleted_at IS NULL);
```

@Reviewer @Breaker: ready.

---

🔍 **Reviewer**: Solid migration. RLS policies are correct, soft delete is built into the policies, triggers handle `updated_at`. The `ON DELETE RESTRICT` everywhere prevents accidental cascading destruction.

One critical miss: **no indexes on `tenant_id` columns.** Every query hits the RLS policy, which filters on `tenant_id`. Without indexes, every row-level security check is a sequential scan. On tables with millions of rows, this turns every query into a full table scan.

Add:
```sql
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_tenant ON projects(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_tenant ON tasks(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id) WHERE deleted_at IS NULL;
```

Partial indexes with `WHERE deleted_at IS NULL` match the RLS policy, so Postgres can use them directly. This is not a nitpick — it is a performance cliff that appears only after the table grows past a few thousand rows.

---

🧪 **Breaker**: Attacking tenant isolation:

1. **Forgot to SET tenant_id.** If the application code forgets `SET LOCAL app.tenant_id = ?` before a query, `current_setting('app.tenant_id')` throws an error (setting does not exist). The query fails hard — which is actually the correct behavior. Fail-closed. But the error message leaks implementation details to the client. Fix: add `current_setting('app.tenant_id', true)` (the `true` makes it return NULL instead of throwing) and change the policy to `USING (... AND current_setting('app.tenant_id', true) IS NOT NULL)`.

2. **Superuser bypasses RLS.** The database owner and any role with `BYPASSRLS` attribute ignores all row-level security policies. If the application connects as the database owner (common in development), RLS provides zero protection. Fix: create a dedicated `app_user` role without `BYPASSRLS` and connect as that role. Add `FORCE ROW LEVEL SECURITY` on each table to apply RLS even to table owners.

3. **Cross-tenant data via assignee_id.** The `assignee_id` foreign key references `users(id)` with no tenant check. A task in tenant A can reference a user in tenant B. The FK constraint only checks that the user exists, not that they share a tenant. Fix: make the FK a composite reference `(tenant_id, assignee_id)` referencing `(tenant_id, id)` on users, which requires a unique constraint on `users(tenant_id, id)`.

Bug 3 is a cross-tenant data leak — the exact class of vulnerability the schema was designed to prevent.

---

📊 **5 agents** · 6 messages · 1 revision · 4 bugs caught · 1 migration file · 110s
