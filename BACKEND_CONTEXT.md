# Backend Overview

This repository is a Node.js backend API for an inventory/pupuk domain. The code exposes CRUD APIs for locations, members, master goods, incoming goods, and outgoing goods. It also includes one example/test route.

Visible business domain from the code:

- `lokasi`: location master data.
- `master_anggota`: member master data.
- `master_barang`: goods master data, linked to `lokasi`.
- `barang_masuk`: incoming goods transactions.
- `barang_keluar`: outgoing goods transactions, optionally linked to `master_anggota`.

Runtime and framework:

- Node.js application.
- Express `5.2.1`.
- CommonJS module system, confirmed by `"type": "commonjs"` in `package.json` and usage of `require(...)` / `module.exports`.
- MySQL access through `mysql2/promise`.
- Environment configuration through `dotenv`.

Database connection strategy:

- [config/db.js](config/db.js) creates a MySQL promise pool with `mysql.createPool(...)`.
- The exported pool is required directly by service files and the example controller.
- Queries are executed with `db.query(...)`.
- The repository is configured to connect to MySQL through environment variables, but no schema/migration/seed file exists in this repository and startup does not test the connection. Actual database availability must be verified by running an endpoint that queries the database or by adding an explicit health check.

Current backend architecture:

- `app.js` starts the Express server and registers route modules.
- `routes/` maps HTTP methods and paths to controller functions.
- `controllers/` reads `req.params` / `req.body`, invokes validators and services, then formats HTTP responses.
- `services/` contains SQL queries and calculation logic.
- `validators/` contains simple JavaScript payload validation.
- `utils/response.js` provides shared success/error JSON helpers.
- `middleware/` exists but currently contains only `.gitkeep`; no middleware module is implemented.

How the backend is started:

- Development: `npm run dev`, which runs `nodemon app.js`.
- Production/basic start: `npm start`, which runs `node app.js`.
- Default port is `5000` when `PORT` is not set.

# Tech Stack

Dependencies from `package.json`:

| Dependency | Version | Role |
| --- | --- | --- |
| `express` | `^5.2.1` | HTTP server, routing, JSON body parser through `express.json()`. |
| `cors` | `^2.8.6` | Enables CORS globally with default settings via `app.use(cors())`. |
| `dotenv` | `^17.4.2` | Loads `.env` into `process.env`. Used in `app.js` and `config/db.js`. |
| `mysql2` | `^3.22.5` | MySQL driver. Promise API is used through `mysql2/promise`. |

Development dependencies:

| Dependency | Version | Role |
| --- | --- | --- |
| `nodemon` | `^3.1.14` | Restarts the server during development via `npm run dev`. |

Validation libraries:

- No validation library is installed.
- Validation is implemented manually in files under `validators/`.

# Application Entry Flow

Actual startup flow:

`app.js`
-> imports Express and CORS
-> runs `require('dotenv').config()`
-> imports route modules
-> creates `app`
-> reads `PORT` from `process.env.PORT || 5000`
-> registers middleware
-> registers root route
-> registers API route prefixes
-> registers catch-all 404 handler
-> starts server with `app.listen(PORT, ...)`

Middleware:

- `app.use(cors())`: default CORS configuration.
- `app.use(express.json())`: JSON request body parsing.

Routes registered in `app.js`:

- `GET /`
- `/api/examples`
- `/api/master-barang`
- `/api/master-anggota`
- `/api/lokasi`
- `/api/barang-masuk`
- `/api/barang-keluar`

Error middleware:

- No Express error-handling middleware with `(err, req, res, next)` exists.
- Malformed JSON body errors from `express.json()` are not converted into the shared JSON error format by application code.

404 handling:

- A final `app.use((req, res) => ...)` returns status `404` with:

```json
{
  "success": false,
  "message": "Endpoint tidak ditemukan"
}
```

# Backend Architecture

Layer responsibilities as implemented:

| Layer | Responsibility |
| --- | --- |
| `config` | Database pool setup. |
| `routes` | Express router definitions; maps HTTP methods/paths to controllers. |
| `controllers` | Request handling, validation calls, service calls, response formatting, generic catch blocks. |
| `services` | SQL queries, existence checks before some updates, calculations for transaction totals/payment/margin. |
| `validators` | Required-field and status-value checks. |
| `middleware` | Folder exists but no implemented middleware. |
| `utils` | Shared response helpers. |

Actual request flow for implemented API features:

Request
-> route file
-> controller function
-> validator for `POST`/`PUT` where present
-> service function
-> MySQL query through pooled connection
-> response helper

Where behavior lives:

- Business/calculation logic: service files, especially `barangMasukService.js` and `barangKeluarService.js`.
- SQL queries: service files, plus one example query in `controllers/exampleController.js`.
- Payload validation: validator files invoked by controllers for create/update operations.
- HTTP responses: mostly `utils/response.js`; `GET /`, 404, and `exampleController` use inline `res.json(...)`.
- Database connections: `config/db.js` exports a pool.
- Transactions: no transaction handling is implemented.

# Current Development Status

## Infrastructure

- [x] Express app setup
- [x] CommonJS module setup
- [x] dotenv loaded
- [x] CORS enabled
- [x] JSON body parsing enabled
- [x] MySQL promise pool configured
- [x] Shared response helper
- [x] 404 fallback route
- [ ] Central Express error middleware
- [ ] Authentication/authorization
- [ ] Pagination/search/filtering
- [ ] Automated tests
- [ ] Schema/migration files
- [ ] Transaction handling
- [ ] Startup database connectivity check
- [ ] Custom JSON parse error handling

## Lokasi

- [x] GET all
- [x] GET by ID
- [x] POST
- [x] PUT
- [x] DELETE

## Master Anggota

- [x] GET all
- [x] GET by ID
- [x] POST
- [x] PUT
- [x] DELETE

## Master Barang

- [x] GET all
- [x] GET by ID
- [x] POST
- [x] PUT
- [x] DELETE

## Barang Masuk

- [x] GET all
- [x] GET by ID
- [x] POST
- [x] PUT
- [x] DELETE
- [x] JavaScript calculation for `total_harga` and `sisa_bayar`
- [ ] Stock increase behavior
- [ ] Transaction usage

## Barang Keluar

- [x] GET all
- [x] GET by ID
- [x] POST
- [x] PUT
- [x] DELETE
- [x] JavaScript calculation for `total_harga_jual`, `harga_modal`, `margin`, and `sisa_bayar`
- [x] Optional `id_master_anggota` normalization to `null`
- [ ] Stock decrease behavior
- [ ] Insufficient stock prevention
- [ ] Transaction usage

