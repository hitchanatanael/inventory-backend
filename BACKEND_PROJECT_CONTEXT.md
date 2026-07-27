# Backend Project Context

This document describes the current backend state of the `inventory-backend` project as implemented in the repository. It is documentation only. It does not propose source changes as current behavior, and it does not implement authentication, authorization, location scoping, reports, export, audit logs, backup, or restore.

All facts below are inferred from the current backend source files, `package.json`, `.env.example`, and repository structure. The repository does not contain database migrations, a schema dump, seed files, automated tests, or a SQL definition for `v_stok_barang`; table constraints and view internals are therefore documented only where they can be proven or reasonably inferred from SQL queries.

## 1. Project Overview

The backend is a Node.js API for an inventory/pupuk domain. It exposes master-data CRUD APIs for locations, members, and goods; transaction APIs for incoming and outgoing goods; and read-only stock APIs backed by a SQL view named `v_stok_barang`.

The visible business entities are:

| Entity | Meaning in the Backend |
| --- | --- |
| `lokasi` | Location master data. |
| `master_anggota` | Member/customer master data. |
| `master_barang` | Goods/item master data, including item code, name, unit, owning/submitted location, and unit price. |
| `barang_masuk` | Incoming goods transaction records. |
| `barang_keluar` | Outgoing goods transaction records, optionally linked to a member. |
| `v_stok_barang` | SQL view used as the stock source of truth for stock listing, stock summary, and outgoing stock validation. |

Technology stack from `package.json`:

| Package | Version | Role |
| --- | --- | --- |
| `express` | `^5.2.1` | HTTP server, routing, and JSON body parsing via `express.json()`. |
| `cors` | `^2.8.6` | Global default CORS middleware via `app.use(cors())`. |
| `dotenv` | `^17.4.2` | Loads environment variables from `.env`. |
| `bcryptjs` | `^3.0.3` | Password hashing and password comparison for authentication. |
| `jsonwebtoken` | `^9.0.3` | JWT creation and verification for authentication. |
| `mysql2` | `^3.22.5` | MySQL driver. The promise API is used through `mysql2/promise`. |
| `nodemon` | `^3.1.14` | Development-only server restart utility. |

Project runtime characteristics:

| Area | Current Implementation |
| --- | --- |
| Language | JavaScript. |
| Module system | CommonJS, confirmed by `"type": "commonjs"` and `require(...)` / `module.exports`. |
| Framework | Express. |
| ORM | Not implemented. SQL is written manually in service files. |
| Database library | `mysql2/promise`. |
| Environment management | `dotenv` in `app.js` and `config/db.js`. |
| Validation approach | Manual validator functions under `validators/`; validators return a string message on failure or `null`/validated filters on success. |
| Error-handling approach | Local `try/catch` in controllers; no central Express error middleware. |
| API response convention | Main feature controllers use `utils/response.js` with `{ success, message, data }` for success and `{ success, message }` for errors. Root and example routes are exceptions. |
| Tests | Not implemented. No test files or test script are present. |

Scripts:

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | `nodemon app.js` | Development server with automatic restart. |
| `npm start` | `node app.js` | Production/basic server start. |
| `npm run create-super-admin` | `node scripts/createSuperAdmin.js` | Creates the first Super Admin user using existing `roles` and `users` tables. |

Authentication-related state:

```text
Authentication core is implemented.
Existing inventory routes are not yet protected.
Location scoping is prepared but not yet applied to inventory modules.
```

## 2. Folder Structure

Relevant backend structure, excluding `node_modules` and `.git` expansion:

```text
inventory-backend/
|-- .env
|-- .env.example
|-- app.js
|-- BACKEND_CONTEXT.md
|-- BACKEND_TREE.md
|-- BACKEND_PROJECT_CONTEXT.md
|-- package-lock.json
|-- package.json
|-- config/
|   `-- db.js
|-- constants/
|   `-- roles.js
|-- controllers/
|   |-- authController.js
|   |-- barangKeluarController.js
|   |-- barangMasukController.js
|   |-- exampleController.js
|   |-- lokasiController.js
|   |-- masterAnggotaController.js
|   |-- masterBarangController.js
|   `-- stokBarangController.js
|-- middleware/
|   |-- .gitkeep
|   `-- authMiddleware.js
|-- routes/
|   |-- authRoutes.js
|   |-- barangKeluarRoutes.js
|   |-- barangMasukRoutes.js
|   |-- exampleRoutes.js
|   |-- lokasiRoutes.js
|   |-- masterAnggotaRoutes.js
|   |-- masterBarangRoutes.js
|   `-- stokBarangRoutes.js
|-- sql/
|   `-- alter_barang_keluar_status_to_cash_loan.sql
|-- scripts/
|   `-- createSuperAdmin.js
|-- services/
|   |-- authService.js
|   |-- barangKeluarService.js
|   |-- barangMasukService.js
|   |-- lokasiService.js
|   |-- masterAnggotaService.js
|   |-- masterBarangService.js
|   `-- stokBarangService.js
|-- utils/
|   `-- response.js
`-- validators/
    |-- authValidator.js
    |-- barangKeluarValidator.js
    |-- barangMasukValidator.js
    |-- lokasiValidator.js
    |-- masterAnggotaValidator.js
    |-- masterBarangValidator.js
    `-- stokBarangValidator.js
```

Folder and file responsibilities:

| Path | Responsibility |
| --- | --- |
| `app.js` | Main Express application and server startup file. Loads env, registers middleware, mounts routes, defines fallback 404, and calls `app.listen`. |
| `config/db.js` | Creates and exports the MySQL promise connection pool. |
| `constants/roles.js` | Role-name constants for `SUPER ADMIN` and `ADMIN`. |
| `routes/` | Express router modules. Each route file maps HTTP methods and paths to controller functions. |
| `controllers/` | HTTP request handlers. Controllers read params/query/body, call validators, call services, and format responses. |
| `services/` | Database queries, persistence logic, stock validation, and transaction calculations. |
| `sql/` | Manual SQL migration files. Currently contains a focused migration for `barang_keluar.status` compatibility with `C`/`L`. |
| `scripts/createSuperAdmin.js` | CLI script for creating the first Super Admin user. |
| `validators/` | Manual request body/query validators. |
| `utils/response.js` | Shared JSON response helper for most business controllers. |
| `middleware/` | Authentication, role, and location-scope middleware foundation. |
| `BACKEND_CONTEXT.md`, `BACKEND_TREE.md` | Existing documentation files. They are not imported by runtime code. |
| `package.json`, `package-lock.json` | npm metadata, dependency versions, scripts, and lockfile. |
| `.env.example` | Example environment variable names and default-like local values. |
| `.env` | Local environment file. Values are intentionally not copied into this document. |

## 3. Application Entry Point

The main application and server startup file is:

```text
app.js
```

There is no separate exported Express app or separate `server.js`. `app.js` starts the HTTP server directly.

Startup behavior:

```text
app.js
-> require express
-> require cors
-> require('dotenv').config()
-> require route modules
-> create Express app
-> read PORT from process.env.PORT || 5000
-> register cors()
-> register express.json()
-> register GET /
-> mount API routes
-> register fallback 404 handler
-> app.listen(PORT)
```

Port configuration:

```js
const PORT = process.env.PORT || 5000;
```

Middleware registration order:

1. `app.use(cors())`
2. `app.use(express.json())`
3. Root route `GET /`
4. API route mounting
5. Fallback 404 handler

Mounted route prefixes:

| Prefix | Route Module |
| --- | --- |
| `/api/examples` | `routes/exampleRoutes.js` |
| `/api/auth` | `routes/authRoutes.js` |
| `/api/master-barang` | `routes/masterBarangRoutes.js` |
| `/api/master-anggota` | `routes/masterAnggotaRoutes.js` |
| `/api/lokasi` | `routes/lokasiRoutes.js` |
| `/api/barang-masuk` | `routes/barangMasukRoutes.js` |
| `/api/barang-keluar` | `routes/barangKeluarRoutes.js` |
| `/api/stok-barang` | `routes/stokBarangRoutes.js` |

Root route:

```http
GET http://localhost:5000/
```

Response:

```json
{
  "message": "API Inventory Pupuk berjalan"
}
```

Fallback route:

Any request not matched by a prior route returns:

```json
{
  "success": false,
  "message": "Endpoint tidak ditemukan"
}
```

with HTTP status `404`.

Global error handling:

```text
Not implemented.
```

There is no Express error-handling middleware of the form `(err, req, res, next)`. Most controller functions use local `try/catch` blocks. JSON parse errors from `express.json()` are not normalized by application code.

Database startup behavior:

```text
No database connectivity check is performed at startup.
```

`config/db.js` creates a MySQL pool when required, but `app.js` does not test the connection before calling `app.listen`.

Exact request flow for standard business endpoints:

```text
Incoming HTTP request
-> Express middleware: cors()
-> Express middleware: express.json()
-> mounted route module
-> controller function
-> validator function for POST/PUT or query validation where implemented
-> service function
-> db.query(...) through mysql2 promise pool
-> controller maps service result to response.success(...) or response.error(...)
-> JSON response
```

## 4. Environment Configuration

Environment variables listed in `.env.example` and/or consumed by source:

| Variable | Required | Default | Consumed In | Purpose |
| --- | --- | --- | --- | --- |
| `PORT` | No | `5000` | `app.js` | HTTP server port. |
| `DB_HOST` | Yes for DB access | None in source | `config/db.js` | MySQL host. |
| `DB_USER` | Yes for DB access | None in source | `config/db.js` | MySQL username. |
| `DB_PASSWORD` | Depends on local DB | None in source | `config/db.js` | MySQL password. |
| `DB_NAME` | Yes for DB access | None in source | `config/db.js` | MySQL database name. |
| `DB_PORT` | No | `3306` | `config/db.js` | MySQL port. Source uses `Number(process.env.DB_PORT) || 3306`. |
| `JWT_SECRET` | Yes for auth | None | `controllers/authController.js`, `middleware/authMiddleware.js` | Secret used to sign and verify JWTs. Must not be logged or exposed. |
| `JWT_EXPIRES_IN` | No | `8h` | `controllers/authController.js` | JWT expiration passed to `jsonwebtoken`. |
| `BCRYPT_SALT_ROUNDS` | No | `10` | `scripts/createSuperAdmin.js` | Salt rounds used when hashing the initial Super Admin password. |

`.env.example` contains:

```text
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=inventory_pupuk
DB_PORT=3306
JWT_SECRET=
JWT_EXPIRES_IN=8h
BCRYPT_SALT_ROUNDS=10
```

Security note:

```text
Do not expose real .env secret values.
```

Authentication/JWT/session variables:

```text
JWT_SECRET is required before generating or verifying tokens.
JWT_EXPIRES_IN defaults to 8h.
Session variables are not implemented.
BCRYPT_SALT_ROUNDS defaults to 10.
```

## 5. Database Connection

Database client/library:

```js
const mysql = require('mysql2/promise');
```

Connection pool configuration in `config/db.js`:

```js
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

Exported database helper API:

```js
module.exports = pool;
```

Service files import the pool as `db`:

```js
const db = require('../config/db');
```

Query execution pattern:

```js
const [rows] = await db.query('SELECT ... WHERE id = ?', [id]);
const [result] = await db.query('INSERT ... VALUES (?, ?)', [a, b]);
```

Connection reuse:

- A single promise pool is created in `config/db.js`.
- Services reuse the exported pool.
- No service obtains a dedicated connection with `pool.getConnection()`.

Parameterized query usage:

- Application SQL uses `?` placeholders for request-derived values.
- Dynamic `WHERE` clauses are built from fixed condition strings, while values are passed through parameter arrays.
- No direct interpolation of request values into SQL strings was found.

Transactions:

```text
Not implemented.
```

No `beginTransaction`, `commit`, `rollback`, or explicit connection release appears in the repository. Stock-sensitive writes in `barang_keluar` perform stock validation and insert/update as separate queries without a transaction or row lock.

Connection error behavior:

- Connection/query errors reject the awaited `db.query(...)`.
- Most controllers catch those errors and return a generic `500` response.
- CRUD controllers do not log original errors.
- `exampleController` exposes `error.message` to the client.

Timezone handling:

```text
Could not be determined from the current repository.
```

No timezone option is configured on the MySQL pool. `barangMasukService` formats `bm.tanggal` using MySQL `DATE_FORMAT(bm.tanggal, '%Y-%m-%d')`; `barangKeluarService` selects `bk.tanggal` directly without formatting.

DECIMAL handling behavior:

```text
Could not be determined from the current repository.
```

No `decimalNumbers`, `supportBigNumbers`, or custom type casting options are configured. Services call `Number(...)` on selected numeric values in several calculations and stock checks. Returned DECIMAL field types from MySQL may be strings depending on `mysql2` defaults and column types.

## 6. Current Database Model

No full DDL/schema dump exists in the repository. One focused migration exists for the Barang Keluar status enum, but primary keys, foreign keys, nullability, indexes, and most column types are still mostly inferred from selected/inserted/updated columns and joins.

### `roles`

Purpose:

- Stores existing role master data for authentication and authorization decisions.
- Phase 1 uses role names exactly as stored in the database.

Observed columns from the local database audit:

| Column | Type Observed | Usage |
| --- | --- | --- |
| `id` | `int`, primary key, auto increment | Selected and stored in `users.id_role`; not used directly for authorization decisions. |
| `nama_role` | `varchar(50)`, unique | Selected and compared to role constants. |
| `created_at` | `timestamp`, nullable, default current timestamp | Selected by `findRoleByName`. |
| `updated_at` | `timestamp`, nullable, auto-updated | Selected by `findRoleByName`. |

Existing role rows observed:

| id | nama_role |
| --- | --- |
| `1` | `SUPER ADMIN` |
| `2` | `ADMIN` |

Current role constants:

```js
const ROLE_SUPER_ADMIN = 'SUPER ADMIN';
const ROLE_ADMIN = 'ADMIN';
```

