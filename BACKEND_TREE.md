# Backend Repository Tree

Clean tree of the repository, excluding detailed expansion of `.git`, `node_modules`, and generated/cache-like directories.

```text
inventory-backend/
|-- .agents/
|-- .codex/
|-- .env
|-- .env.example
|-- .git/
|-- app.js
|-- BACKEND_CONTEXT.md
|-- BACKEND_TREE.md
|-- config/
|   `-- db.js
|-- controllers/
|   |-- barangKeluarController.js
|   |-- barangMasukController.js
|   |-- exampleController.js
|   |-- lokasiController.js
|   |-- masterAnggotaController.js
|   `-- masterBarangController.js
|-- middleware/
|   `-- .gitkeep
|-- node_modules/
|-- package-lock.json
|-- package.json
|-- routes/
|   |-- barangKeluarRoutes.js
|   |-- barangMasukRoutes.js
|   |-- exampleRoutes.js
|   |-- lokasiRoutes.js
|   |-- masterAnggotaRoutes.js
|   `-- masterBarangRoutes.js
|-- services/
|   |-- barangKeluarService.js
|   |-- barangMasukService.js
|   |-- lokasiService.js
|   |-- masterAnggotaService.js
|   `-- masterBarangService.js
|-- utils/
|   `-- response.js
`-- validators/
    |-- barangKeluarValidator.js
    |-- barangMasukValidator.js
    |-- lokasiValidator.js
    |-- masterAnggotaValidator.js
    `-- masterBarangValidator.js
```

# Root Files

## `app.js`

Why it exists:

- Main application entry point.
- Creates the Express application and starts the HTTP server.

Exports:

- Nothing. It starts the server directly with `app.listen(...)`.

Depends on:

- `express`
- `cors`
- `dotenv`
- `routes/exampleRoutes`
- `routes/masterBarangRoutes`
- `routes/masterAnggotaRoutes`
- `routes/lokasiRoutes`
- `routes/barangMasukRoutes`
- `routes/barangKeluarRoutes`

Actively wired:

- Yes. It is the `main` file in `package.json`.
- `npm start` runs `node app.js`.
- `npm run dev` runs `nodemon app.js`.

Middleware and route registrations:

- Loads environment variables with `require('dotenv').config()`.
- Uses `cors()` globally.
- Uses `express.json()` globally.
- `GET /` returns `{ message: 'API Inventory Pupuk berjalan' }`.
- Mounts `exampleRoutes` at `/api/examples`.
- Mounts `masterBarangRoutes` at `/api/master-barang`.
- Mounts `masterAnggotaRoutes` at `/api/master-anggota`.
- Mounts `lokasiRoutes` at `/api/lokasi`.
- Mounts `barangMasukRoutes` at `/api/barang-masuk`.
- Mounts `barangKeluarRoutes` at `/api/barang-keluar`.
- Final catch-all handler returns `404` with `{ success: false, message: 'Endpoint tidak ditemukan' }`.

Incomplete/absent:

- No central error middleware.
- No authentication middleware.
- No database connectivity check at startup.
- No custom malformed JSON error handler.

## `BACKEND_CONTEXT.md`

Why it exists:

- Repository handoff document describing the backend architecture, routes, services, validators, SQL usage, response format, and known risks.

Exports:

- Nothing.

Depends on:

- No runtime dependencies.

Actively wired:

- No. It is documentation only and is not imported by application source.

## `BACKEND_TREE.md`

Why it exists:

- Repository handoff document describing the file tree and responsibilities of important files.

Exports:

- Nothing.

Depends on:

- No runtime dependencies.

Actively wired:

- No. It is documentation only and is not imported by application source.

## `package.json`

Why it exists:

- Defines project metadata, scripts, module type, and dependencies.

Important fields:

- `"main": "app.js"`
- `"type": "commonjs"`
- `"scripts.dev": "nodemon app.js"`
- `"scripts.start": "node app.js"`

Dependencies:

- `cors`
- `dotenv`
- `express`
- `mysql2`

Dev dependencies:

- `nodemon`

## `package-lock.json`

Why it exists:

- Locks installed npm dependency versions.

Actively wired:

- Used by npm install workflows.

## `.env.example`

Why it exists:

- Documents required environment variable names without relying on local secrets.

Variables listed:

- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`

## `.env`

Why it exists:

- Local runtime environment values.

Security note:

- Values are not documented here and should not be copied into handoff docs.

# Folders

## `config/`

Responsibility:

- Shared application configuration.
- Currently only database setup exists.

### `config/db.js`

Why it exists:

- Creates and exports the MySQL connection pool.

Exports:

- `pool`, created by `mysql.createPool(...)`.

Depends on:

- `mysql2/promise`
- `dotenv`

Used by:

- `controllers/exampleController.js`
- `services/lokasiService.js`
- `services/masterAnggotaService.js`
- `services/masterBarangService.js`
- `services/barangMasukService.js`
- `services/barangKeluarService.js`

Connection strategy:

- MySQL promise pool.
- Reads `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT`.
- Uses `connectionLimit: 10`.
- Uses `waitForConnections: true`.
- Uses `queueLimit: 0`.
- Defaults DB port to `3306` when env value is missing/falsy.

Actively wired:

- Yes, all services use it.

Incomplete/absent:

- No health check.
- No explicit transaction helper.
- No schema validation at startup.

## `routes/`

Responsibility:

- Express router modules.
- Each file maps HTTP method/path pairs to controller functions.

All route files are actively wired through `app.js`.

### `routes/exampleRoutes.js`

Why it exists:

- Provides an example/test route.

Exports:

- Express router.

Depends on:

- `express`
- `controllers/exampleController`

Registered paths:

- Mounted at `/api/examples`.
- `GET /api/examples` -> `exampleController.getExamples`.

Status:

- Actively wired.
- Looks like a test/example endpoint, not a core business endpoint.

### `routes/lokasiRoutes.js`

Why it exists:

- Defines location CRUD routes.

Exports:

- Express router.

Depends on:

- `express`
- `controllers/lokasiController`

Registered paths:

- `GET /api/lokasi` -> `getAllLokasi`
- `GET /api/lokasi/:id` -> `getLokasiById`
- `POST /api/lokasi` -> `createLokasi`
- `PUT /api/lokasi/:id` -> `updateLokasi`
- `DELETE /api/lokasi/:id` -> `deleteLokasi`

Status:

- Actively wired.

### `routes/masterAnggotaRoutes.js`

Why it exists:

- Defines member master CRUD routes.

Exports:

- Express router.

Depends on:

- `express`
- `controllers/masterAnggotaController`

Registered paths:

- `GET /api/master-anggota` -> `getAllMasterAnggota`
- `GET /api/master-anggota/:id` -> `getMasterAnggotaById`
- `POST /api/master-anggota` -> `createMasterAnggota`
- `PUT /api/master-anggota/:id` -> `updateMasterAnggota`
- `DELETE /api/master-anggota/:id` -> `deleteMasterAnggota`

Status:

- Actively wired.

### `routes/masterBarangRoutes.js`

Why it exists:

- Defines goods master CRUD routes.

Exports:

- Express router.

Depends on:

- `express`
- `controllers/masterBarangController`

Registered paths:

- `GET /api/master-barang` -> `getAllMasterBarang`
- `GET /api/master-barang/:id` -> `getMasterBarangById`
- `POST /api/master-barang` -> `createMasterBarang`
- `PUT /api/master-barang/:id` -> `updateMasterBarang`
- `DELETE /api/master-barang/:id` -> `deleteMasterBarang`

Status:

- Actively wired.

### `routes/barangMasukRoutes.js`

Why it exists:

- Defines incoming goods transaction CRUD routes.

Exports:

- Express router.

Depends on:

- `express`
- `controllers/barangMasukController`

Registered paths:

- `GET /api/barang-masuk` -> `getAllBarangMasuk`
- `GET /api/barang-masuk/:id` -> `getBarangMasukById`
- `POST /api/barang-masuk` -> `createBarangMasuk`
- `PUT /api/barang-masuk/:id` -> `updateBarangMasuk`
- `DELETE /api/barang-masuk/:id` -> `deleteBarangMasuk`

Status:

- Actively wired.

### `routes/barangKeluarRoutes.js`

Why it exists:

- Defines outgoing goods transaction CRUD routes.

Exports:

- Express router.

Depends on:

- `express`
- `controllers/barangKeluarController`

Registered paths:

- `GET /api/barang-keluar` -> `getAllBarangKeluar`
- `GET /api/barang-keluar/:id` -> `getBarangKeluarById`
- `POST /api/barang-keluar` -> `createBarangKeluar`
- `PUT /api/barang-keluar/:id` -> `updateBarangKeluar`
- `DELETE /api/barang-keluar/:id` -> `deleteBarangKeluar`

Status:

- Actively wired.

## `controllers/`

Responsibility:

- HTTP request handlers.
- Read route parameters and request bodies.
- Invoke validators for create/update operations.
- Call service functions.
- Format success, validation, not-found, and generic error responses.

All controller files are actively wired through routes.

### `controllers/exampleController.js`

Exports:

- `getExamples`

Depends on:

- `config/db`

Handlers:

- `getExamples`: runs `SELECT 1 AS id, ? AS name` directly.

Used by:

- `routes/exampleRoutes.js`

Status:

- Actively wired.
- Bypasses `utils/response.js`.
- Appears to be example/test code.

### `controllers/lokasiController.js`

Exports:

- `getAllLokasi`
- `getLokasiById`
- `createLokasi`
- `updateLokasi`
- `deleteLokasi`

Depends on:

- `services/lokasiService`
- `utils/response`
- `validators/lokasiValidator`

Used by:

- `routes/lokasiRoutes.js`

Status:

- Actively wired.

### `controllers/masterAnggotaController.js`

Exports:

- `getAllMasterAnggota`
- `getMasterAnggotaById`
- `createMasterAnggota`
- `updateMasterAnggota`
- `deleteMasterAnggota`

Depends on:

- `services/masterAnggotaService`
- `utils/response`
- `validators/masterAnggotaValidator`

Used by:

- `routes/masterAnggotaRoutes.js`

Status:

- Actively wired.

### `controllers/masterBarangController.js`

Exports:

- `getAllMasterBarang`
- `getMasterBarangById`
- `createMasterBarang`
- `updateMasterBarang`
- `deleteMasterBarang`

Depends on:

- `services/masterBarangService`
- `utils/response`
- `validators/masterBarangValidator`

Used by:

- `routes/masterBarangRoutes.js`

Status:

- Actively wired.

### `controllers/barangMasukController.js`

Exports:

- `getAllBarangMasuk`
- `getBarangMasukById`
- `createBarangMasuk`
- `updateBarangMasuk`
- `deleteBarangMasuk`

Depends on:

- `services/barangMasukService`
- `utils/response`
- `validators/barangMasukValidator`

Used by:

- `routes/barangMasukRoutes.js`

Status:

- Actively wired.

### `controllers/barangKeluarController.js`

Exports:

- `getAllBarangKeluar`
- `getBarangKeluarById`
- `createBarangKeluar`
- `updateBarangKeluar`
- `deleteBarangKeluar`

Depends on:

- `services/barangKeluarService`
- `utils/response`
- `validators/barangKeluarValidator`

Used by:

- `routes/barangKeluarRoutes.js`

Status:

- Actively wired.
- Has a possible ambiguity in `null` handling from `barangKeluarService` for update/create paths.

## `services/`

Responsibility:

- Database access and SQL.
- Feature-specific persistence behavior.
- Transaction total/payment/margin calculations.

All service files are actively used by matching controllers.

### `services/lokasiService.js`

Exports:

- `getAllLokasi`
- `getLokasiById`
- `createLokasi`
- `updateLokasi`
- `deleteLokasi`

Database entity:

- `lokasi`

Operations:

- Select all ordered by `nama_lokasi ASC`.
- Select by `id`.
- Insert `nama_lokasi`.
- Update `nama_lokasi` and `updated_at`.
- Hard delete by `id`.

Depends on:

- `config/db`

Status:

- Actively wired.

### `services/masterAnggotaService.js`

Exports:

- `getAllMasterAnggota`
- `getMasterAnggotaById`
- `createMasterAnggota`
- `updateMasterAnggota`
- `deleteMasterAnggota`

Database entity:

- `master_anggota`

Operations:

- Select all ordered by `nama_anggota ASC`.
- Select by `id`.
- Insert `nomor_anggota`, `nama_anggota`, `keterangan`.
- Update the same fields plus `updated_at`.
- Hard delete by `id`.

Depends on:

- `config/db`

Status:

- Actively wired.

### `services/masterBarangService.js`

Exports:

- `getAllMasterBarang`
- `getMasterBarangById`
- `createMasterBarang`
- `updateMasterBarang`
- `deleteMasterBarang`

Database entities:

- `master_barang`
- `lokasi`

Operations:

- Select goods fields with `LEFT JOIN lokasi`.
- Select all ordered by `mb.nama_barang ASC`.
- Select by `mb.id`.
- Insert `kode_barang`, `nama_barang`, `satuan`, `id_lokasi`, `harga_satuan`.
- Update the same fields plus `updated_at`.
- Hard delete by `id`.

Depends on:

- `config/db`

Status:

- Actively wired.

### `services/barangMasukService.js`

Exports:

- `getAllBarangMasuk`
- `getBarangMasukById`
- `createBarangMasuk`
- `updateBarangMasuk`
- `deleteBarangMasuk`

Database entities:

- `barang_masuk`
- `master_barang`
- `lokasi`

Operations:

- Select transaction fields with `LEFT JOIN master_barang` and `LEFT JOIN lokasi`.
- Select all ordered by `bm.tanggal DESC, bm.id DESC`.
- Select by `bm.id`.
- Insert incoming transaction fields.
- Update incoming transaction fields plus `updated_at`.
- Hard delete by `id`.

Internal behavior:

- `calculatePayment` calculates `total_harga` and `sisa_bayar`.

Depends on:

- `config/db`

Status:

- Actively wired.
- No stock mutation or transaction handling.

### `services/barangKeluarService.js`

Exports:

- `getAllBarangKeluar`
- `getBarangKeluarById`
- `createBarangKeluar`
- `updateBarangKeluar`
- `deleteBarangKeluar`

Database entities:

- `barang_keluar`
- `master_anggota`
- `master_barang`
- `lokasi`

Operations:

- Select outgoing transaction fields with member/goods/location joins.
- Select all ordered by `bk.tanggal DESC, bk.id DESC`.
- Select by `bk.id`.
- Read `master_barang.harga_satuan` as modal price.
- Insert outgoing transaction fields.
- Update outgoing transaction fields plus `updated_at`.
- Hard delete by `id`.

Internal behavior:

- `normalizeMasterAnggotaId` converts missing/empty member ID to `null`.
- `getHargaModal` fetches modal price from `master_barang`.
- `calculateTransaction` calculates `total_harga_jual`, `harga_modal`, `margin`, and `sisa_bayar`.

Depends on:

- `config/db`

Status:

- Actively wired.
- No stock mutation, insufficient stock check, or transaction handling.

## `validators/`

Responsibility:

- Manual request-body validation for create/update operations.
- Returns a validation message string on failure or `null` on success.

All validator files are actively used by matching controllers.

### `validators/lokasiValidator.js`

Exports:

- `validateLokasiPayload`

Payload validated:

- `nama_lokasi`

Status:

- Actively wired into `lokasiController`.

### `validators/masterAnggotaValidator.js`

Exports:

- `validateMasterAnggotaPayload`

Payload validated:

- `nomor_anggota`
- `nama_anggota`

Status:

- Actively wired into `masterAnggotaController`.
- `keterangan` is not required.

### `validators/masterBarangValidator.js`

Exports:

- `validateMasterBarangPayload`

Payload validated:

- `kode_barang`
- `nama_barang`
- `satuan`
- `id_lokasi`
- `harga_satuan`

Status:

- Actively wired into `masterBarangController`.

### `validators/barangMasukValidator.js`

Exports:

- `validateBarangMasukPayload`

Payload validated:

- `tanggal`
- `id_master_barang`
- `id_lokasi`
- `jumlah`
- `harga_satuan`
- `jumlah_bayar`
- `status`

Status values:

- `LUNAS`
- `PIUTANG`
- `LOAN`

Status:

- Actively wired into `barangMasukController`.

### `validators/barangKeluarValidator.js`

Exports:

- `validateBarangKeluarPayload`

Payload validated:

- `tanggal`
- `id_master_barang`
- `id_lokasi`
- `jumlah`
- `harga_jual`
- `jumlah_bayar`
- `status`

Optional by service behavior:

- `id_master_anggota`

Status values:

- `C`
- `LUNAS`
- `PIUTANG`
- `LOAN`

Status:

- Actively wired into `barangKeluarController`.

## `utils/`

Responsibility:

- Shared helper behavior.

### `utils/response.js`

Why it exists:

- Provides consistent JSON response helpers for the main CRUD controllers.

Exports:

- `success(res, message, data = null, statusCode = 200)`
- `error(res, message, statusCode = 500)`

Used by:

- `controllers/lokasiController.js`
- `controllers/masterAnggotaController.js`
- `controllers/masterBarangController.js`
- `controllers/barangMasukController.js`
- `controllers/barangKeluarController.js`

Response behavior:

- `success` returns `{ success: true, message, data }`.
- `error` returns `{ success: false, message }`.

Status:

- Actively wired into main feature controllers.
- Not used by `exampleController`, root route, or the 404 fallback.

## `middleware/`

Responsibility:

- Intended place for Express middleware.

Files:

- `.gitkeep`

Status:

- No implemented middleware exists.
- No files from this folder are required by `app.js`.

## `.agents/`

Observed status:

- Present in the working tree.
- Not used by application source.
- Purpose is not defined by application code in this repository.

## `.codex/`

Observed status:

- Present in the working tree.
- Not used by application source.
- Purpose is not defined by application code in this repository.

## `.git/`

Responsibility:

- Git repository metadata.

Status:

- Listed but intentionally not expanded.

## `node_modules/`

Responsibility:

- Installed npm dependencies.

Status:

- Listed but intentionally not expanded.