## Example

- [x] GET example/test query

# Registered Routes

Only routes registered by `app.js` are listed.

| Method | Full URL | Route file | Controller function | Validator | Service function | Request data | Visible status codes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/` | `app.js` | inline handler | none | none | none | `200` | Wired |
| GET | `/api/examples` | `routes/exampleRoutes.js` | `getExamples` | none | none; direct `db.query` | none | `200`, `500` | Wired |
| GET | `/api/lokasi` | `routes/lokasiRoutes.js` | `getAllLokasi` | none | `getAllLokasi` | none | `200`, `500` | Wired |
| GET | `/api/lokasi/:id` | `routes/lokasiRoutes.js` | `getLokasiById` | none | `getLokasiById` | `req.params.id` | `200`, `404`, `500` | Wired |
| POST | `/api/lokasi` | `routes/lokasiRoutes.js` | `createLokasi` | `validateLokasiPayload` | `createLokasi` | body: `nama_lokasi` | `201`, `400`, `500` | Wired |
| PUT | `/api/lokasi/:id` | `routes/lokasiRoutes.js` | `updateLokasi` | `validateLokasiPayload` | `updateLokasi` | `req.params.id`; body: `nama_lokasi` | `200`, `400`, `404`, `500` | Wired |
| DELETE | `/api/lokasi/:id` | `routes/lokasiRoutes.js` | `deleteLokasi` | none | `deleteLokasi` | `req.params.id` | `200`, `404`, `500` | Wired |
| GET | `/api/master-anggota` | `routes/masterAnggotaRoutes.js` | `getAllMasterAnggota` | none | `getAllMasterAnggota` | none | `200`, `500` | Wired |
| GET | `/api/master-anggota/:id` | `routes/masterAnggotaRoutes.js` | `getMasterAnggotaById` | none | `getMasterAnggotaById` | `req.params.id` | `200`, `404`, `500` | Wired |
| POST | `/api/master-anggota` | `routes/masterAnggotaRoutes.js` | `createMasterAnggota` | `validateMasterAnggotaPayload` | `createMasterAnggota` | body: `nomor_anggota`, `nama_anggota`, optional `keterangan` | `201`, `400`, `500` | Wired |
| PUT | `/api/master-anggota/:id` | `routes/masterAnggotaRoutes.js` | `updateMasterAnggota` | `validateMasterAnggotaPayload` | `updateMasterAnggota` | `req.params.id`; body: `nomor_anggota`, `nama_anggota`, optional `keterangan` | `200`, `400`, `404`, `500` | Wired |
| DELETE | `/api/master-anggota/:id` | `routes/masterAnggotaRoutes.js` | `deleteMasterAnggota` | none | `deleteMasterAnggota` | `req.params.id` | `200`, `404`, `500` | Wired |
| GET | `/api/master-barang` | `routes/masterBarangRoutes.js` | `getAllMasterBarang` | none | `getAllMasterBarang` | none | `200`, `500` | Wired |
| GET | `/api/master-barang/:id` | `routes/masterBarangRoutes.js` | `getMasterBarangById` | none | `getMasterBarangById` | `req.params.id` | `200`, `404`, `500` | Wired |
| POST | `/api/master-barang` | `routes/masterBarangRoutes.js` | `createMasterBarang` | `validateMasterBarangPayload` | `createMasterBarang` | body: `kode_barang`, `nama_barang`, `satuan`, `id_lokasi`, `harga_satuan` | `201`, `400`, `500` | Wired |
| PUT | `/api/master-barang/:id` | `routes/masterBarangRoutes.js` | `updateMasterBarang` | `validateMasterBarangPayload` | `updateMasterBarang` | `req.params.id`; same body as POST | `200`, `400`, `404`, `500` | Wired |
| DELETE | `/api/master-barang/:id` | `routes/masterBarangRoutes.js` | `deleteMasterBarang` | none | `deleteMasterBarang` | `req.params.id` | `200`, `404`, `500` | Wired |
| GET | `/api/barang-masuk` | `routes/barangMasukRoutes.js` | `getAllBarangMasuk` | none | `getAllBarangMasuk` | none | `200`, `500` | Wired |
| GET | `/api/barang-masuk/:id` | `routes/barangMasukRoutes.js` | `getBarangMasukById` | none | `getBarangMasukById` | `req.params.id` | `200`, `404`, `500` | Wired |
| POST | `/api/barang-masuk` | `routes/barangMasukRoutes.js` | `createBarangMasuk` | `validateBarangMasukPayload` | `createBarangMasuk` | body: `tanggal`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_satuan`, `jumlah_bayar`, `status` | `201`, `400`, `500` | Wired |
| PUT | `/api/barang-masuk/:id` | `routes/barangMasukRoutes.js` | `updateBarangMasuk` | `validateBarangMasukPayload` | `updateBarangMasuk` | `req.params.id`; same body as POST | `200`, `400`, `404`, `500` | Wired |
| DELETE | `/api/barang-masuk/:id` | `routes/barangMasukRoutes.js` | `deleteBarangMasuk` | none | `deleteBarangMasuk` | `req.params.id` | `200`, `404`, `500` | Wired |
| GET | `/api/barang-keluar` | `routes/barangKeluarRoutes.js` | `getAllBarangKeluar` | none | `getAllBarangKeluar` | none | `200`, `500` | Wired |
| GET | `/api/barang-keluar/:id` | `routes/barangKeluarRoutes.js` | `getBarangKeluarById` | none | `getBarangKeluarById` | `req.params.id` | `200`, `404`, `500` | Wired |
| POST | `/api/barang-keluar` | `routes/barangKeluarRoutes.js` | `createBarangKeluar` | `validateBarangKeluarPayload` | `createBarangKeluar` | body: `tanggal`, optional `id_master_anggota`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_jual`, `jumlah_bayar`, `status` | `201`, `400`, `404`, `500` | Wired |
| PUT | `/api/barang-keluar/:id` | `routes/barangKeluarRoutes.js` | `updateBarangKeluar` | `validateBarangKeluarPayload` | `updateBarangKeluar` | `req.params.id`; same body as POST | `200`, `400`, `404`, `500` | Wired |
| DELETE | `/api/barang-keluar/:id` | `routes/barangKeluarRoutes.js` | `deleteBarangKeluar` | none | `deleteBarangKeluar` | `req.params.id` | `200`, `404`, `500` | Wired |

# Controllers

## `controllers/exampleController.js`

Exports:

- `getExamples`

Behavior:

- Reads no request params/body/query.
- Runs direct SQL through `db.query('SELECT 1 AS id, ? AS name', ['Contoh data'])`.
- Success response uses inline `res.json(...)`, not `utils/response.js`.
- Success shape: `{ message, data }`; no `success` field.
- Failure response status `500` includes `{ message, error: error.message }`, exposing the original error message.

## `controllers/lokasiController.js`

Exports:

- `getAllLokasi`
- `getLokasiById`
- `createLokasi`
- `updateLokasi`
- `deleteLokasi`

Request data:

- `getLokasiById`, `updateLokasi`, `deleteLokasi`: `req.params.id`.
- `createLokasi`, `updateLokasi`: `req.body`.

Validation:

- `createLokasi` and `updateLokasi` call `validateLokasiPayload(req.body)`.

Service calls:

- `lokasiService.getAllLokasi`
- `lokasiService.getLokasiById`
- `lokasiService.createLokasi`
- `lokasiService.updateLokasi`
- `lokasiService.deleteLokasi`

Responses:

- Success `200` for read/update/delete, `201` for create.
- Validation failure `400`.
- Not found `404` for get-by-id/update/delete when service returns null/false.
- Generic failures become `500` through `response.error(...)`.

## `controllers/masterAnggotaController.js`

Exports:

- `getAllMasterAnggota`
- `getMasterAnggotaById`
- `createMasterAnggota`
- `updateMasterAnggota`
- `deleteMasterAnggota`

Request data:

- ID handlers read `req.params.id`.
- Create/update read `req.body`.

Validation:

- Create/update call `validateMasterAnggotaPayload(req.body)`.

Service calls:

- `masterAnggotaService.getAllMasterAnggota`
- `masterAnggotaService.getMasterAnggotaById`
- `masterAnggotaService.createMasterAnggota`
- `masterAnggotaService.updateMasterAnggota`
- `masterAnggotaService.deleteMasterAnggota`

Responses:

- Success `200` for read/update/delete, `201` for create.
- Validation failure `400`.
- Not found `404` for get-by-id/update/delete.
- Generic failures become `500`.

## `controllers/masterBarangController.js`

Exports:

- `getAllMasterBarang`
- `getMasterBarangById`
- `createMasterBarang`
- `updateMasterBarang`
- `deleteMasterBarang`

Request data:

- ID handlers read `req.params.id`.
- Create/update read `req.body`.

Validation:

- Create/update call `validateMasterBarangPayload(req.body)`.

Service calls:

- `masterBarangService.getAllMasterBarang`
- `masterBarangService.getMasterBarangById`
- `masterBarangService.createMasterBarang`
- `masterBarangService.updateMasterBarang`
- `masterBarangService.deleteMasterBarang`

Responses:

- Success `200` for read/update/delete, `201` for create.
- Validation failure `400`.
- Not found `404` for get-by-id/update/delete.
- Generic failures become `500`.

## `controllers/barangMasukController.js`

Exports:

- `getAllBarangMasuk`
- `getBarangMasukById`
- `createBarangMasuk`
- `updateBarangMasuk`
- `deleteBarangMasuk`

Request data:

- ID handlers read `req.params.id`.
- Create/update read `req.body`.

Validation:

- Create/update call `validateBarangMasukPayload(req.body)`.

Service calls:

- `barangMasukService.getAllBarangMasuk`
- `barangMasukService.getBarangMasukById`
- `barangMasukService.createBarangMasuk`
- `barangMasukService.updateBarangMasuk`
- `barangMasukService.deleteBarangMasuk`

Responses:

- Success `200` for read/update/delete, `201` for create.
- Validation failure `400`.
- Not found `404` for get-by-id/update/delete.
- Generic failures become `500`.

## `controllers/barangKeluarController.js`

Exports:

- `getAllBarangKeluar`
- `getBarangKeluarById`
- `createBarangKeluar`
- `updateBarangKeluar`
- `deleteBarangKeluar`

Request data:

- ID handlers read `req.params.id`.
- Create/update read `req.body`.

Validation:

- Create/update call `validateBarangKeluarPayload(req.body)`.

Service calls:

- `barangKeluarService.getAllBarangKeluar`
- `barangKeluarService.getBarangKeluarById`
- `barangKeluarService.createBarangKeluar`
- `barangKeluarService.updateBarangKeluar`
- `barangKeluarService.deleteBarangKeluar`

Responses:

- Success `200` for read/update/delete, `201` for create.
- Validation failure `400`.
- Not found `404` for get-by-id/update/delete when service returns null.
- Generic failures become `500`.

Suspicious/inconsistent message:

- `createBarangKeluar` returns `404` with message `Data master barang tidak ditemukan` when service returns `null`. In `updateBarangKeluar`, the same `null` return can mean either the outgoing transaction does not exist or the referenced master barang does not exist, but the controller always responds `Data barang keluar tidak ditemukan`.

# Services

## `services/lokasiService.js`

Exports:

- `getAllLokasi`
- `getLokasiById`
- `createLokasi`
- `updateLokasi`
- `deleteLokasi`

SQL and behavior:

- Base select reads `id`, `nama_lokasi`, `created_at`, `updated_at` from `lokasi`.
- `getAllLokasi`: selects all rows ordered by `nama_lokasi ASC`.
- `getLokasiById(id)`: selects one row by `id` with `LIMIT 1`; returns first row or `null`.
- `createLokasi(payload)`: inserts `nama_lokasi`, then returns the inserted row via `getLokasiById(result.insertId)`.
- `updateLokasi(id, payload)`: checks existence with `getLokasiById`; if missing returns `null`; updates `nama_lokasi` and `updated_at = CURRENT_TIMESTAMP`; returns refreshed row.
- `deleteLokasi(id)`: hard deletes by `id`; returns `result.affectedRows > 0`.

No joins, filters beyond ID, transactions, stock mutations, or rollback behavior.

## `services/masterAnggotaService.js`

Exports:

- `getAllMasterAnggota`
- `getMasterAnggotaById`
- `createMasterAnggota`
- `updateMasterAnggota`
- `deleteMasterAnggota`

SQL and behavior:

- Base select reads `id`, `nomor_anggota`, `nama_anggota`, `keterangan`, `created_at`, `updated_at` from `master_anggota`.
- `getAllMasterAnggota`: selects all rows ordered by `nama_anggota ASC`.
- `getMasterAnggotaById(id)`: selects one row by `id`; returns row or `null`.
- `createMasterAnggota(payload)`: inserts `nomor_anggota`, `nama_anggota`, and `keterangan`; defaults `keterangan` to `null` in JavaScript.
- `updateMasterAnggota(id, payload)`: checks existence; updates `nomor_anggota`, `nama_anggota`, `keterangan`, and `updated_at`.
- `deleteMasterAnggota(id)`: hard deletes by `id`; returns affected-row boolean.

No joins, transactions, or uniqueness checks in JavaScript.

## `services/masterBarangService.js`

Exports:

- `getAllMasterBarang`
- `getMasterBarangById`
- `createMasterBarang`
- `updateMasterBarang`
- `deleteMasterBarang`

SQL and behavior:

- Base select reads fields from `master_barang` alias `mb` and joins `lokasi` alias `l`.
- Selected direct fields: `mb.id`, `mb.kode_barang`, `mb.nama_barang`, `mb.satuan`, `mb.id_lokasi`, `mb.harga_satuan`, `mb.created_at`, `mb.updated_at`.
- Joined display field: `l.nama_lokasi`.
- Join: `LEFT JOIN lokasi l ON l.id = mb.id_lokasi`.
- `getAllMasterBarang`: selects all rows ordered by `mb.nama_barang ASC`.
- `getMasterBarangById(id)`: selects one row where `mb.id = ?`; returns row or `null`.
- `createMasterBarang(payload)`: inserts `kode_barang`, `nama_barang`, `satuan`, `id_lokasi`, `harga_satuan`; returns inserted row.
- `updateMasterBarang(id, payload)`: checks existence; updates all inserted fields plus `updated_at = CURRENT_TIMESTAMP`; returns refreshed row.
- `deleteMasterBarang(id)`: hard deletes by `id`; returns affected-row boolean.

No JavaScript validation for whether `id_lokasi` exists. If a foreign key exists, that validation is delegated to MySQL.

## `services/barangMasukService.js`

Exports:

- `getAllBarangMasuk`
- `getBarangMasukById`
- `createBarangMasuk`
- `updateBarangMasuk`
- `deleteBarangMasuk`

SQL and behavior:

- Base select reads `barang_masuk` alias `bm`, with left joins to `master_barang` and `lokasi`.
- Direct transaction fields selected: `bm.id`, `bm.tanggal`, `bm.id_master_barang`, `bm.id_lokasi`, `bm.jumlah`, `bm.harga_satuan`, `bm.total_harga`, `bm.jumlah_bayar`, `bm.sisa_bayar`, `bm.status`, `bm.created_at`, `bm.updated_at`.
- Joined fields: `mb.kode_barang`, `mb.nama_barang`, `mb.satuan`, `l.nama_lokasi`.
- Joins:
  - `LEFT JOIN master_barang mb ON mb.id = bm.id_master_barang`
  - `LEFT JOIN lokasi l ON l.id = bm.id_lokasi`
- `calculatePayment(payload)`: converts `jumlah`, `harga_satuan`, and `jumlah_bayar` with `Number(...)`; calculates `totalHarga = jumlah * hargaSatuan`; calculates `sisaBayar = jumlahBayar - totalHarga`.
- `getAllBarangMasuk`: selects all rows ordered by `bm.tanggal DESC, bm.id DESC`.
- `getBarangMasukById(id)`: selects one row where `bm.id = ?`; returns row or `null`.
- `createBarangMasuk(payload)`: calculates totals, inserts `tanggal`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_satuan`, `total_harga`, `jumlah_bayar`, `sisa_bayar`, `status`; returns inserted row.
- `updateBarangMasuk(id, payload)`: checks existence; recalculates totals; updates all inserted fields plus `updated_at = CURRENT_TIMESTAMP`; returns refreshed row.
- `deleteBarangMasuk(id)`: hard deletes by `id`; returns affected-row boolean.