Important auth rule:

- Authorization decisions are based on `nama_role`, not hardcoded role IDs.
- Role IDs are used only after looking up a role by `nama_role`, such as when creating the first Super Admin.

### `users`

Purpose:

- Stores backend users for Phase 1 authentication.
- The table already exists and is not recreated by the backend.

Observed columns from the local database audit:

| Column | Type Observed | Usage |
| --- | --- | --- |
| `id` | `int`, primary key, auto increment | Minimal JWT payload and user lookup key. |
| `id_role` | `int`, indexed, not null | Joins to `roles.id`. |
| `id_lokasi` | `int`, indexed, nullable | Joins to `lokasi.id`; must be `NULL` for `SUPER ADMIN`; required for `ADMIN`. |
| `nama` | `varchar(100)`, not null | Safe user display field. |
| `username` | `varchar(100)`, unique, not null | Login identifier. |
| `password_hash` | `varchar(255)`, not null | Internal bcrypt password hash; never returned in API responses. |
| `is_active` | `tinyint(1)`, nullable, default `1` | Login and middleware reject inactive users. |
| `created_at` | `timestamp`, nullable, default current timestamp | Safe current-user data. |
| `updated_at` | `timestamp`, nullable, auto-updated | Safe current-user data. |

Expected relationships:

```text
users.id_role -> roles.id
users.id_lokasi -> lokasi.id
```

Foreign keys and indexes:

- The local database audit shows indexes on `users.id_role`, `users.id_lokasi`, and a unique key on `users.username`.
- The local database audit verified `users.id_role -> roles.id` through constraint `fk_users_role`.
- The local database audit verified `users.id_lokasi -> lokasi.id` through constraint `fk_users_lokasi`.
- These constraints are not represented in repository SQL files because no full schema dump exists.

Role-location rules:

| Role | Rule |
| --- | --- |
| `SUPER ADMIN` | `id_lokasi` must be `NULL`. |
| `ADMIN` | `id_lokasi` must be a positive integer and must resolve to a valid `lokasi` row. |

Backend modules:

| Module | Reads | Writes |
| --- | --- | --- |
| Auth login | Reads user, role, and location data. | No |
| Auth middleware | Reads current user, role, and location data on protected requests. | No |
| Super Admin script | Reads role and duplicate username; inserts the first Super Admin user. | Yes |

### `lokasi`

Purpose:

- Stores location master data.
- Used by master goods, incoming transactions, outgoing transactions, and stock view queries.

Columns used by backend:

| Column | Usage |
| --- | --- |
| `id` | Selected, filtered by ID, inferred primary key. |
| `nama_lokasi` | Selected, inserted, updated, ordered. |
| `created_at` | Selected. |
| `updated_at` | Selected and manually set to `CURRENT_TIMESTAMP` on update. |

Primary key:

- Inferred: `id`.

Foreign keys:

- Other tables reference `lokasi.id` through `id_lokasi`, inferred from joins.

Nullable fields:

- Could not be determined from the current repository.

Timestamp fields:

- `created_at`
- `updated_at`

Backend modules:

| Module | Reads | Writes |
| --- | --- | --- |
| Lokasi | Yes | Yes |
| Master Barang | Reads `nama_lokasi` via join | No |
| Barang Masuk | Reads `nama_lokasi` via join | No |
| Barang Keluar | Reads `nama_lokasi` via join | No |
| Stok Barang | Reads `id_lokasi`, `kode_lokasi`, `nama_lokasi` through `v_stok_barang` | No |

### `master_anggota`

Purpose:

- Stores member/customer master data.
- Used optionally by `barang_keluar`.

Columns used by backend:

| Column | Usage |
| --- | --- |
| `id` | Selected, filtered by ID, inferred primary key. |
| `nomor_anggota` | Selected, inserted, updated, searched in outgoing transaction list. |
| `nama_anggota` | Selected, inserted, updated, ordered, searched in outgoing transaction list. |
| `keterangan` | Selected, inserted, updated. Defaults to `null` in service when omitted. |
| `created_at` | Selected. |
| `updated_at` | Selected and manually set to `CURRENT_TIMESTAMP` on update. |

Primary key:

- Inferred: `id`.

Foreign keys:

- `barang_keluar.id_master_anggota` references `master_anggota.id`, inferred from `LEFT JOIN master_anggota ma ON ma.id = bk.id_master_anggota`.

Nullable fields:

- `keterangan` is treated as nullable by backend service.
- `id_master_anggota` in `barang_keluar` is optional and normalized to `null`, but this is a `barang_keluar` field.
- Other nullability could not be determined.

Duplicate validation:

```text
Not implemented.
```

No JavaScript uniqueness check exists for `nomor_anggota` or `nama_anggota`.

### `master_barang`

Purpose:

- Stores goods/item master data.
- Provides the modal/cost basis for outgoing transactions through `harga_satuan`.
- Associated with a location through `id_lokasi`.

Columns used by backend:

| Column | Usage |
| --- | --- |
| `id` | Selected, filtered by ID, inferred primary key. |
| `kode_barang` | Selected, inserted, updated, searched in outgoing and stock queries. |
| `nama_barang` | Selected, inserted, updated, ordered, searched in outgoing and stock queries. |
| `satuan` | Selected, inserted, updated, searched in stock queries. |
| `id_lokasi` | Selected, inserted, updated, joined to `lokasi.id`. |
| `harga_satuan` | Selected, inserted, updated; used by `barang_keluar` as `harga_modal`; read by `v_stok_barang` as stock asset price. |
| `created_at` | Selected. |
| `updated_at` | Selected and manually set to `CURRENT_TIMESTAMP` on update. |

Primary key:

- Inferred: `id`.

Foreign keys:

- `master_barang.id_lokasi` references `lokasi.id`, inferred from `LEFT JOIN lokasi l ON l.id = mb.id_lokasi`.
- `barang_masuk.id_master_barang` references `master_barang.id`, inferred from joins.
- `barang_keluar.id_master_barang` references `master_barang.id`, inferred from joins and modal price lookup.
- `v_stok_barang.id_master_barang` maps to `master_barang.id`, inferred from stock queries.

Nullable fields:

- Could not be determined from the current repository.

Business meaning of `harga_satuan`:

- In `master_barang`, the field is named unit price.
- In `barang_keluar`, `master_barang.harga_satuan` is copied into `barang_keluar.harga_modal`.
- Based only on the code, `harga_satuan` is treated as modal/cost price for outgoing margin calculation.

Duplicate validation:

```text
Not implemented.
```

No JavaScript uniqueness check exists for `kode_barang`.

### `barang_masuk`

Purpose:

- Stores incoming goods transactions.
- Backend writes calculated total/payment-difference fields.
- Stock impact is not manually written by the service; stock is derived from `v_stok_barang`.

Columns used by backend:

| Column | Usage |
| --- | --- |
| `id` | Selected, filtered by ID, inferred primary key. |
| `tanggal` | Selected, inserted, updated; list filters use `MONTH(bm.tanggal)`. |
| `id_master_barang` | Selected, inserted, updated, joined to `master_barang.id`. |
| `id_lokasi` | Selected, inserted, updated, joined to `lokasi.id`, filtered by `tp`. |
| `jumlah` | Selected, inserted, updated; used in `total_harga` calculation. |
| `harga_satuan` | Selected, inserted, updated; request-provided incoming price. |
| `total_harga` | Selected, inserted, updated; calculated by service. |
| `jumlah_bayar` | Selected, inserted, updated; used in `sisa_bayar` calculation. |
| `sisa_bayar` | Selected, inserted, updated; calculated by service. |
| `status` | Selected, inserted, updated; allowed by validator: `LUNAS`, `PIUTANG`, `LOAN`. |
| `created_at` | Selected. |
| `updated_at` | Selected and manually set to `CURRENT_TIMESTAMP` on update. |

Primary key:

- Inferred: `id`.

Foreign keys:

- `id_master_barang` references `master_barang.id`, inferred from `LEFT JOIN master_barang mb ON mb.id = bm.id_master_barang`.
- `id_lokasi` references `lokasi.id`, inferred from `LEFT JOIN lokasi l ON l.id = bm.id_lokasi`.

Nullable fields:

- Could not be determined from the current repository.

Status values:

```text
LUNAS
PIUTANG
LOAN
```

These are the values allowed by `validators/barangMasukValidator.js`. Database constraints could not be determined.

### `barang_keluar`

Purpose:

- Stores outgoing goods transactions.
- Optionally links a transaction to a member.
- Validates available stock against `v_stok_barang` before create/update.
- Stores calculated sale total, payment difference, copied modal price, and margin.

Columns used by backend:

| Column | Usage |
| --- | --- |
| `id` | Selected, filtered by ID, inferred primary key. |
| `tanggal` | Selected, inserted, updated; filters use `MONTH(...)` and `YEAR(...)`. |
| `id_master_anggota` | Selected, inserted, updated; nullable by service normalization; joined to `master_anggota.id`. |
| `id_master_barang` | Selected, inserted, updated; joined to `master_barang.id`; used for stock lookup. |
| `id_lokasi` | Selected, inserted, updated; joined to `lokasi.id`; used for stock lookup and filters. |
| `jumlah` | Selected, inserted, updated; used for stock validation and calculations. |
| `harga_jual` | Selected, inserted, updated; used in total sale calculation. |
| `total_harga_jual` | Selected, inserted, updated; calculated by service. |
| `jumlah_bayar` | Selected, inserted, updated; used in payment difference calculation. |
| `sisa_bayar` | Selected, inserted, updated; calculated by service. |
| `harga_modal` | Selected, inserted, updated; copied from `master_barang.harga_satuan`. |
| `margin` | Selected, inserted, updated; calculated by service. |
| `status` | Selected, inserted, updated; allowed by validator: `C`, `L`. |
| `created_at` | Selected. |
| `updated_at` | Selected and manually set to `CURRENT_TIMESTAMP` on update. |

Primary key:

- Inferred: `id`.

Foreign keys:

- `id_master_anggota` references `master_anggota.id`, inferred from `LEFT JOIN master_anggota ma ON ma.id = bk.id_master_anggota`.
- `id_master_barang` references `master_barang.id`, inferred from `JOIN master_barang mb ON mb.id = bk.id_master_barang`.
- `id_lokasi` references `lokasi.id`, inferred from `JOIN lokasi l ON l.id = bk.id_lokasi`.

Nullable fields:

- `id_master_anggota` is intentionally normalized to `null` by service when omitted, `null`, or empty string.
- Other nullability could not be determined.

Status values:

```text
C = Cash
L = Loan
```

Legacy rows may still contain older values such as `LUNAS`, `PIUTANG`, or `LOAN` until the database is migrated or cleaned manually. New create/update requests no longer accept those values.

Observed local database compatibility:

```text
barang_keluar.status was observed as enum('C','LUNAS','PIUTANG','LOAN') NOT NULL DEFAULT 'C'.
```

Because that enum does not allow `L`, the repository now includes:

```text
sql/alter_barang_keluar_status_to_cash_loan.sql
```

The migration is manual and must not be executed automatically by application startup.

### `v_stok_barang`

Purpose:

- SQL view used as the backend's stock source of truth.
- Used by stock listing, stock summary, and outgoing stock availability validation.

Fields read by backend:

| Field | Usage |
| --- | --- |
| `id_master_barang` | Selected by stock API; filtered by outgoing stock lookup. |
| `kode_barang` | Selected and searched by stock API. |
| `nama_barang` | Selected and searched by stock API. |
| `satuan` | Selected and searched by stock API. |
| `id_lokasi` | Selected, filtered, grouped, and used by outgoing stock lookup. |
| `kode_lokasi` | Selected, searched, grouped in stock summary. |
| `nama_lokasi` | Selected, searched, ordered, grouped in stock summary. |
| `stok_masuk` | Selected by stock API. |
| `stok_keluar` | Selected by stock API. |
| `stok` | Selected, filtered by availability, summed in summary, used for outgoing validation. |
| `harga_satuan` | Selected by stock API. |
| `nilai_aset` | Selected and summed in summary. |

View definition:

```text
Could not be determined from the current repository.
```

No `CREATE VIEW` statement is present. The only current SQL migration is unrelated to the view and updates `barang_keluar.status` compatibility.

## 7. SQL Views and Derived Data

### `v_stok_barang`

The backend treats `v_stok_barang` as the authoritative read model for stock. Services do not manually mutate a physical stock table.

Important rule:

```text
Stock is derived data.
Frontend and backend transaction modules must not manually update a physical stock table.
```

Also:

```text
The Stok Barang module must remain read-only.
```

Why it exists:

- `stokBarangService` reads stock rows and summaries from `v_stok_barang`.
- `barangKeluarService` validates outgoing quantity by reading `stok` from `v_stok_barang`.
- No backend code inserts, updates, or deletes stock rows directly.

Fields read:

```text
id_master_barang
kode_barang
nama_barang
satuan
id_lokasi
kode_lokasi
nama_lokasi
stok_masuk
stok_keluar
stok
harga_satuan
nilai_aset
```

Stock calculation behavior:

- The exact formula for `stok`, `stok_masuk`, `stok_keluar`, and `nilai_aset` cannot be proven because the view definition is absent.
- Based on field names and service usage, `stok` is the available stock value for an item-location pair.
- Based on summary SQL, `nilai_aset` is a view-provided asset value and is summed by the backend.

Whether loan statuses affect stock:

```text
Could not be determined from the current repository.
```

The Barang Masuk validator allows `LOAN`. Barang Keluar now uses `L` for Loan. No service conditionally includes or excludes loan statuses. Whether loan statuses contribute to `stok_masuk`, `stok_keluar`, or `stok` depends on the unavailable `v_stok_barang` definition.

Grouping by item and location:

- `barangKeluarService.getAvailableStock(idMasterBarang, idLokasi)` queries one row by `id_master_barang` and `id_lokasi`.
- `stokBarangService.getRingkasanStokBarang()` groups summary by `id_lokasi`, `kode_lokasi`, and `nama_lokasi`.
- Therefore the backend expects the view to expose stock by item and location.