No transaction handling, stock increase, rollback behavior, or existence checks for referenced master/location in JavaScript. Because the select joins are `LEFT JOIN`, a row whose referenced `master_barang` or `lokasi` is missing can still be returned with joined display fields as `null`.

## `services/barangKeluarService.js`

Exports:

- `getAllBarangKeluar`
- `getBarangKeluarById`
- `createBarangKeluar`
- `updateBarangKeluar`
- `deleteBarangKeluar`

SQL and behavior:

- Base select reads `barang_keluar` alias `bk`, left joins `master_anggota`, and inner joins `master_barang` and `lokasi`.
- Direct transaction fields selected: `bk.id`, `bk.tanggal`, `bk.id_master_anggota`, `bk.id_master_barang`, `bk.id_lokasi`, `bk.jumlah`, `bk.harga_jual`, `bk.total_harga_jual`, `bk.jumlah_bayar`, `bk.sisa_bayar`, `bk.harga_modal`, `bk.margin`, `bk.status`, `bk.created_at`, `bk.updated_at`.
- Joined fields: `ma.nomor_anggota`, `ma.nama_anggota`, `ma.keterangan`, `mb.kode_barang`, `mb.nama_barang`, `mb.satuan`, `l.nama_lokasi`.
- Joins:
  - `LEFT JOIN master_anggota ma ON ma.id = bk.id_master_anggota`
  - `JOIN master_barang mb ON mb.id = bk.id_master_barang`
  - `JOIN lokasi l ON l.id = bk.id_lokasi`
- `normalizeMasterAnggotaId(idMasterAnggota)`: returns `null` when the value is `undefined`, `null`, or empty string; otherwise returns the original value.
- `getHargaModal(idMasterBarang)`: reads `harga_satuan` from `master_barang` by ID; returns numeric price or `null`.
- `calculateTransaction(payload)`: gets modal price from `master_barang`; if missing returns `null`; calculates `totalHargaJual = jumlah * hargaJual`; `margin = totalHargaJual - jumlah * hargaModal`; `sisaBayar = jumlahBayar - totalHargaJual`.
- `getAllBarangKeluar`: selects all rows ordered by `bk.tanggal DESC, bk.id DESC`.
- `getBarangKeluarById(id)`: selects one row by `bk.id`; returns row or `null`.
- `createBarangKeluar(payload)`: calculates totals/modal/margin; if master barang is not found returns `null`; normalizes member ID; inserts transaction fields; returns inserted row.
- `updateBarangKeluar(id, payload)`: checks transaction existence; recalculates; if referenced master barang is missing returns `null`; updates all inserted fields plus `updated_at = CURRENT_TIMESTAMP`; returns refreshed row.
- `deleteBarangKeluar(id)`: hard deletes by `id`; returns affected-row boolean.

No transaction handling, stock decrease, insufficient stock prevention, rollback behavior, or explicit existence check for `id_lokasi`/`id_master_anggota` in JavaScript. Because the select joins to `master_barang` and `lokasi` are inner `JOIN`s, an existing `barang_keluar` row with missing referenced goods/location would not be returned by the current detail/list queries.