Asset value calculation:

- `stokBarangService` reads `nilai_aset` directly from the view.
- `stokBarangService.getRingkasanStokBarang()` uses `SUM(nilai_aset)`.
- The formula for `nilai_aset` is not present. It is likely derived in the view, but the exact calculation is unknown.

Modules using the view:

| Module | Usage |
| --- | --- |
| Barang Keluar | Validates available stock before create/update. |
| Stok Barang | Lists stock rows and returns overall/per-location summaries. |

Why backend must not manually mutate stock:

- There is no stock table service or mutation endpoint.
- `barang_masuk` and `barang_keluar` write transaction records only.
- The read model is centralized in `v_stok_barang`, so manually updating another stock table would create a second source of truth and conflict with current service design.

## 8. API Response Format

Shared response helper file:

```text
utils/response.js
```

Success helper:

```js
const success = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
```

Success response shape:

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": []
}
```

Error helper:

```js
const error = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
```

Error response shape:

```json
{
  "success": false,
  "message": "Gagal mengambil data"
}
```

HTTP status conventions:

| Case | Status |
| --- | --- |
| Default success | `200` |
| Create success | `201` |
| Default error | `500` |
| Validation error | `400` |
| Invalid query filter | `400` |
| Not found | `404` |
| Stock not sufficient | `400` |
| Fallback route not found | `404` |

Exceptions to the shared helper:

| Endpoint/File | Response Shape |
| --- | --- |
| `GET /` in `app.js` | `{ "message": "API Inventory Pupuk berjalan" }` |
| `controllers/exampleController.js` success | `{ "message": "...", "data": rows }` |
| `controllers/exampleController.js` error | `{ "message": "...", "error": error.message }` |
| Fallback 404 in `app.js` | `{ "success": false, "message": "Endpoint tidak ditemukan" }` |

No response field beyond `success`, `message`, `data`, and the example route's `error` field is implemented.

## 9. Routing Architecture

Mounted API base paths:

| Base Path | Module |
| --- | --- |
| `http://localhost:5000/api/examples` | Example |
| `http://localhost:5000/api/auth` | Authentication |
| `http://localhost:5000/api/master-barang` | Master Barang |
| `http://localhost:5000/api/master-anggota` | Master Anggota |
| `http://localhost:5000/api/lokasi` | Lokasi |
| `http://localhost:5000/api/barang-masuk` | Barang Masuk |
| `http://localhost:5000/api/barang-keluar` | Barang Keluar |
| `http://localhost:5000/api/stok-barang` | Stok Barang |

Route inventory by module:

| Method | Complete URL | Controller Function | Purpose |
| --- | --- | --- | --- |
| `GET` | `http://localhost:5000/` | inline in `app.js` | Root server message. |
| `GET` | `http://localhost:5000/api/examples` | `exampleController.getExamples` | Test/example DB query. |
| `POST` | `http://localhost:5000/api/auth/login` | `authController.login` | Login with username/password and receive a JWT. |
| `GET` | `http://localhost:5000/api/auth/me` | `authController.getCurrentUser` | Protected current-user endpoint using `authenticateToken`. |
| `GET` | `http://localhost:5000/api/master-barang` | `masterBarangController.getAllMasterBarang` | List all goods. |
| `GET` | `http://localhost:5000/api/master-barang/:id` | `masterBarangController.getMasterBarangById` | Get one goods row by ID. |
| `POST` | `http://localhost:5000/api/master-barang` | `masterBarangController.createMasterBarang` | Create goods. |
| `PUT` | `http://localhost:5000/api/master-barang/:id` | `masterBarangController.updateMasterBarang` | Update goods. |
| `DELETE` | `http://localhost:5000/api/master-barang/:id` | `masterBarangController.deleteMasterBarang` | Hard delete goods. |
| `GET` | `http://localhost:5000/api/master-anggota` | `masterAnggotaController.getAllMasterAnggota` | List all members. |
| `GET` | `http://localhost:5000/api/master-anggota/:id` | `masterAnggotaController.getMasterAnggotaById` | Get one member by ID. |
| `POST` | `http://localhost:5000/api/master-anggota` | `masterAnggotaController.createMasterAnggota` | Create member. |
| `PUT` | `http://localhost:5000/api/master-anggota/:id` | `masterAnggotaController.updateMasterAnggota` | Update member. |
| `DELETE` | `http://localhost:5000/api/master-anggota/:id` | `masterAnggotaController.deleteMasterAnggota` | Hard delete member. |
| `GET` | `http://localhost:5000/api/lokasi` | `lokasiController.getAllLokasi` | List all locations. |
| `GET` | `http://localhost:5000/api/lokasi/:id` | `lokasiController.getLokasiById` | Get one location by ID. |
| `POST` | `http://localhost:5000/api/lokasi` | `lokasiController.createLokasi` | Create location. |
| `PUT` | `http://localhost:5000/api/lokasi/:id` | `lokasiController.updateLokasi` | Update location. |
| `DELETE` | `http://localhost:5000/api/lokasi/:id` | `lokasiController.deleteLokasi` | Hard delete location. |
| `GET` | `http://localhost:5000/api/barang-masuk` | `barangMasukController.getAllBarangMasuk` | List incoming transactions with optional filters. |
| `GET` | `http://localhost:5000/api/barang-masuk/:id` | `barangMasukController.getBarangMasukById` | Get one incoming transaction by ID. |
| `POST` | `http://localhost:5000/api/barang-masuk` | `barangMasukController.createBarangMasuk` | Create incoming transaction. |
| `PUT` | `http://localhost:5000/api/barang-masuk/:id` | `barangMasukController.updateBarangMasuk` | Update incoming transaction. |
| `DELETE` | `http://localhost:5000/api/barang-masuk/:id` | `barangMasukController.deleteBarangMasuk` | Hard delete incoming transaction. |
| `GET` | `http://localhost:5000/api/barang-keluar` | `barangKeluarController.getAllBarangKeluar` | List outgoing transactions with optional filters. |
| `GET` | `http://localhost:5000/api/barang-keluar/:id` | `barangKeluarController.getBarangKeluarById` | Get one outgoing transaction by ID. |
| `POST` | `http://localhost:5000/api/barang-keluar` | `barangKeluarController.createBarangKeluar` | Create outgoing transaction with stock validation. |
| `PUT` | `http://localhost:5000/api/barang-keluar/:id` | `barangKeluarController.updateBarangKeluar` | Update outgoing transaction with effective stock validation. |
| `DELETE` | `http://localhost:5000/api/barang-keluar/:id` | `barangKeluarController.deleteBarangKeluar` | Hard delete outgoing transaction. |
| `GET` | `http://localhost:5000/api/stok-barang` | `stokBarangController.getAllStokBarang` | List stock from `v_stok_barang`. |
| `GET` | `http://localhost:5000/api/stok-barang/ringkasan` | `stokBarangController.getRingkasanStokBarang` | Get overall and per-location stock summary. |

## 10. Module Documentation

### Authentication Module

#### Purpose

The Authentication module implements Phase 1 backend authentication using the existing `users`, `roles`, and `lokasi` tables. It provides login, JWT creation, an authenticated current-user endpoint, role middleware foundation, location-scope middleware foundation, and a CLI script for creating the first Super Admin.

Current Phase 1 boundary:

```text
Authentication core is implemented.
Existing inventory routes are not yet protected.
Location scoping is prepared but not yet applied to inventory modules.
```

#### Files

| Type | File |
| --- | --- |
| Route | `routes/authRoutes.js` |
| Controller | `controllers/authController.js` |
| Validator | `validators/authValidator.js` |
| Service | `services/authService.js` |
| Middleware | `middleware/authMiddleware.js` |
| Constants | `constants/roles.js` |
| Script | `scripts/createSuperAdmin.js` |

#### Endpoints

```http
POST http://localhost:5000/api/auth/login
GET http://localhost:5000/api/auth/me
```

`GET /api/auth/me` is protected with `authenticateToken`.

#### Login Request Payload

```json
{
  "username": "admin",
  "password": "strong-password"
}
```

`username` is normalized using `String(value).trim()`. It is not lowercased by backend code.

#### Login Response