# Validators

All validators are manual JavaScript checks. They treat a field as empty when it is `undefined`, `null`, or `''`. They do not validate numeric type, date format, uniqueness, string length, trimming, foreign-key existence, or SQL schema constraints.

Important validator limitations:

- Numeric value `0` is accepted because `isEmpty(0)` is false. There is no code preventing zero or negative quantities/prices/payments.
- Whitespace-only strings such as `'   '` are accepted because validators do not trim.
- Extra unknown body fields are ignored by service destructuring and are not rejected.

## `validators/lokasiValidator.js`

- Required fields: `nama_lokasi`.
- Returned missing message: `Field wajib diisi: nama_lokasi`.
- No type/length/uniqueness validation.

## `validators/masterAnggotaValidator.js`

- Required fields: `nomor_anggota`, `nama_anggota`.
- Optional field by service behavior: `keterangan`, defaulted to `null`.
- Returned missing message example: `Field wajib diisi: nomor_anggota, nama_anggota`.
- No type/length/uniqueness validation.

## `validators/masterBarangValidator.js`

- Required fields: `kode_barang`, `nama_barang`, `satuan`, `id_lokasi`, `harga_satuan`.
- No numeric validation for `id_lokasi` or `harga_satuan`.
- No JavaScript validation that `id_lokasi` exists.
- No uniqueness validation for `kode_barang`.

## `validators/barangMasukValidator.js`

- Required fields: `tanggal`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_satuan`, `jumlah_bayar`, `status`.
- Accepted status values: `LUNAS`, `PIUTANG`, `LOAN`.
- Returned invalid-status message: `Status hanya boleh: LUNAS, PIUTANG, LOAN`.
- No date validation.
- No numeric constraints for quantities/prices/payments.
- No validation that referenced goods/location exist.

## `validators/barangKeluarValidator.js`

- Required fields: `tanggal`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_jual`, `jumlah_bayar`, `status`.
- Optional field by service behavior: `id_master_anggota`.
- Accepted status values: `C`, `LUNAS`, `PIUTANG`, `LOAN`.
- Returned invalid-status message: `Status hanya boleh: C, LUNAS, PIUTANG, LOAN`.
- No date validation.
- No numeric constraints for quantities/prices/payments.
- No stock validation.
- No JavaScript validation that `id_lokasi`, `id_master_barang`, or `id_master_anggota` exists, except that `id_master_barang` is checked indirectly by fetching `harga_satuan`.

Validation delegated to MySQL:

- Any foreign-key, uniqueness, not-null, numeric, date, or enum constraints not implemented in JavaScript are only enforced if the actual MySQL schema defines them. No schema file exists here to confirm.

# Response Format

Shared helper in `utils/response.js`:

Success:

```json
{
  "success": true,
  "message": "Data lokasi berhasil diambil",
  "data": []
}
```

Error:

```json
{
  "success": false,
  "message": "Gagal mengambil data lokasi"
}
```

Validation failure uses `response.error(res, validationMessage, 400)`:

```json
{
  "success": false,
  "message": "Field wajib diisi: nama_lokasi"
}
```

Not found:

```json
{
  "success": false,
  "message": "Data lokasi tidak ditemukan"
}
```

Created resource:

```json
{
  "success": true,
  "message": "Data lokasi berhasil dibuat",
  "data": {
    "id": 1,
    "nama_lokasi": "Gudang"
  }
}
```

Updated resource:

```json
{
  "success": true,
  "message": "Data lokasi berhasil diperbarui",
  "data": {
    "id": 1,
    "nama_lokasi": "Gudang"
  }
}
```

Deleted resource:

```json
{
  "success": true,
  "message": "Data lokasi berhasil dihapus",
  "data": null
}
```

Inline responses that do not use the helper:

- `GET /` returns `{ "message": "API Inventory Pupuk berjalan" }`.
- `GET /api/examples` success returns `{ "message": "...", "data": [...] }`.
- `GET /api/examples` failure returns `{ "message": "...", "error": "..." }`.
- 404 fallback returns `{ "success": false, "message": "Endpoint tidak ditemukan" }`.

# Database Connection

Database driver:

- `mysql2/promise`.

Connection strategy:

- A connection pool is created in `config/db.js`.
- Pool options:
  - `host: process.env.DB_HOST`
  - `user: process.env.DB_USER`
  - `password: process.env.DB_PASSWORD`
  - `database: process.env.DB_NAME`
  - `port: Number(process.env.DB_PORT) || 3306`
  - `waitForConnections: true`
  - `connectionLimit: 10`
  - `queueLimit: 0`

Promise usage:

- Service files use `await db.query(...)`.
- Query results are destructured as `[rows]` or `[result]`.

Startup behavior:

- Creating the pool does not confirm that credentials are valid or that the database/schema exists.
- No route named `/health` or database health endpoint exists.

Transaction support:

- The MySQL pool can support transactions through `getConnection()`, but this repository does not call `getConnection`, `beginTransaction`, `commit`, `rollback`, or `release` anywhere in application source.

Database-related environment variables referenced:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`

Other environment variables referenced:

- `PORT`

# Database Tables Inferred From SQL

No schema dump, migration, or model definition exists. The following is confirmed only from SQL usage.

## `lokasi`

Confirmed from SQL:

- Selected columns: `id`, `nama_lokasi`, `created_at`, `updated_at`.
- Inserted columns: `nama_lokasi`.
- Updated columns: `nama_lokasi`, `updated_at`.
- WHERE columns: `id`.
- Ordering: `nama_lokasi ASC`.

Inferred purpose:

- Location master table.

Unknown:

- Primary key definition, constraints, indexes, foreign-key references.

## `master_anggota`

Confirmed from SQL:

- Selected columns: `id`, `nomor_anggota`, `nama_anggota`, `keterangan`, `created_at`, `updated_at`.
- Inserted columns: `nomor_anggota`, `nama_anggota`, `keterangan`.
- Updated columns: `nomor_anggota`, `nama_anggota`, `keterangan`, `updated_at`.
- WHERE columns: `id`.
- Ordering: `nama_anggota ASC`.

Inferred purpose:

- Member master table.

Unknown:

- Whether `nomor_anggota` is unique.
- Nullability and foreign-key usage beyond joins from `barang_keluar`.

## `master_barang`

Confirmed from SQL:

- Selected columns: `id`, `kode_barang`, `nama_barang`, `satuan`, `id_lokasi`, `harga_satuan`, `created_at`, `updated_at`.
- Inserted columns: `kode_barang`, `nama_barang`, `satuan`, `id_lokasi`, `harga_satuan`.
- Updated columns: `kode_barang`, `nama_barang`, `satuan`, `id_lokasi`, `harga_satuan`, `updated_at`.
- WHERE columns: `id`.
- Ordering: `nama_barang ASC`.

Inferred from JOIN:

- `master_barang.id_lokasi` relates to `lokasi.id`.
- `barang_masuk.id_master_barang` relates to `master_barang.id`.
- `barang_keluar.id_master_barang` relates to `master_barang.id`.

Inferred purpose:

- Goods master table with location and unit price.

Unknown:

- Whether stock is stored on this table. No SQL references a stock/stok column.

## `barang_masuk`

Confirmed from SQL:

- Selected columns: `id`, `tanggal`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_satuan`, `total_harga`, `jumlah_bayar`, `sisa_bayar`, `status`, `created_at`, `updated_at`.
- Inserted columns: `tanggal`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_satuan`, `total_harga`, `jumlah_bayar`, `sisa_bayar`, `status`.
- Updated columns: same as inserted plus `updated_at`.
- WHERE columns: `id`.
- Ordering: `tanggal DESC`, `id DESC`.

Inferred from JOIN:

- `id_master_barang` relates to `master_barang.id`.
- `id_lokasi` relates to `lokasi.id`.

Inferred purpose:

- Incoming goods transaction table.

Unknown:

- Status column constraints.
- Any stock effect is unknown from this repository; no stock SQL exists.

## `barang_keluar`

Confirmed from SQL:

- Selected columns: `id`, `tanggal`, `id_master_anggota`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_jual`, `total_harga_jual`, `jumlah_bayar`, `sisa_bayar`, `harga_modal`, `margin`, `status`, `created_at`, `updated_at`.
- Inserted columns: `tanggal`, `id_master_anggota`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_jual`, `total_harga_jual`, `jumlah_bayar`, `sisa_bayar`, `harga_modal`, `margin`, `status`.
- Updated columns: same as inserted plus `updated_at`.
- WHERE columns: `id`.
- Ordering: `tanggal DESC`, `id DESC`.

Inferred from JOIN:

- `id_master_anggota` relates to `master_anggota.id`; joined with `LEFT JOIN`, so member is optional in returned rows.
- `id_master_barang` relates to `master_barang.id`.
- `id_lokasi` relates to `lokasi.id`.

Inferred purpose:

- Outgoing goods/sales transaction table.

Unknown:

- Status column constraints.
- Any stock effect is unknown from this repository; no stock SQL exists.

# Feature Details

## Lokasi

- Route file: `routes/lokasiRoutes.js`.
- Controller file: `controllers/lokasiController.js`.
- Service file: `services/lokasiService.js`.
- Validator file: `validators/lokasiValidator.js`.
- Supported operations: list, detail, create, update, delete.
- Data returned: `id`, `nama_lokasi`, `created_at`, `updated_at`.
- Ordering: list by `nama_lokasi ASC`.
- Missing operations: pagination, search, uniqueness check, soft delete.

## Master Anggota

- Route file: `routes/masterAnggotaRoutes.js`.
- Controller file: `controllers/masterAnggotaController.js`.
- Service file: `services/masterAnggotaService.js`.
- Validator file: `validators/masterAnggotaValidator.js`.
- Supported operations: list, detail, create, update, delete.
- Data returned: `id`, `nomor_anggota`, `nama_anggota`, `keterangan`, `created_at`, `updated_at`.
- Ordering: list by `nama_anggota ASC`.
- Missing operations: pagination, search, uniqueness check for `nomor_anggota`, soft delete.

## Master Barang

- Route file: `routes/masterBarangRoutes.js`.
- Controller file: `controllers/masterBarangController.js`.
- Service file: `services/masterBarangService.js`.
- Validator file: `validators/masterBarangValidator.js`.
- Supported operations: list, detail, create, update, delete.
- Data returned: direct `master_barang` fields plus joined `nama_lokasi`.
- Important join: `LEFT JOIN lokasi l ON l.id = mb.id_lokasi`.
- Missing operations: pagination, search, location filter, stock fields/behavior, uniqueness check for `kode_barang`.

## Barang Masuk

- Route file: `routes/barangMasukRoutes.js`.
- Controller file: `controllers/barangMasukController.js`.
- Service file: `services/barangMasukService.js`.
- Validator file: `validators/barangMasukValidator.js`.
- Supported operations: list, detail, create, update, delete.
- Data returned: direct `barang_masuk` fields plus `kode_barang`, `nama_barang`, `satuan`, `nama_lokasi`.
- Important joins: `LEFT JOIN master_barang`, `LEFT JOIN lokasi`.
- Calculations: `total_harga = jumlah * harga_satuan`; `sisa_bayar = jumlah_bayar - total_harga`.
- Business behavior: accepted statuses are `LUNAS`, `PIUTANG`, `LOAN`.
- Missing operations/behavior: stock increase, transaction handling, pagination, date/status/location filtering, numeric/date validation.
- Known inconsistency/risk: `sisa_bayar` is calculated as payment minus total; if the field means remaining debt, unpaid transactions will produce a negative number.

## Barang Keluar

- Route file: `routes/barangKeluarRoutes.js`.
- Controller file: `controllers/barangKeluarController.js`.
- Service file: `services/barangKeluarService.js`.
- Validator file: `validators/barangKeluarValidator.js`.
- Supported operations: list, detail, create, update, delete.
- Data returned: direct `barang_keluar` fields plus member, goods, and location display fields.
- Important joins: `LEFT JOIN master_anggota`, `JOIN master_barang`, `JOIN lokasi`.
- Calculations:
  - `harga_modal` is copied from `master_barang.harga_satuan`.
  - `total_harga_jual = jumlah * harga_jual`.
  - `margin = total_harga_jual - jumlah * harga_modal`.
  - `sisa_bayar = jumlah_bayar - total_harga_jual`.
- Business behavior: `id_master_anggota` may be omitted/empty and will be stored as `null`; accepted statuses are `C`, `LUNAS`, `PIUTANG`, `LOAN`.
- Missing operations/behavior: stock decrease, insufficient stock check, transaction handling, pagination, date/status/location/member filtering, numeric/date validation.
- Known inconsistency/risk: `createBarangKeluar` can identify missing master barang, but `updateBarangKeluar` collapses missing transaction and missing master barang into the same `null` result.

# Business Rules Found in Code

## Incoming Goods Total Calculation

- Implemented in: `services/barangMasukService.js`, `calculatePayment`.
- Triggered by: `createBarangMasuk` and `updateBarangMasuk`.
- Behavior: converts `jumlah`, `harga_satuan`, and `jumlah_bayar` to numbers; calculates `total_harga` as `jumlah * harga_satuan`.
- Limitations: no numeric validation; invalid numeric strings can produce `NaN`.

## Incoming Goods Payment Difference

- Implemented in: `services/barangMasukService.js`, `calculatePayment`.
- Triggered by: `createBarangMasuk` and `updateBarangMasuk`.
- Behavior: calculates `sisa_bayar` as `jumlah_bayar - total_harga`.
- Limitation: field name suggests remaining payment, but formula produces negative values when underpaid.

## Outgoing Goods Modal Price Copy

- Implemented in: `services/barangKeluarService.js`, `getHargaModal` and `calculateTransaction`.
- Triggered by: `createBarangKeluar` and `updateBarangKeluar`.
- Behavior: reads `master_barang.harga_satuan` and stores it as `harga_modal` on `barang_keluar`.
- Limitation: if `master_barang` is missing, service returns `null`; controller message varies by operation.

## Outgoing Goods Total, Margin, and Payment Difference

- Implemented in: `services/barangKeluarService.js`, `calculateTransaction`.
- Triggered by: `createBarangKeluar` and `updateBarangKeluar`.
- Behavior: calculates `total_harga_jual`, `margin`, and `sisa_bayar`.
- Formulas:
  - `total_harga_jual = jumlah * harga_jual`
  - `margin = total_harga_jual - jumlah * harga_modal`
  - `sisa_bayar = jumlah_bayar - total_harga_jual`
- Limitation: no numeric validation; possible `NaN`; `sisa_bayar` sign may be opposite of expected debt semantics.

## Optional Member for Barang Keluar

- Implemented in: `services/barangKeluarService.js`, `normalizeMasterAnggotaId`.
- Triggered by: `createBarangKeluar` and `updateBarangKeluar`.
- Behavior: stores `id_master_anggota` as `null` when request value is `undefined`, `null`, or empty string.
- Limitation: non-empty invalid IDs are passed to MySQL.

## Hard Delete

- Implemented in every service `delete...` function.
- Triggered by DELETE routes.
- Behavior: SQL `DELETE FROM ... WHERE id = ?`; returns `true` when `affectedRows > 0`.
- Limitation: no soft delete or dependency checks in JavaScript.

Rules not found in source:

- No stock increase.
- No stock decrease.
- No insufficient stock prevention.
- No database transactions.
- No automatic status derivation.
- No authentication/authorization.
- No pagination/search/filtering.

# SQL and Transaction Safety

Safe/currently positive:

- All application SQL uses parameter placeholders (`?`) for request-derived values.
- Reads by ID use `LIMIT 1`.
- Update functions for `lokasi`, `master_anggota`, `master_barang`, `barang_masuk`, and `barang_keluar` check existence before updating.
- Delete functions check `affectedRows`.

Needs improvement:

- No explicit transactions for multi-step operations such as calculate-then-insert or update-then-refetch.
- No `getConnection`, `beginTransaction`, `commit`, `rollback`, or `release` in source.
- No stock consistency logic exists.
- No row locking exists.
- Create operations generally do not check referenced row existence before insert, except `barang_keluar` checks `master_barang` by reading modal price.
- `barang_keluar` calculation reads `master_barang.harga_satuan` separately from the insert/update, so modal price can change between read and write.
- Updates perform an existence read before the update, but they do not check update `affectedRows`; if the row is deleted between the existence check and update, the controller can still return the later `get...ById(id)` result, which may be `null`, as a successful response.
- Create/update operations that calculate and then refetch are not atomic; concurrent changes to referenced rows can affect response consistency.
- Controllers catch errors but do not log them, except `exampleController` returns `error.message` to the client.

# Error Handling

Controller behavior:

- CRUD controllers use `try/catch`.
- On caught errors they return generic response-helper errors with default status `500`.
- Original errors are not logged in CRUD controllers.
- Database errors are hidden in CRUD controllers.
- Validation errors return status `400` with the validator message.
- Not-found cases return `404` when services return `null` or `false`.

Inconsistencies:

- `exampleController` exposes `error.message` in the response.
- CRUD controllers do not expose error details.
- Different database failures can become the same generic message, for example insert constraint failure and connection failure both become `Gagal membuat ...`.
- `barangKeluarService.updateBarangKeluar` can return `null` for either missing outgoing transaction or missing referenced master barang; the controller responds as if the outgoing transaction was missing.

Unhandled exceptions:

- No central Express error middleware exists.
- No process-level unhandled rejection/exception handling exists.
- Malformed JSON request bodies are handled by Express/default behavior, not by the repository's `utils/response.js` helper.

# Pagination, Search, and Filtering

No list endpoint reads `req.query`. All list endpoints return all rows.

| Endpoint | Pagination | Search | Location filter | Status filter | Date filter | Sorting |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /api/lokasi` | No | No | No | No | No | `nama_lokasi ASC` |
| `GET /api/master-anggota` | No | No | No | No | No | `nama_anggota ASC` |
| `GET /api/master-barang` | No | No | No | No | No | `mb.nama_barang ASC` |
| `GET /api/barang-masuk` | No | No | No | No | No | `bm.tanggal DESC, bm.id DESC` |
| `GET /api/barang-keluar` | No | No | No | No | No | `bk.tanggal DESC, bk.id DESC` |