Success response:

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "<jwt>",
    "user": {
      "id": 1,
      "id_role": 1,
      "id_lokasi": null,
      "nama": "Super Admin",
      "username": "admin",
      "nama_role": "SUPER ADMIN",
      "nama_lokasi": null
    }
  }
}
```

The login response does not return `password_hash`, `JWT_SECRET`, or `is_active`.

JWT payload:

```js
{
  id: user.id
}
```

The JWT does not contain role, location, username, display name, password hash, or a full user record. Role and location are fetched from the database on protected requests.

#### Current User Response

```json
{
  "success": true,
  "message": "Data pengguna berhasil diambil",
  "data": {
    "id": 1,
    "id_role": 1,
    "id_lokasi": null,
    "nama": "Super Admin",
    "username": "admin",
    "nama_role": "SUPER ADMIN",
    "nama_lokasi": null,
    "is_active": 1
  }
}
```

The current-user endpoint refetches safe user data from the current database row and does not return `password_hash`.

#### Validation Rules

Login validator:

| Field | Rule | Message |
| --- | --- | --- |
| `username` | Required after trim. | `Username wajib diisi` |
| `password` | Required. | `Password wajib diisi` |

Invalid username or password uses the same generic response:

```text
HTTP 401
Username atau password salah
```

Inactive user:

```text
HTTP 403
Akun tidak aktif
```

Invalid role:

```text
HTTP 403
Role pengguna tidak valid
```

Invalid ADMIN location assignment:

```text
HTTP 403
Akun belum memiliki lokasi yang valid
```

#### Role and Location Rules

Role names are defined in `constants/roles.js`:

```js
const ROLE_SUPER_ADMIN = 'SUPER ADMIN';
const ROLE_ADMIN = 'ADMIN';
```

Rules:

| Role | Rule |
| --- | --- |
| `SUPER ADMIN` | `id_lokasi` must be `NULL`. |
| `ADMIN` | `id_lokasi` must be a positive integer and join to a valid `lokasi` row. |

Unknown roles are rejected. The backend does not silently correct invalid role-location combinations.

#### Authentication Middleware

`authenticateToken` reads only:

```http
Authorization: Bearer <token>
```

It does not accept tokens from query parameters, request bodies, or cookies.

Behavior:

| Case | Status | Message |
| --- | --- | --- |
| Missing token | `401` | `Token autentikasi diperlukan` |
| Invalid/expired token | `401` | `Token tidak valid atau telah kedaluwarsa` |
| Token user missing | `401` | `Pengguna tidak ditemukan` |
| User inactive | `403` | `Akun tidak aktif` |
| Invalid role | `403` | `Role pengguna tidak valid` |
| Invalid location assignment | `403` | `Akun belum memiliki lokasi yang valid` |

For valid tokens, middleware fetches current user data from the database and sets:

```js
req.user = {
  id,
  id_role,
  id_lokasi,
  nama,
  username,
  nama_role,
  nama_lokasi
};
```

It does not trust role or location values from the JWT.

#### Role Middleware Foundation

`requireRole(...allowedRoles)` is implemented for future use:

```js
router.get(
  '/users',
  authenticateToken,
  requireRole(ROLE_SUPER_ADMIN),
  controller
);
```

If the current user role is not allowed, it returns:

```text
HTTP 403
Anda tidak memiliki akses ke fitur ini
```

This middleware is not yet applied to inventory routes.

#### Location Scope Foundation

`attachLocationScope` derives scope only from `req.user.nama_role` and `req.user.id_lokasi`.

For `SUPER ADMIN`:

```js
req.locationScope = {
  isSuperAdmin: true,
  id_lokasi: null
};
```

For `ADMIN`:

```js
req.locationScope = {
  isSuperAdmin: false,
  id_lokasi: req.user.id_lokasi
};
```

It does not read `id_lokasi` from `req.body`, `req.query`, or `req.params`. This middleware is not yet applied to inventory routes.

#### Super Admin Creation Script

Script:

```text
scripts/createSuperAdmin.js
```

npm command:

```bash
npm run create-super-admin -- --nama="Super Admin" --username="admin" --password="strong-password"
```

Behavior:

- Loads environment variables.
- Parses `--nama`, `--username`, and `--password`.
- Requires a password of at least 8 characters.
- Looks up role by `nama_role = 'SUPER ADMIN'`.
- Does not hardcode role ID.
- Rejects duplicate usernames.
- Hashes the password with `bcryptjs` and `BCRYPT_SALT_ROUNDS`.
- Inserts into `users` with `id_lokasi = NULL` and `is_active = 1`.
- Does not print the plain password.
- Closes the database pool before exit.

#### Known Limitations

- No public registration endpoint.
- No refresh token.
- No logout/token blacklist.
- No password reset.
- No user CRUD.
- Existing inventory routes remain public in Phase 1.
- Location scoping is prepared but not applied to inventory modules.

### Example Module

#### Purpose

The example module is a test/example endpoint. It is mounted and active, but it is not part of the core inventory business model.

#### Files

| Type | File |
| --- | --- |
| Route | `routes/exampleRoutes.js` |
| Controller | `controllers/exampleController.js` |
| Validator | Not implemented. |
| Service | Not implemented. Controller queries DB directly. |

#### Endpoints

```http
GET http://localhost:5000/api/examples
```

#### Request Payload

Not implemented. The route does not read a request body.

#### Query Parameters

Not implemented.

#### Response Data

Success response shape is not the shared helper shape:

```json
{
  "message": "Data contoh berhasil diambil",
  "data": [
    {
      "id": 1,
      "name": "Contoh data"
    }
  ]
}
```

#### Business Logic

Runs:

```sql
SELECT 1 AS id, ? AS name
```

with parameter:

```text
Contoh data
```

#### Error Cases

On error, returns HTTP `500` with:

```json
{
  "message": "Gagal mengambil data contoh",
  "error": "original database error message"
}
```

This is the only controller that exposes `error.message`.

#### Known Limitations

- Bypasses `utils/response.js`.
- Exposes original error message.
- Not a business endpoint.

### Master Anggota Module

#### Purpose

The Master Anggota module manages member records. Outgoing transactions can optionally reference a member through `barang_keluar.id_master_anggota`.

#### Files

| Type | File |
| --- | --- |
| Route | `routes/masterAnggotaRoutes.js` |
| Controller | `controllers/masterAnggotaController.js` |
| Validator | `validators/masterAnggotaValidator.js` |
| Service | `services/masterAnggotaService.js` |

#### Endpoints

```http
GET http://localhost:5000/api/master-anggota
GET http://localhost:5000/api/master-anggota/:id
POST http://localhost:5000/api/master-anggota
PUT http://localhost:5000/api/master-anggota/:id
DELETE http://localhost:5000/api/master-anggota/:id
```

#### Request Payload

Create/update payload:

```json
{
  "nomor_anggota": "A001",
  "nama_anggota": "Nama Anggota",
  "keterangan": "Optional notes"
}
```

`keterangan` is optional. The service defaults it to `null`:

```js
const { nomor_anggota, nama_anggota, keterangan = null } = payload;
```

#### Query Parameters

Not implemented.

There is no search or pagination in current code, despite this being useful for future work.

#### Response Data

Selected fields:

```text
id
nomor_anggota
nama_anggota
keterangan
created_at
updated_at
```

List ordering:

```sql
ORDER BY nama_anggota ASC
```

#### Validation Rules

Required fields:

```text
nomor_anggota
nama_anggota
```

Empty check treats only these values as empty:

```text
undefined
null
""
```

No validation exists for:

- duplicate `nomor_anggota`
- string length
- whitespace-only values
- `keterangan` type

#### Business Logic

- CRUD operations are implemented.
- Created rows are fetched after insert using `getMasterAnggotaById(result.insertId)`.
- Updates first check existence using `getMasterAnggotaById(id)`.
- Deletes are hard deletes using `DELETE FROM master_anggota WHERE id = ?`.
- `barang_keluar` uses a `LEFT JOIN` to members, so member association is optional in outgoing transaction responses.

#### Error Cases

| Case | Status | Message |
| --- | --- | --- |
| Missing required fields | `400` | `Field wajib diisi: ...` |
| Detail not found | `404` | `Data master anggota tidak ditemukan` |
| Update target not found | `404` | `Data master anggota tidak ditemukan` |
| Delete target not found | `404` | `Data master anggota tidak ditemukan` |
| Generic DB/service error | `500` | Generic `Gagal ... data master anggota` message. |

#### Known Limitations

- No search.
- No pagination.
- No duplicate validation.
- No soft delete.
- No dependency handling before delete.
- No authorization.

#### Non-Member Transaction Behavior

Non-member outgoing transactions use:

```text
id_master_anggota = null
```

This behavior is implemented in `barangKeluarService.normalizeMasterAnggotaId`, not in the Master Anggota module itself. The outgoing service converts `undefined`, `null`, or `""` to `null`.

### Master Barang Module

#### Purpose

The Master Barang module manages goods/items. Items include a code, name, unit, associated location, and unit price. The outgoing transaction module reads `master_barang.harga_satuan` as modal/cost price when calculating `barang_keluar.harga_modal` and `margin`.

#### Files

| Type | File |
| --- | --- |
| Route | `routes/masterBarangRoutes.js` |
| Controller | `controllers/masterBarangController.js` |
| Validator | `validators/masterBarangValidator.js` |
| Service | `services/masterBarangService.js` |

#### Endpoints

```http
GET http://localhost:5000/api/master-barang
GET http://localhost:5000/api/master-barang/:id
POST http://localhost:5000/api/master-barang
PUT http://localhost:5000/api/master-barang/:id
DELETE http://localhost:5000/api/master-barang/:id
```

Dropdown endpoint:

```text
Not implemented.
```

There is no dedicated dropdown/list-minimal endpoint.

#### Request Payload

Create/update payload:

```json
{
  "kode_barang": "BRG001",
  "nama_barang": "Nama Barang",
  "satuan": "sak",
  "id_lokasi": 1,
  "harga_satuan": 100000
}
```

#### Query Parameters

Not implemented.

There is no current search, pagination, sorting parameter, or location filter for Master Barang. List sorting is fixed in SQL.

#### Response Data

Selected fields:

```text
id
kode_barang
nama_barang
satuan
id_lokasi
nama_lokasi
harga_satuan
created_at
updated_at
```

List ordering:

```sql
ORDER BY mb.id ASC
```

Important note: older docs in this repository mention ordering by `mb.nama_barang ASC`, but the current service orders by `mb.id ASC`.

#### Validation Rules

Required fields:

```text
kode_barang
nama_barang
satuan
id_lokasi
harga_satuan
```

No validation exists for:

- numeric validity of `id_lokasi`
- numeric validity of `harga_satuan`
- existence of `id_lokasi`
- duplicate `kode_barang`
- string length
- whitespace-only values
- unknown fields

#### Business Logic

- CRUD operations are implemented.
- `master_barang` is left-joined to `lokasi` for display field `nama_lokasi`.
- `harga_satuan` is treated as the modal/cost source for outgoing transaction calculations, based on `barangKeluarService.getHargaModal`.
- Created rows are fetched after insert.
- Updates first check existence.
- Deletes are hard deletes.

#### Error Cases

| Case | Status | Message |
| --- | --- | --- |
| Missing required fields | `400` | `Field wajib diisi: ...` |
| Detail not found | `404` | `Data master barang tidak ditemukan` |
| Update target not found | `404` | `Data master barang tidak ditemukan` |
| Delete target not found | `404` | `Data master barang tidak ditemukan` |
| Generic DB/service error | `500` | Generic `Gagal ... data master barang` message. |

#### Relationships

- `master_barang.id_lokasi` is joined to `lokasi.id`.
- `barang_masuk.id_master_barang` is joined to `master_barang.id`.
- `barang_keluar.id_master_barang` is joined to `master_barang.id`.
- `v_stok_barang.id_master_barang` is used as stock identity.

#### Known Limitations

- No dropdown endpoint.
- No search.
- No pagination.
- No duplicate validation.
- No JavaScript foreign-key existence check for `id_lokasi`.
- No soft delete.
- Hard deletion may conflict with transaction history if database constraints exist.

### Lokasi Module

#### Purpose

The Lokasi module manages location master data. Locations are used by goods, incoming transactions, outgoing transactions, and stock view queries.

#### Files

| Type | File |
| --- | --- |
| Route | `routes/lokasiRoutes.js` |
| Controller | `controllers/lokasiController.js` |
| Validator | `validators/lokasiValidator.js` |
| Service | `services/lokasiService.js` |

#### Endpoints

```http
GET http://localhost:5000/api/lokasi
GET http://localhost:5000/api/lokasi/:id
POST http://localhost:5000/api/lokasi
PUT http://localhost:5000/api/lokasi/:id
DELETE http://localhost:5000/api/lokasi/:id
```

#### Request Payload

Create/update payload:

```json
{
  "nama_lokasi": "Nama Lokasi"
}
```

#### Query Parameters

Not implemented.

#### Response Data

Selected fields:

```text
id
nama_lokasi
created_at
updated_at
```

List ordering:

```sql
ORDER BY nama_lokasi ASC
```

#### Validation Rules

Required fields:

```text
nama_lokasi
```

No validation exists for duplicates, string length, or whitespace-only values.

#### Business Logic

- CRUD operations are implemented.
- Updates first check existence.
- Deletes are hard deletes.
- Current locations are not visible in code or seed data.
- Location is currently selected/submitted manually by the client through `id_lokasi` payload fields or query filters in other modules.

#### Usage in Other Modules

| Module | Current Usage |
| --- | --- |
| Master Barang | Payload accepts `id_lokasi`; service joins `lokasi` for `nama_lokasi`. |
| Barang Masuk | Payload accepts `id_lokasi`; list can filter by `tp` mapped to `bm.id_lokasi`; service joins `lokasi`. |
| Barang Keluar | Payload accepts `id_lokasi`; list can filter by `id_lokasi`; stock validation uses `id_lokasi`; service joins `lokasi`. |
| Stok Barang | Query can filter by `id_lokasi`; summaries group by location fields from `v_stok_barang`. |

#### Error Cases

| Case | Status | Message |
| --- | --- | --- |
| Missing required fields | `400` | `Field wajib diisi: nama_lokasi` |
| Detail not found | `404` | `Data lokasi tidak ditemukan` |
| Update target not found | `404` | `Data lokasi tidak ditemukan` |
| Delete target not found | `404` | `Data lokasi tidak ditemukan` |
| Generic DB/service error | `500` | Generic `Gagal ... lokasi` message. |

#### Known Limitations

- No search.
- No pagination.
- No duplicate validation.
- No soft delete.
- No protection against deleting a location used elsewhere in JavaScript.

### Barang Masuk Module

#### Purpose

The Barang Masuk module manages incoming goods transactions. It writes transaction rows and calculates `total_harga` and `sisa_bayar`. It does not manually update stock; stock is derived through `v_stok_barang`.

#### Files

| Type | File |
| --- | --- |
| Route | `routes/barangMasukRoutes.js` |
| Controller | `controllers/barangMasukController.js` |
| Validator | `validators/barangMasukValidator.js` |
| Service | `services/barangMasukService.js` |

#### Endpoints

```http
GET http://localhost:5000/api/barang-masuk
GET http://localhost:5000/api/barang-masuk/:id
POST http://localhost:5000/api/barang-masuk
PUT http://localhost:5000/api/barang-masuk/:id
DELETE http://localhost:5000/api/barang-masuk/:id
```

#### Request Payload

Create/update payload:

```json
{
  "tanggal": "2026-07-27",
  "id_master_barang": 1,
  "id_lokasi": 1,
  "jumlah": 10,
  "harga_satuan": 100000,
  "jumlah_bayar": 500000,
  "status": "PIUTANG"
}
```

#### Query Parameters

`GET /api/barang-masuk` supports filters:

| Query Parameter | Validation | SQL Effect |
| --- | --- | --- |
| `bulan` | Integer `1` through `12` | `MONTH(bm.tanggal) = ?` |
| `tp` | Positive integer | `bm.id_lokasi = ?` |

Example:

```http
GET http://localhost:5000/api/barang-masuk?bulan=7&tp=1
```

Not implemented:

- `tahun`
- `id_lokasi` parameter name for this module; current code uses `tp`
- `search`
- pagination
- sorting parameter
- status filter

#### Response Data

Selected transaction fields:

```text
id
tanggal
id_master_barang
id_lokasi
jumlah
harga_satuan
total_harga
jumlah_bayar
sisa_bayar
status
created_at
updated_at
```

Joined display fields:

```text
kode_barang
nama_barang
satuan
nama_lokasi
```

Date formatting:

```sql
DATE_FORMAT(bm.tanggal, '%Y-%m-%d') AS tanggal
```

List ordering:

```sql
ORDER BY bm.id DESC
```

#### Validation Rules

Required fields:

```text
tanggal
id_master_barang
id_lokasi
jumlah
harga_satuan
jumlah_bayar
status
```

Allowed statuses:

```text
LUNAS
PIUTANG
LOAN
```

No validation exists for:

- date format or actual valid date
- positive integer `jumlah`
- numeric `harga_satuan`
- numeric `jumlah_bayar`
- positive integer `id_master_barang`
- positive integer `id_lokasi`
- existence of referenced item or location
- status-derived payment consistency

#### Business Logic

Calculation function:

```js
const calculatePayment = (payload) => {
  const jumlah = Number(payload.jumlah);
  const hargaSatuan = Number(payload.harga_satuan);
  const jumlahBayar = Number(payload.jumlah_bayar);
  const totalHarga = jumlah * hargaSatuan;
  const sisaBayar = jumlahBayar - totalHarga;

  return {
    totalHarga,
    sisaBayar,
  };
};
```

Exact formulas:

```text
total_harga = Number(jumlah) * Number(harga_satuan)
sisa_bayar = Number(jumlah_bayar) - total_harga
```

`total_harga_jual`:

```text
Not implemented in Barang Masuk.
```

`margin`:

```text
Not implemented in Barang Masuk.
```

Harga modal source:

- Barang Masuk does not read `master_barang.harga_satuan`.
- Barang Masuk uses request body field `harga_satuan`.

Create behavior:

```text
validate payload
-> calculate total_harga and sisa_bayar
-> INSERT barang_masuk
-> SELECT inserted detail by ID
-> return response
```

Update behavior:

```text
validate payload
-> check existing transaction by ID
-> calculate total_harga and sisa_bayar
-> UPDATE barang_masuk
-> SELECT updated detail by ID
-> return response
```

Delete behavior:

- Hard delete using `DELETE FROM barang_masuk WHERE id = ?`.

Stock impact:

- The module does not manually update stock.
- Stock impact, including whether `LOAN` is included, depends on the unavailable `v_stok_barang` definition.

Database transactions:

```text
Not implemented.
```

#### Error Cases

| Case | Status | Message |
| --- | --- | --- |
| Invalid `bulan` query | `400` | `Filter bulan harus berupa angka 1 sampai 12` |
| Invalid `tp` query | `400` | `Filter TP harus berupa id_lokasi yang valid` |
| Missing body fields | `400` | `Field wajib diisi: ...` |
| Invalid status | `400` | `Status hanya boleh: LUNAS, PIUTANG, LOAN` |
| Detail not found | `404` | `Data barang masuk tidak ditemukan` |
| Update target not found | `404` | `Data barang masuk tidak ditemukan` |
| Delete target not found | `404` | `Data barang masuk tidak ditemukan` |
| DB/service error | `500` | Generic `Gagal ... barang masuk` message. |

#### Known Limitations

- No strict numeric validation.
- No strict date validation.
- No foreign-key existence validation in JavaScript.
- No transaction around insert/update/refetch.
- No pagination.
- No search.
- No `tahun` filter.
- Uses query parameter `tp` for location filtering, while other modules use `id_lokasi`.
- `sisa_bayar` formula is `jumlah_bayar - total_harga`; if `sisa_bayar` means unpaid debt, underpayment produces a negative value.

### Barang Keluar Module

#### Purpose

The Barang Keluar module manages outgoing goods transactions. It validates stock availability through `v_stok_barang`, supports nullable member transactions, calculates sale total/payment/margin fields, and stores the resulting transaction.

#### Files

| Type | File |
| --- | --- |
| Route | `routes/barangKeluarRoutes.js` |
| Controller | `controllers/barangKeluarController.js` |
| Validator | `validators/barangKeluarValidator.js` |
| Service | `services/barangKeluarService.js` |

#### Endpoints

```http
GET http://localhost:5000/api/barang-keluar
GET http://localhost:5000/api/barang-keluar/:id
POST http://localhost:5000/api/barang-keluar
PUT http://localhost:5000/api/barang-keluar/:id
DELETE http://localhost:5000/api/barang-keluar/:id
```

#### Request Payload

Create/update payload:

```json
{
  "tanggal": "2026-07-27",
  "id_master_anggota": 1,
  "id_master_barang": 1,
  "id_lokasi": 1,
  "jumlah": 5,
  "harga_jual": 120000,
  "jumlah_bayar": 300000,
  "status": "C"
}
```

Non-member payload:

```json
{
  "tanggal": "2026-07-27",
  "id_master_anggota": "",
  "id_master_barang": 1,
  "id_lokasi": 1,
  "jumlah": 5,
  "harga_jual": 120000,
  "jumlah_bayar": 300000,
  "status": "L"
}
```

The service normalizes `id_master_anggota`:

```text
undefined -> null
null -> null
"" -> null
```

So non-member transactions use:

```text
id_master_anggota = null
```

#### Query Parameters

`GET /api/barang-keluar` supports filters:

| Query Parameter | Validation | SQL Effect |
| --- | --- | --- |
| `bulan` | Integer `1` through `12` | `MONTH(bk.tanggal) = ?` |
| `tahun` | Positive integer | `YEAR(bk.tanggal) = ?` |
| `id_lokasi` | Positive integer | `bk.id_lokasi = ?` |
| `search` | Trimmed non-empty string | Searches item code, item name, member name, member number, and location name with `LIKE`. |

Example:

```http
GET http://localhost:5000/api/barang-keluar?bulan=7&tahun=2026&id_lokasi=1&search=urea
```

Pagination:

```text
Not implemented.
```

Sorting parameter:

```text
Not implemented.
```

Fixed ordering:

```sql
ORDER BY bk.tanggal DESC, bk.id DESC
```

#### Response Data

Selected transaction fields:

```text
id
tanggal
id_master_anggota
id_master_barang
id_lokasi
jumlah
harga_jual
total_harga_jual
jumlah_bayar
sisa_bayar
harga_modal
margin
status
created_at
updated_at
```

Joined member fields:

```text
nomor_anggota
nama_anggota
keterangan
```

Joined item/location fields:

```text
kode_barang
nama_barang
satuan
nama_lokasi
```

#### Validation Rules

Required fields:

```text
tanggal
id_master_barang
id_lokasi
jumlah
harga_jual
jumlah_bayar
status
```

Optional field:

```text
id_master_anggota
```

Allowed statuses:

```text
C = Cash
L = Loan
```

Validation details:

| Field | Rule |
| --- | --- |
| `tanggal` | Must be a string and a real calendar date in `YYYY-MM-DD` format. |
| `id_master_barang` | Positive integer. |
| `id_lokasi` | Positive integer. |
| `jumlah` | Positive integer greater than `0`. |
| `harga_jual` | Finite number greater than or equal to `0`. |
| `jumlah_bayar` | Finite number greater than or equal to `0`. |
| `id_master_anggota` | Empty or positive integer. |
| `status` | Must be one of `C` or `L`. Strict uppercase codes only; old values such as `LUNAS`, `PIUTANG`, and `LOAN` are rejected for new create/update requests. |

No validation exists for:

- existence of `id_lokasi`
- existence of non-null `id_master_anggota`
- payment/status consistency

`id_master_barang` existence is indirectly checked because `calculateTransaction` calls `getHargaModal`. If no master item exists, the service returns `null`.

#### Business Logic

Helper functions:

| Function | Behavior |
| --- | --- |
| `normalizeMasterAnggotaId(idMasterAnggota)` | Converts `undefined`, `null`, or `""` to `null`; otherwise returns the original value. |
| `getHargaModal(idMasterBarang)` | Reads `master_barang.harga_satuan` by ID with `LIMIT 1`; returns `Number(harga_satuan)` or `null`. |
| `getAvailableStock(idMasterBarang, idLokasi)` | Reads `COALESCE(stok, 0) AS stok` from `v_stok_barang` for item-location pair; returns numeric stock or `0`. |
| `validateAvailableStock(idMasterBarang, idLokasi, requestedQuantity, quantityToRestore = 0)` | Computes `effectiveStock = availableStock + quantityToRestore`; throws `ServiceError('Stok barang tidak mencukupi', 400)` when requested quantity exceeds effective stock. |
| `calculateTransaction(payload)` | Reads modal price and calculates sale total, margin, and payment difference. |

Exact formulas:

```text
total_harga_jual = Number(jumlah) * Number(harga_jual)
harga_modal = Number(master_barang.harga_satuan)
margin = total_harga_jual - Number(jumlah) * harga_modal
sisa_bayar = Number(jumlah_bayar) - total_harga_jual
```

Create flow:

```text
validate payload
-> calculateTransaction(payload)
-> if master barang missing, return null
-> validateAvailableStock(id_master_barang, id_lokasi, jumlah)
-> normalize id_master_anggota
-> INSERT barang_keluar
-> SELECT inserted detail
-> return response
```

Update flow:

```text
validate payload
-> get existing barang_keluar by ID
-> if missing, return null
-> calculateTransaction(payload)
-> if master barang missing, return null
-> determine whether old and new stock source are same item-location
-> if same, restore old outgoing quantity into effective stock
-> if different, do not restore old quantity for the new item-location
-> validateAvailableStock(...)
-> normalize id_master_anggota
-> UPDATE barang_keluar
-> SELECT updated detail
-> return response
```

Important update example:

```text
Current stock from the view: 80
Old outgoing transaction: 20
Same item and same location: yes
Effective stock for validation: 100
```

If the item or location changes, the old quantity is not added to the new item-location stock:

```text
Current stock from the view for new item-location: 80
Old outgoing transaction: 20
Same item and same location: no
Effective stock for validation: 80
```

Stock availability behavior:

- Stock lookup uses `v_stok_barang`.
- If no view row exists for the item-location pair, available stock is treated as `0`.
- Stock validation is not conditional on outgoing `status`; both `C` and `L` requests pass through the same requested quantity check.
- Whether rows with loan status `L` affect the view's `stok` calculation cannot be determined without the view definition.

Delete behavior:

- Hard delete using `DELETE FROM barang_keluar WHERE id = ?`.
- Delete does not manually restore stock. Stock should change only through the derived view recalculating from transaction data.

Database transactions:

```text
Not implemented.
```

There is a possible race condition between stock validation and insert/update because no transaction or lock is used.

#### Error Propagation

`barangKeluarService` defines:

```js
class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