# Data Shapes

Actual fields returned depend on MySQL driver values and schema types. These are the selected fields visible in SQL.

## Lokasi

Direct fields:

- `id`
- `nama_lokasi`
- `created_at`
- `updated_at`

## Master Anggota

Direct fields:

- `id`
- `nomor_anggota`
- `nama_anggota`
- `keterangan`
- `created_at`
- `updated_at`

## Master Barang

Direct fields:

- `id`
- `kode_barang`
- `nama_barang`
- `satuan`
- `id_lokasi`
- `harga_satuan`
- `created_at`
- `updated_at`

Joined display fields:

- `nama_lokasi`

## Barang Masuk

Direct fields:

- `id`
- `tanggal`
- `id_master_barang`
- `id_lokasi`
- `jumlah`
- `harga_satuan`
- `total_harga`
- `jumlah_bayar`
- `sisa_bayar`
- `status`
- `created_at`
- `updated_at`

Joined display fields:

- `kode_barang`
- `nama_barang`
- `satuan`
- `nama_lokasi`

Calculated/stored fields:

- `total_harga`
- `sisa_bayar`

## Barang Keluar

Direct fields:

- `id`
- `tanggal`
- `id_master_anggota`
- `id_master_barang`
- `id_lokasi`
- `jumlah`
- `harga_jual`
- `total_harga_jual`
- `jumlah_bayar`
- `sisa_bayar`
- `harga_modal`
- `margin`
- `status`
- `created_at`
- `updated_at`

Joined display fields:

- `nomor_anggota`
- `nama_anggota`
- `keterangan`
- `kode_barang`
- `nama_barang`
- `satuan`
- `nama_lokasi`

Calculated/stored fields:

- `total_harga_jual`
- `sisa_bayar`
- `harga_modal`
- `margin`

# Environment Configuration

Referenced in source:

- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`

`.env.example` variables:

- `PORT=5000`
- `DB_HOST=localhost`
- `DB_USER=root`
- `DB_PASSWORD=`
- `DB_NAME=inventory_pupuk`
- `DB_PORT=3306`

Default values in source:

- App port defaults to `5000`.
- DB port defaults to `3306` when `Number(process.env.DB_PORT)` is falsy.

Notes:

- `.env` exists in the repository working tree, but this document does not copy or reveal its values.
- `.env.example` and source variable names match.

# Known Problems and Inconsistencies

- `controllers/exampleController.js`: response shape is inconsistent with `utils/response.js`.
- `controllers/exampleController.js`: returns `error.message` to the client on failure.
- `controllers/barangKeluarController.js`, `createBarangKeluar`: service `null` is treated as missing master barang.
- `controllers/barangKeluarController.js`, `updateBarangKeluar`: service `null` is treated as missing barang keluar, even though missing master barang can also produce `null`.
- `services/barangMasukService.js`, `calculatePayment`: `sisa_bayar = jumlah_bayar - total_harga`; name may imply the opposite sign.
- `services/barangKeluarService.js`, `calculateTransaction`: `sisa_bayar = jumlah_bayar - total_harga_jual`; name may imply the opposite sign.
- `services/barangKeluarService.js`, `baseSelectQuery`: detail/list queries use inner joins for `master_barang` and `lokasi`, so orphaned `barang_keluar` rows would disappear from API responses.
- `services/barangMasukService.js`, `baseSelectQuery`: detail/list queries use left joins, so orphaned `barang_masuk` rows can still appear with `null` joined display fields.
- `validators/*`: required-field validation only; no numeric, date, length, uniqueness, or foreign-key validation.
- `validators/*`: whitespace-only strings are accepted.
- `validators/*`: zero and negative numbers are accepted because no numeric constraints exist.
- `validators/*`: unknown request body fields are not rejected.
- `validators/barangKeluarValidator.js`: status `C` is accepted only for outgoing goods; meaning is not documented in code.
- `services/*`: no transactions.
- `services/*`: no stock/stok column or mutation.
- `services/*`: hard deletes are used everywhere.
- `services/masterBarangService.js`: no JavaScript existence check for `id_lokasi`.
- `services/barangMasukService.js`: no JavaScript existence check for `id_master_barang` or `id_lokasi`.
- `services/barangKeluarService.js`: no explicit JavaScript existence check for `id_lokasi` or non-null `id_master_anggota`.
- `app.js`: no authentication/authorization middleware.
- `app.js`: no central error middleware.
- `app.js`: no database connection check during startup.
- `app.js`: no custom malformed JSON error response.
- `middleware/`: contains only `.gitkeep`; no active middleware.
- List services return all rows without pagination/search/filtering.
- No schema/migration files exist, so database constraints and relationships cannot be fully confirmed from this repository.
- No tests are present.

Unused, incomplete, or legacy-looking files:

- `routes/exampleRoutes.js` and `controllers/exampleController.js` are actively wired into `app.js`, but appear to be a test/example endpoint rather than a business feature.
- `middleware/.gitkeep` keeps an otherwise empty folder.

Routes that exist but are not registered:

- None found among route files.

Controllers/services that exist but are unused:

- None found among application source files. All controller/service files are reachable from registered routes, except services are used by their corresponding controllers and `exampleController` accesses DB directly.

# Recommended Next Steps

## Must Fix Before Frontend Integration

- Verify the actual MySQL schema and constraints because no schema file exists.
- Verify the API against a real database because app startup does not prove DB connectivity.
- Decide and document the correct sign/meaning of `sisa_bayar`.
- Add numeric validation for quantities, prices, and payment fields.
- Add date validation for `tanggal`.
- Clarify `barang_keluar` status value `C`.
- Decide whether `exampleRoutes` should remain exposed.
- Decide whether orphaned transaction rows should be possible and how the API should respond if joined master rows are missing.

## Required for Initial API Integration

- Confirm response contracts with the frontend, especially inconsistent example/root responses.
- Add pagination/search/filtering if frontend screens need it.
- Add clear not-found handling for referenced master data in create/update operations.
- Verify whether hard delete is acceptable for master and transaction data.
- Add or document frontend handling for generic `500` responses, because most database failures are intentionally collapsed into generic messages.
- Add a health/ready endpoint if the frontend or deployment needs to distinguish server-up from database-ready.

## Backend Improvements After Integration

- Add central error middleware and consistent logging.
- Add tests for validators, controllers, and service calculations.
- Add schema/migration files or a documented schema dump.
- Add explicit foreign-key existence checks where needed.
- Normalize response shapes across all endpoints.

## Future Features

- Authentication and authorization.
- Stock tracking, stock increase/decrease, and insufficient stock checks if required by the product.
- Database transactions around multi-step transaction writes.
- Audit trail or soft delete for transaction data.
- Filtering by location, status, date, member, and goods.

# Handoff Notes

Safe to continue using:

- Basic Express routing and CRUD flow are wired.
- MySQL promise pool is configured.
- Parameterized queries are used.
- CRUD response helper is consistent for the five main feature areas.

Must be verified first:

- Actual database schema and constraints.
- Meaning/sign of `sisa_bayar`.
- Whether transaction records should mutate stock.
- Whether hard deletes are acceptable.
- Whether status values match frontend/product expectations.

Best starting point for frontend integration:

- `Lokasi` is the smallest and safest feature: simple CRUD, one table, minimal validation, no joins or calculations.

Behaviors that should not be assumed yet:

- Authentication.
- Pagination/search/filtering.
- Stock availability or stock mutation.
- Transaction rollback.
- Uniqueness checks.
- Automatic payment/status derivation.