`validateAvailableStock` throws:

```text
Stok barang tidak mencukupi
```

with status `400`.

`barangKeluarController` uses `handleServiceError`:

```text
if error.statusCode exists -> response.error(res, error.message, error.statusCode)
else -> generic fallback 500
```

#### Error Cases

| Case | Status | Message |
| --- | --- | --- |
| Invalid filter `bulan` | `400` | `Filter bulan harus berupa angka 1 sampai 12` |
| Invalid filter `tahun` | `400` | `Filter tahun harus berupa angka positif` |
| Invalid filter `id_lokasi` | `400` | `Filter id_lokasi harus berupa angka positif` |
| Missing body fields | `400` | `Field wajib diisi: ...` |
| Invalid date | `400` | `Tanggal harus berupa tanggal valid dengan format YYYY-MM-DD` |
| Invalid item/location/quantity/price/payment/member/status | `400` | Validator-specific message. |
| Insufficient stock | `400` | `Stok barang tidak mencukupi` |
| Create with missing master barang | `404` | `Data master barang tidak ditemukan` |
| Detail not found | `404` | `Data barang keluar tidak ditemukan` |
| Update target not found | `404` | `Data barang keluar tidak ditemukan` |
| Delete target not found | `404` | `Data barang keluar tidak ditemukan` |
| Generic DB/service error | `500` | Generic `Gagal ... barang keluar` message. |

#### Known Limitations

- No database transaction or row locking around stock check plus write.
- Race condition is possible under concurrent outgoing writes.
- Missing `id_lokasi` and missing non-null `id_master_anggota` are not explicitly checked before insert/update.
- `updateBarangKeluar` returns `null` both when the transaction is missing and when the new `id_master_barang` is missing, but the controller reports only `Data barang keluar tidak ditemukan`.
- No pagination.
- No status filter.
- No member ID filter.
- Barang Keluar only accepts strict status codes `C` and `L`; legacy database rows may still contain older values until handled by database maintenance.
- `sisa_bayar` formula is `jumlah_bayar - total_harga_jual`; if `sisa_bayar` means unpaid debt, underpayment produces a negative value.

### Stok Barang Module

#### Purpose

The Stok Barang module provides read-only stock listing and summary data from the SQL view `v_stok_barang`.

```text
The Stok Barang module must remain read-only.
```

#### Files

| Type | File |
| --- | --- |
| Route | `routes/stokBarangRoutes.js` |
| Controller | `controllers/stokBarangController.js` |
| Validator | `validators/stokBarangValidator.js` |
| Service | `services/stokBarangService.js` |

#### Endpoints

```http
GET http://localhost:5000/api/stok-barang
GET http://localhost:5000/api/stok-barang/ringkasan
```

There are no `POST`, `PUT`, or `DELETE` routes.

#### Request Payload

Not implemented. The module is read-only.

#### Query Parameters

`GET /api/stok-barang` supports:

| Query Parameter | Accepted Values | Effect |
| --- | --- | --- |
| `id_lokasi` | Positive integer string | Adds `id_lokasi = ?`. |
| `search` | Trimmed non-empty string | Searches `kode_barang`, `nama_barang`, `satuan`, `kode_lokasi`, `nama_lokasi`. |
| `hanya_tersedia` | `true`, `1`, `false`, `0`, empty, or omitted | When true, adds `stok > 0`; false means no availability condition. |

Examples:

```http
GET http://localhost:5000/api/stok-barang?id_lokasi=1
GET http://localhost:5000/api/stok-barang?search=urea
GET http://localhost:5000/api/stok-barang?hanya_tersedia=true
GET http://localhost:5000/api/stok-barang?id_lokasi=1&search=urea&hanya_tersedia=1
```

`GET /api/stok-barang/ringkasan` does not accept filters in current code.

Pagination:

```text
Not implemented.
```

#### Response Data

Stock list fields selected from `v_stok_barang`:

```text
id_master_barang
kode_barang
nama_barang
satuan
id_lokasi
kode_lokasi
nama_lokasi
stok_masuk
stok_keluar
stok
harga_satuan
nilai_aset
```

Stock list ordering:

```sql
ORDER BY
  nama_lokasi ASC,
  nama_barang ASC,
  kode_barang ASC
```

Summary response shape:

```json
{
  "success": true,
  "message": "Ringkasan stok barang berhasil diambil",
  "data": {
    "keseluruhan": {
      "total_jenis_barang": 10,
      "total_stok": 100,
      "total_nilai_aset": 1000000
    },
    "per_lokasi": [
      {
        "id_lokasi": 1,
        "kode_lokasi": "PST",
        "nama_lokasi": "Pusat",
        "total_jenis_barang": 5,
        "total_stok": 50,
        "total_nilai_aset": 500000
      }
    ]
  }
}
```

Actual numeric types depend on MySQL driver behavior and database column types.

#### Validation Rules

`validateStokBarangQuery(query)` returns either:

```js
{ filters }
```

or:

```js
{ error: '...' }
```

Validation details:

| Field | Rule | Error |
| --- | --- | --- |
| `id_lokasi` | Must be a positive integer string if provided and non-empty. | `Lokasi tidak valid` |
| `search` | Converted to string and trimmed. Empty search is ignored. | None. |
| `hanya_tersedia` | `true`/`1` -> `true`; `false`/`0` -> `false`; omitted/empty ignored. | `Filter ketersediaan tidak valid` |

#### Business Logic

- The module reads only from `v_stok_barang`.
- `hanya_tersedia=true` filters rows with `stok > 0`.
- Summary endpoint calculates:
  - Overall `COUNT(*) AS total_jenis_barang`
  - Overall `SUM(stok) AS total_stok`
  - Overall `SUM(nilai_aset) AS total_nilai_aset`
  - Per-location grouped totals by `id_lokasi`, `kode_lokasi`, `nama_lokasi`
- The module does not mutate stock or transactions.

#### Error Cases

| Case | Status | Message |
| --- | --- | --- |
| Invalid `id_lokasi` | `400` | `Lokasi tidak valid` |
| Invalid `hanya_tersedia` | `400` | `Filter ketersediaan tidak valid` |
| Generic DB/service error | `500` | `Gagal mengambil data stok barang` or `Gagal mengambil ringkasan stok barang` |

#### Known Limitations

- No pagination.
- Summary endpoint has no filters.
- View definition is absent, so exact stock math is not documented in repository.
- No POST/PUT/DELETE by design.

### Dashboard or Reports

```text
Not implemented.
```

No dashboard or report route/controller/service exists.

## 11. Master Anggota Module Details

CRUD behavior:

| Operation | Current Behavior |
| --- | --- |
| List | Returns all `master_anggota` rows ordered by `nama_anggota ASC`. |
| Detail | Returns one row by `id` using `LIMIT 1`; returns `404` if missing. |
| Create | Validates required fields, inserts row, returns created row. |
| Update | Validates required fields, checks existence, updates row, returns updated row. |
| Delete | Hard deletes row by ID. |

Field handling:

| Field | Current Behavior |
| --- | --- |
| `nomor_anggota` | Required for create/update. No duplicate validation. |
| `nama_anggota` | Required for create/update. |
| `keterangan` | Optional; defaults to `null` in service. |

Search:

```text
Not implemented in Master Anggota list endpoint.
```

Pagination:

```text
Not implemented.
```

Duplicate validation:

```text
Not implemented.
```

Hard delete behavior:

```sql
DELETE FROM master_anggota WHERE id = ?
```

Use by Barang Keluar:

- `barang_keluar.id_master_anggota` is joined with `master_anggota.id`.
- The join is a `LEFT JOIN`, so outgoing rows can be returned without a matching member.

Nullable member behavior for non-members:

- Implemented in `barangKeluarService.normalizeMasterAnggotaId`.
- Empty input is normalized to `null`.
- This makes non-member outgoing transactions possible.

## 12. Master Barang Module Details

CRUD behavior:

| Operation | Current Behavior |
| --- | --- |
| List | Returns all rows ordered by `mb.id ASC`. |
| Detail | Returns one row by `mb.id` using `LIMIT 1`; returns `404` if missing. |
| Create | Validates required fields, inserts row, returns created row. |
| Update | Validates required fields, checks existence, updates row, returns updated row. |
| Delete | Hard deletes row by ID. |

Field handling:

| Field | Current Behavior |
| --- | --- |
| `kode_barang` | Required. No duplicate validation. |
| `nama_barang` | Required. |
| `satuan` | Required. |
| `id_lokasi` | Required. Location is trusted from request body. |
| `harga_satuan` | Required. Used as modal/cost source by `barang_keluar`. |

Location ownership:

- `master_barang.id_lokasi` is submitted by the client and stored directly.
- No middleware injects or restricts location.
- No JavaScript check confirms that `id_lokasi` exists.

Price source behavior:

- Master Barang stores `harga_satuan`.
- Barang Keluar reads `master_barang.harga_satuan` and stores it as `barang_keluar.harga_modal`.
- Based only on current code, `harga_satuan` functions as cost/modal price for margin calculation.

Dropdown endpoint:

```text
Not implemented.
```

Search and pagination:

```text
Not implemented.
```

Hard delete behavior:

```sql
DELETE FROM master_barang WHERE id = ?
```

Relationships:

- Used by incoming transactions through `barang_masuk.id_master_barang`.
- Used by outgoing transactions through `barang_keluar.id_master_barang`.
- Used by stock view through `id_master_barang`.

## 13. Lokasi Module Details

Location fields:

```text
id
nama_lokasi
created_at
updated_at
```

Location listing endpoint:

```http
GET http://localhost:5000/api/lokasi
```

Current locations:

```text
Could not be determined from the current repository.
```

No seed data or SQL dump exists.

Usage:

| Area | Current Behavior |
| --- | --- |
| Master Barang | Create/update payload accepts `id_lokasi`; service joins `lokasi` for `nama_lokasi`. |
| Barang Masuk | Create/update payload accepts `id_lokasi`; list filter `tp` maps to `bm.id_lokasi`. |
| Barang Keluar | Create/update payload accepts `id_lokasi`; list filter uses `id_lokasi`; stock validation uses `id_lokasi`. |
| Stok Barang | List filter uses `id_lokasi`; summary groups by location fields from view. |

Location is currently selected or submitted manually by the client in inventory modules. Authentication middleware exists, but it is not yet applied to inventory routes, so no authorization layer currently restricts which location can be submitted there.

## 14. Barang Masuk Module Details

Request payload:

```json
{
  "tanggal": "2026-07-27",
  "id_master_barang": 1,
  "id_lokasi": 1,
  "jumlah": 10,
  "harga_satuan": 100000,
  "jumlah_bayar": 500000,
  "status": "PIUTANG"
}
```

Calculations:

```text
total_harga = Number(jumlah) * Number(harga_satuan)
sisa_bayar = Number(jumlah_bayar) - total_harga
```

Harga modal source:

- Not read from Master Barang for Barang Masuk.
- `harga_satuan` comes from request payload.

Payment calculation:

- `jumlah_bayar` is converted with `Number(...)`.
- `sisa_bayar` is `jumlah_bayar - total_harga`.

Margin calculation:

```text
Not implemented in Barang Masuk.
```

Status rules:

```text
Allowed: LUNAS, PIUTANG, LOAN
```

LOAN stock behavior:

```text
Could not be determined from the current repository.
```

The service stores `status`, including `LOAN`, but stock impact depends on the unavailable `v_stok_barang` definition.

Create/update/delete:

- Create inserts calculated values.
- Update recalculates and updates values.
- Delete hard deletes.
- No transaction wrapper exists.

Filters:

```text
bulan: MONTH(bm.tanggal) = ?
tp: bm.id_lokasi = ?
```

Search:

```text
Not implemented.
```

Stock impact:

- No physical stock mutation exists in the service.
- Stock should be reflected through the SQL view.

## 15. Barang Keluar Module Details

Request payload:

```json
{
  "tanggal": "2026-07-27",
  "id_master_anggota": null,
  "id_master_barang": 1,
  "id_lokasi": 1,
  "jumlah": 20,
  "harga_jual": 120000,
  "jumlah_bayar": 1000000,
  "status": "C"
}
```

Member nullable behavior:

```text
id_master_anggota may be undefined, null, or empty string.
The service stores those cases as null.
```

Stock availability validation:

```sql
SELECT COALESCE(stok, 0) AS stok
FROM v_stok_barang
WHERE id_master_barang = ?
 AND id_lokasi = ?
LIMIT 1
```

Create validation:

- Requested `jumlah` must be less than or equal to stock from the view.
- Missing view row means stock is `0`.

Update effective-stock validation:

```text
availableStock = stock currently reported by v_stok_barang for requested item-location
quantityToRestore = old transaction quantity only when old item-location equals requested item-location
effectiveStock = availableStock + quantityToRestore
```

Important update example:

```text
Current stock from the view: 80
Old outgoing transaction: 20
Effective stock for same item and location: 100
```

If the item or location changes, the old quantity is not added to the new item-location stock.

Filters:

```text
bulan
tahun
id_lokasi
search
```

Status values currently accepted:

```text
C = Cash
L = Loan
```

The validator is strict. It rejects `LUNAS`, `PIUTANG`, `LOAN`, `Cash`, `Loan`, lowercase `c`, lowercase `l`, and other unrecognized values.

Calculation formulas:

```text
total_harga_jual = Number(jumlah) * Number(harga_jual)
harga_modal = Number(master_barang.harga_satuan)
margin = total_harga_jual - Number(jumlah) * harga_modal
sisa_bayar = Number(jumlah_bayar) - total_harga_jual
```

Error propagation:

- Stock failure throws `ServiceError` with `statusCode = 400`.
- Controller returns the service error message and status when `error.statusCode` exists.
- Other errors return generic `500` messages.

## 16. Stok Barang Module

Read-only nature:

```text
The Stok Barang module must remain read-only.
```

Endpoints:

```http
GET http://localhost:5000/api/stok-barang
GET http://localhost:5000/api/stok-barang/ringkasan
```

Supported filters:

```text
id_lokasi
search
hanya_tersedia
```

`hanya_tersedia` behavior:

| Query Value | Normalized Value | SQL Effect |
| --- | --- | --- |
| `true` | `true` | Adds `stok > 0`. |
| `1` | `true` | Adds `stok > 0`. |
| `false` | `false` | No availability filter. |
| `0` | `false` | No availability filter. |
| omitted/empty | `undefined` | No availability filter. |
| other value | error | HTTP `400`. |

Summary endpoint:

- Overall summary from all `v_stok_barang` rows.
- Per-location summary grouped by `id_lokasi`, `kode_lokasi`, `nama_lokasi`.

Returned fields:

```text
id_master_barang
kode_barang
nama_barang
satuan
id_lokasi
kode_lokasi
nama_lokasi
stok_masuk
stok_keluar
stok
harga_satuan
nilai_aset
```

Pagination behavior:

```text
Not implemented.
```

Asset calculation:

- Backend reads `nilai_aset` from the view and sums it.
- Exact formula is not available.

Absence of mutations:

```text
POST /api/stok-barang: Not implemented.
PUT /api/stok-barang/:id: Not implemented.
DELETE /api/stok-barang/:id: Not implemented.
```

## 17. Validation Architecture

Validator file pattern:

- Validators are plain JavaScript modules.
- Body validators return a message string on failure and `null` on success.
- Query validator for stock returns `{ filters }` or `{ error }`.
- Controllers call validators before service functions.

Reusable helper pattern:

| Helper | File | Behavior |
| --- | --- | --- |
| `isEmpty` | Master/body validators | Treats `undefined`, `null`, and `""` as empty. |
| `isPositiveInteger` | `barangKeluarValidator.js` | Converts with `Number(...)`; requires integer greater than `0`. |
| `isNumberAtLeast` | `barangKeluarValidator.js` | Converts with `Number(...)`; requires finite number `>= minimum`. |
| `isValidDate` | `barangKeluarValidator.js` | Requires string `YYYY-MM-DD` and verifies real UTC calendar date. |
| `isPositiveIntegerString` | `stokBarangValidator.js` | Regex digits plus numeric value greater than `0`. |
| `normalizeHanyaTersedia` | `stokBarangValidator.js` | Converts query availability values to booleans or error. |

Validator functions and controller usage:

| Validator Function | File | Used By |
| --- | --- | --- |
| `validateMasterBarangPayload` | `validators/masterBarangValidator.js` | `createMasterBarang`, `updateMasterBarang` |
| `validateMasterAnggotaPayload` | `validators/masterAnggotaValidator.js` | `createMasterAnggota`, `updateMasterAnggota` |
| `validateLokasiPayload` | `validators/lokasiValidator.js` | `createLokasi`, `updateLokasi` |
| `validateBarangMasukPayload` | `validators/barangMasukValidator.js` | `createBarangMasuk`, `updateBarangMasuk` |
| `validateBarangKeluarPayload` | `validators/barangKeluarValidator.js` | `createBarangKeluar`, `updateBarangKeluar` |
| `validateStokBarangQuery` | `validators/stokBarangValidator.js` | `getAllStokBarang` |

Controller-local query validation:

| Function | File | Purpose |
| --- | --- | --- |
| `buildBarangMasukFilters` | `controllers/barangMasukController.js` | Validates `bulan` and `tp`. |
| `buildBarangKeluarFilters` | `controllers/barangKeluarController.js` | Validates `bulan`, `tahun`, `id_lokasi`, and normalizes `search`. |

Integer validation:

- Strongly implemented for Barang Keluar body fields and filters.
- Implemented for Stok Barang `id_lokasi`.
- Not implemented for Master Barang `id_lokasi`.
- Not implemented for Barang Masuk body fields.

Numeric validation:

- Implemented for Barang Keluar `harga_jual` and `jumlah_bayar`.
- Not implemented for Master Barang `harga_satuan`.
- Not implemented for Barang Masuk `harga_satuan`, `jumlah`, or `jumlah_bayar`.

Date validation:

- Implemented only for Barang Keluar body `tanggal`.
- Barang Masuk body `tanggal` only has required-field validation.

Enum/status validation:

- Barang Masuk: `LUNAS`, `PIUTANG`, `LOAN`.
- Barang Keluar: `C`, `L`.

Nullable field behavior:

- `id_master_anggota` may be empty in Barang Keluar and is normalized to `null` in service.
- `keterangan` in Master Anggota defaults to `null`.

## 18. Service Architecture

Service-layer pattern:

- Each business module has one service file.
- SQL lives inside service files.
- Services import the pool from `config/db.js`.
- Services are async and return rows, row objects, booleans, or `null`.
- Controllers map those return values into HTTP responses.

Base SELECT reuse:

- `masterBarangService`, `masterAnggotaService`, `lokasiService`, `barangMasukService`, `barangKeluarService`, and `stokBarangService` define `baseSelectQuery`.
- Detail/list functions append `WHERE`, `ORDER BY`, or `LIMIT 1` to the base query.

Common function patterns:

| Pattern | Implementation |
| --- | --- |
| Get all | `db.query(baseSelectQuery + ORDER BY ...)` |
| Get by ID | `WHERE id = ? LIMIT 1`, return `rows[0] || null` |
| Create | `INSERT`, then fetch inserted row with `result.insertId` |
| Update | Fetch existing row, return `null` if missing, `UPDATE`, then fetch updated row |
| Delete | `DELETE ... WHERE id = ?`, return `result.affectedRows > 0` |

Calculation functions:

| Function | File | Calculates |
| --- | --- | --- |
| `calculatePayment` | `barangMasukService.js` | `totalHarga`, `sisaBayar` |
| `calculateTransaction` | `barangKeluarService.js` | `totalHargaJual`, `hargaModal`, `margin`, `sisaBayar` |

Stock-check functions:

| Function | File | Behavior |
| --- | --- | --- |
| `getAvailableStock` | `barangKeluarService.js` | Reads `stok` from `v_stok_barang` for item-location. |
| `validateAvailableStock` | `barangKeluarService.js` | Throws `ServiceError` when requested quantity exceeds effective stock. |

Use of `LIMIT 1`:

- Used in all get-by-ID service functions.
- Used in `getHargaModal`.
- Used in `getAvailableStock`.

Affected row checks:

- Delete functions check `affectedRows > 0`.
- Update functions do not check `affectedRows`; they check existence before update and then refetch.

Transactions:

```text
Not implemented.
```

Duplicated/reusable patterns:

- Required-field validators duplicate `isEmpty`.
- CRUD controllers follow nearly identical try/validate/service/response patterns.
- CRUD service operations share get/create/update/delete structure.
- Not-found checks are repeated in controllers.

These are observations only; no refactor has been implemented.

## 19. Controller Architecture

Controller responsibilities:

- Extract request data from `req.params`, `req.body`, and sometimes `req.query`.
- Invoke validator functions.
- Return `400` immediately when validation fails.
- Invoke service functions.
- Return `404` when service returns `null` or `false` for not-found cases.
- Return success via `response.success`.
- Catch errors and return `response.error`.

Error logging:

```text
CRUD controllers do not log original errors.
```

Most controllers hide original errors behind generic messages. `exampleController` is the exception and returns `error.message`.

Validation handling:

- Body validation for create/update is in validators.
- Query validation is currently controller-local for Barang Masuk and Barang Keluar.
- Stock query validation is in `stokBarangValidator`.

Not-found handling:

- Detail/update service returning `null` generally maps to `404`.
- Delete service returning `false` maps to `404`.
- `createBarangKeluar` maps `null` service return to missing master barang.

## 20. Error Handling

Local `try/catch` behavior:

- Every main controller method has `try/catch`.
- Most `catch` blocks return generic `500`.
- Barang Keluar controller has `handleServiceError` to preserve `ServiceError.statusCode`.

Custom errors:

| Error | File | Purpose |
| --- | --- | --- |
| `ServiceError` | `services/barangKeluarService.js` | Carries a message and HTTP-like `statusCode`, used for insufficient stock. |

Validation errors:

- Return `400`.
- Response shape is `{ success: false, message }`.

Stock errors:

- `validateAvailableStock` throws `ServiceError('Stok barang tidak mencukupi', 400)`.
- Controller returns that exact message and status.

Database errors:

- Hidden behind generic `500` in main CRUD controllers.
- Exposed as `error.message` only in `exampleController`.

Foreign-key errors:

- Not explicitly handled.
- If MySQL rejects insert/update/delete due to constraints, most controllers return generic `500`.

Generic fallbacks:

- Main controllers use messages such as `Gagal mengambil data ...`, `Gagal membuat ...`, `Gagal memperbarui ...`, `Gagal menghapus ...`.

Stack traces:

```text
Not exposed by application code.
```

Known weaknesses proven by code:

- No central error middleware.
- No controller logging for most errors.
- Original database errors are lost in CRUD endpoints.
- Example endpoint exposes original error messages.
- `updateBarangKeluar` can collapse missing transaction and missing new master item into the same `null` path.
- Malformed JSON errors are not normalized.

## 21. Security Review of Current State

Authentication:

```text
Authentication core is implemented.
```

Implemented auth surfaces:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `authenticateToken` middleware

Authorization:

```text
Authorization middleware foundation is implemented, but not yet applied to inventory routes.
```

Passwords:

```text
Passwords are stored as bcrypt hashes in users.password_hash.
```

`password_hash` is never returned by auth responses.

JWT:

```text
JWT creation and verification are implemented.
```

The token payload is minimal:

```js
{
  id: user.id
}
```

Role and location values are fetched from the database on protected requests.

Sessions:

```text
Not implemented.
```

Protected routes:

```text
GET /api/auth/me is protected.
```

Existing inventory routes are not yet protected in Phase 1.

Role checks:

```text
requireRole(...allowedRoles) is implemented for future use.
```

Location checks:

```text
attachLocationScope is implemented for future use.
```

Inventory modules still accept `id_lokasi` from request payloads or query parameters because Phase 1 does not apply location scoping to inventory routes.

CORS:

- `cors()` is enabled globally with default options.
- No origin allowlist is configured.

SQL injection protection:

- Query values use `?` placeholders.
- Dynamic SQL conditions are chosen from fixed strings.
- This is a positive current practice.

Mass assignment risk:

- Services destructure only expected payload fields.
- Unknown body fields are not written to SQL.
- Unknown fields are also not rejected.

Validation gaps:

- Several modules only check required fields.
- No length validation.
- No duplicate validation.
- No JavaScript foreign-key existence validation in many paths.
- Barang Masuk lacks numeric/date validation.

Sensitive error exposure:

- Main CRUD controllers hide errors.
- `exampleController` exposes `error.message`.
- Auth controllers and middleware return generic auth/JWT/bcrypt failure messages and do not expose secrets, password hashes, stack traces, or JWT library errors.

## 22. Location-Scoping Readiness

Future account model mentioned for planning:

```text
SUPER ADMIN
ADMIN
```

Future request context concept:

```js
req.user.id_lokasi
req.user.nama_role
```

Current implementation status:

```text
req.user is implemented by authenticateToken for protected auth routes.
Role middleware foundation is implemented.
Location-scope middleware foundation is implemented.
Inventory routes are not yet protected or location-scoped.
```

Tables/views containing or exposing `id_lokasi`:

| Table/View | Field | Current Usage |
| --- | --- | --- |
| `master_barang` | `id_lokasi` | Create/update payload; selected and joined to `lokasi`. |
| `barang_masuk` | `id_lokasi` | Create/update payload; selected; filtered by `tp`. |
| `barang_keluar` | `id_lokasi` | Create/update payload; selected; filtered by `id_lokasi`; used for stock validation. |
| `v_stok_barang` | `id_lokasi` | Stock list filter; outgoing stock lookup; summary grouping. |

Payloads that currently accept `id_lokasi`:

| Endpoint | Field |
| --- | --- |
| `POST /api/master-barang` | `id_lokasi` |
| `PUT /api/master-barang/:id` | `id_lokasi` |
| `POST /api/barang-masuk` | `id_lokasi` |
| `PUT /api/barang-masuk/:id` | `id_lokasi` |
| `POST /api/barang-keluar` | `id_lokasi` |
| `PUT /api/barang-keluar/:id` | `id_lokasi` |

Queries that filter by location:

| Endpoint | Query Field | SQL |
| --- | --- | --- |
| `GET /api/barang-masuk` | `tp` | `bm.id_lokasi = ?` |
| `GET /api/barang-keluar` | `id_lokasi` | `bk.id_lokasi = ?` |
| `GET /api/stok-barang` | `id_lokasi` | `id_lokasi = ?` |
| `GET /api/stok-barang/ringkasan` | None | Groups all locations; no filter. |

Endpoints that could leak data across locations:

| Endpoint | Reason |
| --- | --- |
| `GET /api/master-barang` | Lists all goods across all locations. |
| `GET /api/master-barang/:id` | Can read any item by ID. |
| `POST/PUT /api/master-barang` | Client can submit any `id_lokasi`. |
| `DELETE /api/master-barang/:id` | Can delete any item by ID if public. |
| `GET /api/barang-masuk` | Without `tp`, lists all incoming transactions. |
| `GET /api/barang-masuk/:id` | Can read any incoming transaction by ID. |
| `POST/PUT /api/barang-masuk` | Client can submit any `id_lokasi`. |
| `DELETE /api/barang-masuk/:id` | Can delete any incoming transaction by ID. |
| `GET /api/barang-keluar` | Without `id_lokasi`, lists all outgoing transactions. |
| `GET /api/barang-keluar/:id` | Can read any outgoing transaction by ID. |
| `POST/PUT /api/barang-keluar` | Client can submit any `id_lokasi`; stock validation trusts requested location. |
| `DELETE /api/barang-keluar/:id` | Can delete any outgoing transaction by ID. |
| `GET /api/stok-barang` | Without `id_lokasi`, lists all stock rows. |
| `GET /api/stok-barang/ringkasan` | Always returns all-location summary. |
| `GET /api/lokasi` | Lists all locations. This may be allowed for Super Admin but may leak location catalog to restricted admins. |
| `GET /api/master-anggota` | Members are not currently location-scoped in the schema references. If members should be per-location later, this endpoint will need schema/design changes. |

Modules needing future location scoping:

| Module | Scoping Need |
| --- | --- |
| Master Barang | Filter reads by `id_lokasi`; restrict create/update `id_lokasi`; restrict delete by scoped item. |
| Barang Masuk | Filter reads by `bm.id_lokasi`; override or validate payload `id_lokasi`; restrict detail/update/delete by scoped row. |
| Barang Keluar | Filter reads by `bk.id_lokasi`; override or validate payload `id_lokasi`; stock validation should use authorized location; restrict detail/update/delete by scoped row. |
| Stok Barang | Filter stock list by allowed locations; summary should respect role/location. |
| Lokasi | Super Admin may manage all; location admins may read only their assigned location or a limited list. |
| Master Anggota | Current table lacks `id_lokasi`; future requirements must decide whether members are global or location-scoped. |

Whether location is trusted from client:

```text
Yes. Current code trusts id_lokasi from request body/query.
```

Future middleware integration points:

| Layer | Possible Integration |
| --- | --- |
| `app.js` | Register authentication middleware before API routes. |
| `routes/*` | Add route-level authorization middleware if roles differ per route. |
| `controllers/*` | Read `req.user.nama_role` and `req.user.id_lokasi` or pass scope to service. |
| `services/*` | Add scoped WHERE clauses and scoped existence checks. |
| `validators/*` | Keep validating shape, but do not trust body `id_lokasi` for authorization. |

Future Super Admin behavior:

- Can access all locations for reads.
- Can create/update records for any location.
- Can manage `lokasi`.
- Can access all-location stock summary.

Future location admin behavior:

- `ADMIN` users should be restricted to assigned `req.user.id_lokasi`.
- Payload `id_lokasi` should either be ignored and replaced with `req.user.id_lokasi`, or validated to equal `req.user.id_lokasi`.
- Detail/update/delete should verify the target row belongs to the authorized location.
- Stock summary should filter to assigned location unless role allows all.

## 23. Current Business Rules

### Implemented Business Rules

| Rule | Evidence |
| --- | --- |
| Stock is derived from `v_stok_barang`. | Stock listing/summary and outgoing validation read from the view; no stock mutation service exists. |
| Stok Barang is read-only. | Only `GET /` and `GET /ringkasan` are routed. |
| Barang Keluar cannot exceed available stock. | `validateAvailableStock` throws when requested quantity exceeds `stok + quantityToRestore`. |
| Barang Keluar create checks stock from `v_stok_barang`. | `createBarangKeluar` calls `validateAvailableStock(id_master_barang, id_lokasi, jumlah)`. |
| Barang Keluar update considers old quantity for same item-location. | `quantityToRestore` is old `jumlah` only when item and location are unchanged. |
| If Barang Keluar item/location changes, old quantity is not restored for new item-location validation. | `quantityToRestore = 0` when item/location differs. |
| Non-member outgoing transactions may use nullable member ID. | `normalizeMasterAnggotaId` converts empty values to `null`. |
| Barang Keluar modal price comes from Master Barang. | `getHargaModal` reads `master_barang.harga_satuan`. |
| Barang Keluar calculated fields are generated by backend. | `calculateTransaction` computes total sale, modal, margin, payment difference. |
| Barang Masuk calculated fields are generated by backend. | `calculatePayment` computes total price and payment difference. |
| Delete uses hard delete. | Every delete service uses `DELETE FROM ... WHERE id = ?`. |
| Location is currently provided by request payload or query parameters. | `id_lokasi` appears in payloads and query filters; no user scope exists. |
| `barang_masuk.status` accepts `LUNAS`, `PIUTANG`, `LOAN`. | Validator allowedStatus. |
| `barang_keluar.status` accepts `C` and `L`. | Validator allowedStatus; `C = Cash`, `L = Loan`. |

### Planned But Not Implemented

```text
Authentication
Authorization
User accounts
User roles
Location-based access control
Audit logs
Reports
Excel export
Backup and restore
Centralized error middleware
Database transactions around stock-sensitive writes
Payment history/installments
Dashboard
```

### Could Not Be Determined

| Area | Reason |
| --- | --- |
| Whether loan statuses affect stock | `v_stok_barang` definition is absent. |
| Actual database primary/foreign key constraints | No DDL/migration/schema file. |
| Actual nullability for most columns | No DDL/migration/schema file. |
| `nilai_aset` formula | View definition is absent. |

## 24. Current API Inventory

Authentication:

```text
Not implemented for every endpoint.
```

Location scoped:

```text
Not implemented for every endpoint.
```

| Method | Complete URL | Module | Controller | Authentication | Location Scoped | Purpose |
| --- | --- | --- | --- | --- | --- | --- |
| `GET` | `http://localhost:5000/` | Root | inline | Not implemented | Not implemented | Server message. |
| `GET` | `http://localhost:5000/api/examples` | Example | `getExamples` | Not implemented | Not implemented | Example DB query. |
| `POST` | `http://localhost:5000/api/auth/login` | Authentication | `login` | Not required | Not implemented | Validate credentials and return JWT plus safe user data. |
| `GET` | `http://localhost:5000/api/auth/me` | Authentication | `getCurrentUser` | `authenticateToken` | Prepared but not applied as inventory scope | Return safe current user data from the database. |
| `GET` | `http://localhost:5000/api/master-anggota` | Master Anggota | `getAllMasterAnggota` | Not implemented | Not implemented | List members. |
| `GET` | `http://localhost:5000/api/master-anggota/:id` | Master Anggota | `getMasterAnggotaById` | Not implemented | Not implemented | Member detail. |
| `POST` | `http://localhost:5000/api/master-anggota` | Master Anggota | `createMasterAnggota` | Not implemented | Not implemented | Create member. |
| `PUT` | `http://localhost:5000/api/master-anggota/:id` | Master Anggota | `updateMasterAnggota` | Not implemented | Not implemented | Update member. |
| `DELETE` | `http://localhost:5000/api/master-anggota/:id` | Master Anggota | `deleteMasterAnggota` | Not implemented | Not implemented | Hard delete member. |
| `GET` | `http://localhost:5000/api/master-barang` | Master Barang | `getAllMasterBarang` | Not implemented | Not implemented | List goods. |
| `GET` | `http://localhost:5000/api/master-barang/:id` | Master Barang | `getMasterBarangById` | Not implemented | Not implemented | Goods detail. |
| `POST` | `http://localhost:5000/api/master-barang` | Master Barang | `createMasterBarang` | Not implemented | Not implemented | Create goods. |
| `PUT` | `http://localhost:5000/api/master-barang/:id` | Master Barang | `updateMasterBarang` | Not implemented | Not implemented | Update goods. |
| `DELETE` | `http://localhost:5000/api/master-barang/:id` | Master Barang | `deleteMasterBarang` | Not implemented | Not implemented | Hard delete goods. |
| `GET` | `http://localhost:5000/api/lokasi` | Lokasi | `getAllLokasi` | Not implemented | Not implemented | List locations. |
| `GET` | `http://localhost:5000/api/lokasi/:id` | Lokasi | `getLokasiById` | Not implemented | Not implemented | Location detail. |
| `POST` | `http://localhost:5000/api/lokasi` | Lokasi | `createLokasi` | Not implemented | Not implemented | Create location. |
| `PUT` | `http://localhost:5000/api/lokasi/:id` | Lokasi | `updateLokasi` | Not implemented | Not implemented | Update location. |
| `DELETE` | `http://localhost:5000/api/lokasi/:id` | Lokasi | `deleteLokasi` | Not implemented | Not implemented | Hard delete location. |
| `GET` | `http://localhost:5000/api/barang-masuk` | Barang Masuk | `getAllBarangMasuk` | Not implemented | Not implemented | List incoming transactions. |
| `GET` | `http://localhost:5000/api/barang-masuk/:id` | Barang Masuk | `getBarangMasukById` | Not implemented | Not implemented | Incoming detail. |
| `POST` | `http://localhost:5000/api/barang-masuk` | Barang Masuk | `createBarangMasuk` | Not implemented | Not implemented | Create incoming transaction. |
| `PUT` | `http://localhost:5000/api/barang-masuk/:id` | Barang Masuk | `updateBarangMasuk` | Not implemented | Not implemented | Update incoming transaction. |
| `DELETE` | `http://localhost:5000/api/barang-masuk/:id` | Barang Masuk | `deleteBarangMasuk` | Not implemented | Not implemented | Hard delete incoming transaction. |
| `GET` | `http://localhost:5000/api/barang-keluar` | Barang Keluar | `getAllBarangKeluar` | Not implemented | Not implemented | List outgoing transactions. |
| `GET` | `http://localhost:5000/api/barang-keluar/:id` | Barang Keluar | `getBarangKeluarById` | Not implemented | Not implemented | Outgoing detail. |
| `POST` | `http://localhost:5000/api/barang-keluar` | Barang Keluar | `createBarangKeluar` | Not implemented | Not implemented | Create outgoing transaction with stock validation. |
| `PUT` | `http://localhost:5000/api/barang-keluar/:id` | Barang Keluar | `updateBarangKeluar` | Not implemented | Not implemented | Update outgoing transaction with effective stock validation. |
| `DELETE` | `http://localhost:5000/api/barang-keluar/:id` | Barang Keluar | `deleteBarangKeluar` | Not implemented | Not implemented | Hard delete outgoing transaction. |
| `GET` | `http://localhost:5000/api/stok-barang` | Stok Barang | `getAllStokBarang` | Not implemented | Not implemented | List stock view rows. |
| `GET` | `http://localhost:5000/api/stok-barang/ringkasan` | Stok Barang | `getRingkasanStokBarang` | Not implemented | Not implemented | Stock summary overall and per location. |

## 25. Data Flow Examples

### Creating Barang Masuk

```text
HTTP POST http://localhost:5000/api/barang-masuk
-> routes/barangMasukRoutes.js
-> barangMasukController.createBarangMasuk
-> validateBarangMasukPayload(req.body)
-> barangMasukService.createBarangMasuk(req.body)
-> barangMasukService.calculatePayment(payload)
-> INSERT INTO barang_masuk
-> barangMasukService.getBarangMasukById(result.insertId)
-> SELECT detail with LEFT JOIN master_barang and LEFT JOIN lokasi
-> response.success(res, 'Data barang masuk berhasil dibuat', data, 201)
```

Note:

- There is no Master Barang lookup in `createBarangMasuk` before insert.
- The selected detail joins `master_barang` after insert.
- There is no stock table mutation.
- There is no database transaction.

### Creating Barang Keluar

```text
HTTP POST http://localhost:5000/api/barang-keluar
-> routes/barangKeluarRoutes.js
-> barangKeluarController.createBarangKeluar
-> validateBarangKeluarPayload(req.body)
-> barangKeluarService.createBarangKeluar(req.body)
-> barangKeluarService.calculateTransaction(payload)
-> barangKeluarService.getHargaModal(id_master_barang)
-> SELECT master_barang.harga_satuan
-> calculate total_harga_jual, harga_modal, margin, sisa_bayar
-> barangKeluarService.validateAvailableStock(id_master_barang, id_lokasi, jumlah)
-> barangKeluarService.getAvailableStock(id_master_barang, id_lokasi)
-> SELECT stok FROM v_stok_barang
-> normalizeMasterAnggotaId(payload.id_master_anggota)
-> INSERT INTO barang_keluar
-> barangKeluarService.getBarangKeluarById(result.insertId)
-> SELECT detail with member, goods, and location joins
-> response.success(res, 'Data barang keluar berhasil dibuat', data, 201)
```

### Updating Barang Keluar

```text
HTTP PUT http://localhost:5000/api/barang-keluar/:id
-> routes/barangKeluarRoutes.js
-> barangKeluarController.updateBarangKeluar
-> validateBarangKeluarPayload(req.body)
-> barangKeluarService.updateBarangKeluar(req.params.id, req.body)
-> barangKeluarService.getBarangKeluarById(id)
-> if existing transaction missing, return null
-> barangKeluarService.calculateTransaction(payload)
-> barangKeluarService.getHargaModal(id_master_barang)
-> determine isSameStockSource:
   existing id_master_barang == payload id_master_barang
   and existing id_lokasi == payload id_lokasi
-> quantityToRestore = existing.jumlah when same source, otherwise 0
-> validateAvailableStock(id_master_barang, id_lokasi, jumlah, quantityToRestore)
-> getAvailableStock from v_stok_barang
-> effectiveStock = availableStock + quantityToRestore
-> throw ServiceError if requested quantity exceeds effectiveStock
-> normalizeMasterAnggotaId(payload.id_master_anggota)
-> UPDATE barang_keluar
-> getBarangKeluarById(id)
-> response.success(res, 'Data barang keluar berhasil diperbarui', data)
```

Example:

```text
Current stock from the view: 80
Old outgoing transaction: 20
Same item-location: yes
Effective stock: 80 + 20 = 100
```

Changed item/location example:

```text
Current stock from the view for new item-location: 80
Old outgoing transaction: 20
Same item-location: no
Effective stock: 80 + 0 = 80
```

### Reading Stok Barang

```text
HTTP GET http://localhost:5000/api/stok-barang
-> routes/stokBarangRoutes.js
-> stokBarangController.getAllStokBarang
-> validateStokBarangQuery(req.query)
-> stokBarangService.getAllStokBarang(filters)
-> SELECT fields FROM v_stok_barang
-> optional WHERE id_lokasi = ?
-> optional search LIKE conditions
-> optional stok > 0
-> ORDER BY nama_lokasi, nama_barang, kode_barang
-> response.success(res, 'Data stok barang berhasil diambil', data)
```

### Reading Stock Summary

```text
HTTP GET http://localhost:5000/api/stok-barang/ringkasan
-> routes/stokBarangRoutes.js
-> stokBarangController.getRingkasanStokBarang
-> stokBarangService.getRingkasanStokBarang()
-> SELECT overall COUNT/SUM from v_stok_barang
-> SELECT per-location COUNT/SUM from v_stok_barang GROUP BY location fields
-> response.success(res, 'Ringkasan stok barang berhasil diambil', data)
```

## 26. Current Limitations and Technical Debt

Proven limitations:

| Limitation | Evidence |
| --- | --- |
| Inventory routes are not authenticated | Phase 1 only protects `/api/auth/me`; existing inventory modules remain public. |
| Inventory routes are not authorized | `requireRole` exists but is not applied to inventory route modules. |
| Inventory routes are not location-scoped | `attachLocationScope` exists but is not applied to inventory route modules. |
| No user CRUD or public registration | Only login/current-user and initial Super Admin script are implemented. |
| Location trusted from client in inventory modules | `id_lokasi` is still accepted in inventory body/query payloads because Phase 2 scoping is not applied. |
| No audit log | No audit table/service/middleware. |
| No database transaction around stock-sensitive writes | No transaction API usage. |
| Race condition between stock check and insert/update | `validateAvailableStock` and write are separate queries. |
| No centralized error middleware | `app.js` has only fallback 404. |
| No automated tests | No test files or test script. |
| No full schema files | Repository has no full SQL DDL/schema dump; only a focused Barang Keluar status migration exists. |
| No pagination | List endpoints return all matching rows. |
| Duplicate validation logic | Several validators define local `isEmpty`. |
| Generic error messages | CRUD controllers catch and hide original errors. |
| Example endpoint exposes database error messages | `exampleController` returns `error.message`. |
| No SUM transaction model | Only direct transaction tables are referenced. |
| Payment history not implemented | No payment history routes/tables/services. |
| No backup/restore | No routes/services/scripts. |
| No reports/export | No report/export modules. |
| Master Barang dropdown endpoint missing | No route for it. |
| Master Anggota search missing | No query handling in controller/service. |
| Master Barang search/pagination missing | No query handling in controller/service. |
| Barang Masuk search/pagination missing | Only `bulan` and `tp` filters exist. |
| Stok summary filters missing | Summary endpoint ignores query. |
| Barang Masuk numeric/date validation gaps | Validator only checks required fields and status. |
| Master Barang numeric validation gaps | Validator only checks required fields. |
| Hard deletes everywhere | Delete services use SQL `DELETE`. |
| View definition absent | `v_stok_barang` math cannot be verified. |
| Legacy Barang Keluar status data may exist | Existing database rows may still contain `LUNAS`, `PIUTANG`, or `LOAN` until the migration or equivalent database maintenance is run. |

Uncertain findings:

| Area | Status |
| --- | --- |
| Actual foreign-key constraints | Could not be determined from the current repository. |
| Actual column nullability | Could not be determined from the current repository. |
| Whether database constraints catch duplicate codes/numbers | Could not be determined from the current repository. |
| Whether loan statuses affect stock | Could not be determined from the current repository. |

## 27. Future Expansion Points

These are future design considerations only. They are not implemented.

### Authentication

Affected files/modules:

- `app.js`: register auth middleware before API routes.
- `middleware/`: add authentication middleware.
- New user/account service, controller, route, and validator files.
- `.env.example`: add JWT/session/password-related variables only when implemented.

### User Accounts

Affected modules:

- Existing `users` table.
- Auth routes for login/current user are implemented.
- Future user CRUD should build on `users`, not create a replacement table.
- Existing controllers may need `req.user`.

### Role Management

Future role concept:

```text
SUPER ADMIN
ADMIN
```

Affected areas:

- Auth middleware attaches `req.user.nama_role`.
- Authorization middleware should check role per route.
- `lokasi` management will likely be restricted to `SUPER ADMIN`.

### Location-Based Authorization

Future scope concept:

```js
req.user.id_lokasi
req.user.nama_role
```

Affected modules:

- Master Barang: scope by `master_barang.id_lokasi`.
- Barang Masuk: scope by `barang_masuk.id_lokasi`.
- Barang Keluar: scope by `barang_keluar.id_lokasi`.
- Stok Barang: scope by `v_stok_barang.id_lokasi`.
- Lokasi: restrict list/detail/manage behavior by role.
- Master Anggota: decide whether members are global or need `id_lokasi`.

### Super Admin Access

Future behavior:

- Access all locations.
- Manage all master data.
- View all stock summaries.
- Override location filters if needed.

Integration:

- Authorization middleware.
- Service filters that accept a scope object.

### Audit Logs

Affected modules:

- All create/update/delete controllers or services.
- Future middleware could capture `req.user`, route, method, entity, entity ID, before/after snapshots.
- Hard delete behavior may need audit records before deletion.

### SUM Transaction Header and Detail Model

Not implemented.

Potential impact:

- `barang_masuk` and `barang_keluar` service architecture.
- Current single-row transaction model may need header/detail tables.
- Calculations may move from single transaction row to aggregate detail rows.

### Installment Payment History

Not implemented.

Potential impact:

- `jumlah_bayar` and `sisa_bayar` semantics.
- New payment history table/service/routes.
- Status derivation may depend on payment totals.

### Reports

Not implemented.

Potential impact:

- New report routes/controllers/services.
- Likely reuse `barang_masuk`, `barang_keluar`, `v_stok_barang`, and summary queries.
- Must incorporate future role/location scope.

### Excel Export

Not implemented.

Potential impact:

- Add export library only when implementing.
- Export endpoints should reuse scoped report/list services.

### Backup and Restore

Not implemented.

Potential impact:

- New admin-only routes/scripts.
- Requires careful database credential and filesystem handling.
- Should be restricted to `SUPER ADMIN`.

### Dashboard Finalization

Not implemented.

Potential impact:

- Could reuse `stokBarangService.getRingkasanStokBarang`.
- May need date-filtered transaction summaries from `barang_masuk` and `barang_keluar`.
- Must be location-scoped for non-Super Admin roles.

## 28. Recommended Reading Order

For future developers or AI agents continuing this backend, read in this order:

```text
1. Project Overview
2. Application Entry Point
3. Database Connection
4. Current Database Model
5. SQL Views and Derived Data
6. API Response Format
7. Routing Architecture
8. Module Documentation
9. Validation Architecture
10. Service Architecture
11. Controller Architecture
12. Current Business Rules
13. Location-Scoping Readiness
14. Current Limitations and Technical Debt
15. Future Expansion Points
```
