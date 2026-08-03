# PROJECT_BACKEND_CONTEXT.md

Dokumen ini adalah konteks backend Express untuk project `inventory-backend`. Tujuannya adalah memberi gambaran lengkap kepada AI atau developer lain agar dapat memahami arsitektur, database, endpoint, aturan bisnis, validasi, dan status development tanpa harus membaca semua source code satu per satu.

Dokumen ini dibuat berdasarkan pembacaan langsung terhadap file backend saat ini dan skema database lokal yang terhubung melalui konfigurasi `.env`. Nilai rahasia seperti password database dan `JWT_SECRET` tidak ditulis di sini.

# 1. Project Overview

## Nama Project

Nama package Node.js adalah `inventory-backend`.

Deskripsi package pada `package.json` adalah `Backend API Inventory Pupuk`. Dari nama module, route, tabel, dan response message, backend ini adalah API inventory pupuk untuk mengelola master data barang, anggota, lokasi, user, role, transaksi barang masuk, transaksi barang keluar, stok barang, dan dashboard statistik.

## Tujuan

Tujuan backend adalah menyediakan REST API untuk aplikasi inventory pupuk. Backend menangani:

- Autentikasi user memakai JWT.
- Role user `SUPER ADMIN` dan `ADMIN`.
- Pembatasan akses data berbasis lokasi untuk user `ADMIN`.
- CRUD master lokasi.
- CRUD master barang.
- CRUD master anggota.
- CRUD user oleh `SUPER ADMIN`.
- Dropdown role dan lokasi.
- Pencatatan barang masuk.
- Pencatatan barang keluar.
- Validasi stok sebelum barang keluar.
- Perhitungan total harga, sisa bayar, harga modal, margin, revenue, piutang, dan nilai aset.
- Pembacaan stok dari view SQL `v_stok_barang`.
- Statistik dashboard berdasarkan periode dan lokasi.

Backend belum dirancang sebagai sistem multi-service. Semua modul berjalan di satu aplikasi Express CommonJS dengan koneksi database MySQL melalui pool `mysql2/promise`.

## Stack

Stack runtime:

- Node.js.
- Express.
- CommonJS module system.
- MySQL atau MariaDB compatible database.
- `mysql2/promise` untuk koneksi dan query database.
- JWT untuk token autentikasi.
- `bcryptjs` untuk hashing password.
- `dotenv` untuk environment variable.
- `cors` untuk CORS global.
- `nodemon` untuk development server.

## Node Version

Versi Node yang terbaca pada environment saat dokumentasi ini dibuat:

```text
v24.14.0
```

Versi ini adalah versi runtime lokal, bukan engine requirement dari `package.json`. File `package.json` belum mendefinisikan field `engines`, sehingga secara formal backend belum mengunci minimal versi Node. Karena Express 5 dan dependency modern dipakai, gunakan Node LTS modern atau versi yang sudah diuji oleh tim.

## Express Version

Express version dari `package.json`:

```text
express: ^5.2.1
```

Ini berarti backend memakai Express 5, bukan Express 4. Perbedaan perilaku error handling dan routing Express 5 perlu diperhatikan saat menambah middleware baru.

## Database

Database memakai MySQL dengan driver `mysql2/promise`.

Nama database default dari `.env.example`:

```text
inventory_pupuk
```

Koneksi database dibuat di `config/db.js` memakai pool:

- `host`: `process.env.DB_HOST`
- `user`: `process.env.DB_USER`
- `password`: `process.env.DB_PASSWORD`
- `database`: `process.env.DB_NAME`
- `port`: `Number(process.env.DB_PORT) || 3306`
- `waitForConnections`: `true`
- `connectionLimit`: `10`
- `queueLimit`: `0`

## ORM atau Query Builder

Backend tidak memakai ORM dan tidak memakai query builder seperti Sequelize, Prisma, TypeORM, Knex, atau Objection.

Semua query ditulis sebagai raw SQL string dan dijalankan memakai:

```js
db.query(sql, params)
```

Untuk script `createSuperAdmin.js`, ada penggunaan:

```js
connection = await db.getConnection()
connection.execute(sql, params)
connection.release()
```

Namun service aplikasi runtime tetap memakai `db.query` langsung dari pool. Tidak ada folder `repositories`; fungsi repository secara praktis masih menyatu di file `services/*Service.js`.

## Environment

Environment variable yang terdokumentasi di `.env.example`:

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

Tambahan environment yang dipakai oleh `dashboardService.js`:

```text
APP_TIMEZONE
TZ
```

Jika `APP_TIMEZONE` dan `TZ` kosong, dashboard memakai default `Asia/Jakarta`.

Catatan penting:

- `JWT_SECRET` wajib diisi agar login dan protected endpoint berfungsi.
- `JWT_EXPIRES_IN` default adalah `8h` jika kosong.
- `BCRYPT_SALT_ROUNDS` default runtime di controller adalah `10`; script super admin juga memakai default `10`.
- `APP_TIMEZONE` tidak muncul di `.env.example`, tetapi sudah dipakai di dashboard.

## Dependency

Dependency production:

| Package | Version | Fungsi |
| --- | --- | --- |
| `bcryptjs` | `^3.0.3` | Hash password user dan membandingkan password saat login. |
| `cors` | `^2.8.6` | Mengaktifkan CORS global dengan default config. |
| `dotenv` | `^17.4.2` | Load file `.env`. |
| `express` | `^5.2.1` | HTTP server dan routing REST API. |
| `jsonwebtoken` | `^9.0.3` | Sign dan verify JWT. |
| `mysql2` | `^3.22.5` | Koneksi MySQL promise pool dan query SQL. |

Dev dependency:

| Package | Version | Fungsi |
| --- | --- | --- |
| `nodemon` | `^3.1.14` | Restart server otomatis saat development. |

Script package:

| Script | Command | Fungsi |
| --- | --- | --- |
| `npm run dev` | `nodemon app.js` | Menjalankan server development. |
| `npm start` | `node app.js` | Menjalankan server production/basic. |
| `npm run create-super-admin` | `node scripts/createSuperAdmin.js` | Membuat user Super Admin awal. |

# 2. Folder Structure

Struktur folder backend saat ini, mengabaikan detail internal `.git` dan `node_modules`:

```text
inventory-backend/
|-- .agents/
|-- .env
|-- .env.example
|-- app.js
|-- BACKEND_CONTEXT.md
|-- BACKEND_PROJECT_CONTEXT.md
|-- BACKEND_TREE.md
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
|   |-- dashboardController.js
|   |-- exampleController.js
|   |-- lokasiController.js
|   |-- masterAnggotaController.js
|   |-- masterBarangController.js
|   |-- stokBarangController.js
|   `-- userController.js
|-- middleware/
|   |-- .gitkeep
|   `-- authMiddleware.js
|-- routes/
|   |-- authRoutes.js
|   |-- barangKeluarRoutes.js
|   |-- barangMasukRoutes.js
|   |-- dashboardRoutes.js
|   |-- exampleRoutes.js
|   |-- lokasiRoutes.js
|   |-- masterAnggotaRoutes.js
|   |-- masterBarangRoutes.js
|   |-- roleRoutes.js
|   |-- stokBarangRoutes.js
|   `-- userRoutes.js
|-- scripts/
|   `-- createSuperAdmin.js
|-- services/
|   |-- authService.js
|   |-- barangKeluarService.js
|   |-- barangMasukService.js
|   |-- dashboardService.js
|   |-- lokasiService.js
|   |-- masterAnggotaService.js
|   |-- masterBarangService.js
|   |-- stokBarangService.js
|   `-- userService.js
|-- sql/
|   `-- alter_barang_keluar_status_to_cash_loan.sql
|-- utils/
|   `-- response.js
`-- validators/
    |-- authValidator.js
    |-- barangKeluarValidator.js
    |-- barangMasukValidator.js
    |-- dashboardValidator.js
    |-- lokasiValidator.js
    |-- masterAnggotaValidator.js
    |-- masterBarangValidator.js
    |-- paginationValidator.js
    |-- stokBarangValidator.js
    `-- userValidator.js
```

## Root

`app.js` adalah entry point server. File ini membuat instance Express, memasang middleware global, memasang route module, catch-all `404`, dan menjalankan `app.listen`.

`package.json` berisi metadata project, script, dependency, dan menyatakan `"type": "commonjs"`.

`.env.example` mendokumentasikan variable environment yang dibutuhkan.

`BACKEND_CONTEXT.md`, `BACKEND_PROJECT_CONTEXT.md`, dan `BACKEND_TREE.md` adalah dokumentasi lama atau dokumentasi pendukung. File tersebut tidak di-import aplikasi runtime.

## controllers

Folder `controllers` berisi handler HTTP. Controller bertugas:

- Membaca `req.params`, `req.query`, `req.body`, dan data middleware seperti `req.user` atau `req.locationScope`.
- Memanggil validator.
- Memanggil service.
- Mengubah hasil service menjadi response JSON.
- Menentukan HTTP status untuk success dan error umum.

Controller tidak berisi query SQL langsung, kecuali `exampleController.js` yang memang endpoint contoh.

Daftar controller:

- `authController.js`: login dan current user.
- `userController.js`: CRUD user, status user, reset password, role dropdown.
- `dashboardController.js`: statistik dashboard dengan filter periode dan lokasi.
- `masterBarangController.js`: CRUD master barang dengan location scope.
- `masterAnggotaController.js`: CRUD anggota.
- `lokasiController.js`: CRUD lokasi dan dropdown lokasi.
- `barangMasukController.js`: CRUD barang masuk dengan filter bulan, tahun, status, search, lokasi, pagination optional.
- `barangKeluarController.js`: CRUD barang keluar dengan filter bulan, tahun, status, search, lokasi, pagination optional, dan mapping service error.
- `stokBarangController.js`: list stok dan ringkasan stok.
- `exampleController.js`: endpoint contoh `SELECT 1`.

## routes

Folder `routes` memetakan URL dan HTTP method ke controller. Route juga menentukan middleware modul:

- `authRoutes.js`: login tanpa token, `/me` memakai token.
- `userRoutes.js`: semua route wajib JWT dan role `SUPER ADMIN`.
- `roleRoutes.js`: dropdown role, wajib JWT dan role `SUPER ADMIN`.
- `dashboardRoutes.js`: wajib JWT dan location scope.
- `masterBarangRoutes.js`: wajib JWT dan location scope.
- `masterAnggotaRoutes.js`: wajib JWT.
- `lokasiRoutes.js`: wajib JWT dan location scope; write hanya `SUPER ADMIN`.
- `barangMasukRoutes.js`: wajib JWT dan location scope.
- `barangKeluarRoutes.js`: wajib JWT dan location scope.
- `stokBarangRoutes.js`: wajib JWT dan location scope.
- `exampleRoutes.js`: tidak memakai autentikasi.

## middleware

Folder `middleware` saat ini hanya berisi `authMiddleware.js`.

Middleware yang ada:

- `authenticateToken`: memvalidasi header `Authorization: Bearer <token>`, verify JWT, mengambil user dari database, mengecek user aktif, mengecek role-lokasi valid, lalu mengisi `req.user`.
- `requireRole`: factory middleware untuk membatasi role tertentu.
- `attachLocationScope`: membuat `req.locationScope` berdasarkan role. `SUPER ADMIN` mendapat akses global; `ADMIN` mendapat akses hanya ke `id_lokasi` user.

Belum ada middleware logger, upload, validation wrapper generik, central error handler, rate limiter, request id, audit middleware, atau cookie/session middleware.

## services

Folder `services` berisi business logic dan query SQL. Karena belum ada folder `repositories`, service juga menjadi tempat akses database.

Tanggung jawab service:

- Menyusun SQL select, insert, update, delete.
- Menyusun filter dinamis.
- Melakukan perhitungan transaksi.
- Mengecek constraint bisnis tertentu, misalnya stok cukup atau lokasi tidak dipakai sebelum dihapus.
- Mengubah row database menjadi shape response.

Daftar service:

- `authService.js`
- `userService.js`
- `dashboardService.js`
- `masterBarangService.js`
- `masterAnggotaService.js`
- `lokasiService.js`
- `barangMasukService.js`
- `barangKeluarService.js`
- `stokBarangService.js`

## repositories

Folder `repositories` belum ada.

Secara konseptual, repository layer yang diminta pada flow arsitektur masih digabung ke service. Jika nanti dibuat repository, migrasi paling natural adalah memindahkan query SQL dari `services/*Service.js` ke `repositories/*Repository.js`, lalu service hanya menyimpan business rule.

## config

Folder `config` berisi konfigurasi global. Saat ini hanya `db.js`, yaitu konfigurasi MySQL pool.

## models

Folder `models` belum ada.

Backend tidak memakai model ORM. Struktur data mengikuti row SQL dan objek JavaScript biasa.

## database

Folder `database` belum ada.

Tidak ada migration framework, seed framework, atau schema dump lengkap di repo. Hanya ada folder `sql` yang berisi satu script perubahan enum status barang keluar.

## uploads

Folder `uploads` belum ada.

Tidak ada fitur upload file, tidak ada `multer`, tidak ada endpoint static file, dan tidak ada middleware upload.

## logs

Folder `logs` belum ada.

Logging masih berupa `console.log` saat server start dan script super admin. Tidak ada logger request seperti Morgan/Winston/Pino.

## helpers

Folder `helpers` belum ada.

Helper reusable saat ini tersebar sebagai fungsi internal di validator/service/controller.

## validators

Folder `validators` berisi validasi payload dan query:

- `authValidator.js`
- `userValidator.js`
- `paginationValidator.js`
- `dashboardValidator.js`
- `masterBarangValidator.js`
- `masterAnggotaValidator.js`
- `lokasiValidator.js`
- `barangMasukValidator.js`
- `barangKeluarValidator.js`
- `stokBarangValidator.js`

Validator mengembalikan string error atau object `{ error, filters }`, bukan melempar exception. Tidak ada library validasi seperti Joi, Zod, Yup, atau express-validator.

## utils

Folder `utils` berisi `response.js`, yaitu helper response JSON.

Format success:

```json
{
  "success": true,
  "message": "Pesan sukses",
  "data": {}
}
```

Format error:

```json
{
  "success": false,
  "message": "Pesan error"
}
```

# 3. Server Flow

Alur request umum:

```text
Client
|
v
Route Express di app.js
|
v
Route module di routes/*
|
v
Middleware global dan route-level
|
v
Controller
|
v
Validator
|
v
Service
|
v
Raw SQL via mysql2 pool
|
v
Database
|
v
Service mengembalikan data
|
v
Controller membentuk response
|
v
Client menerima JSON
```

Urutan global pada `app.js`:

1. Load `.env`.
2. Import route module.
3. Buat Express app.
4. Pasang `cors()`.
5. Pasang `express.json()`.
6. Register `GET /`.
7. Register route prefix:
   - `/api/examples`
   - `/api/auth`
   - `/api/users`
   - `/api/roles`
   - `/api/dashboard`
   - `/api/master-barang`
   - `/api/master-anggota`
   - `/api/lokasi`
   - `/api/barang-masuk`
   - `/api/barang-keluar`
   - `/api/stok-barang`
8. Pasang catch-all `404`.
9. Jalankan `app.listen(PORT)`.

Untuk protected endpoint, flow menjadi:

```text
Client mengirim Authorization: Bearer <jwt>
|
v
authenticateToken
  - cek header ada dan format Bearer valid
  - cek JWT_SECRET
  - verify token
  - ambil user dari database berdasarkan decoded id
  - cek user ada
  - cek is_active
  - validasi role dan lokasi user
  - set req.user
|
v
attachLocationScope jika route memakai scope lokasi
  - SUPER ADMIN => global
  - ADMIN => id_lokasi user
|
v
requireRole jika route butuh role tertentu
|
v
Controller
|
v
Validator
|
v
Service
|
v
Database
|
v
response.success atau response.error
```

Penting: tidak ada global `next(error)` error handler. Controller memakai `try/catch` sendiri dan langsung memanggil `response.error`.

# 4. Database

Skema database lokal yang terbaca berisi 7 base table dan 1 view:

- `roles`
- `lokasi`
- `users`
- `master_barang`
- `master_anggota`
- `barang_masuk`
- `barang_keluar`
- `v_stok_barang` sebagai view

## Tabel `roles`

Fungsi: menyimpan daftar role user.

Kolom:

| Kolom | Tipe | Null | Default | Key | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `int` | NO | `null` | PRI | `auto_increment` |
| `nama_role` | `varchar(50)` | NO | `null` | UNI |  |
| `created_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED` |
| `updated_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` |

Primary key:

- `id`

Foreign key:

- Tidak ada.

Index:

- `PRIMARY` pada `id`.
- Unique index `nama_role` pada `nama_role`.

Constraint:

- `nama_role` unik.
- Role yang didukung aplikasi saat ini hanya `SUPER ADMIN` dan `ADMIN`, didefinisikan di `constants/roles.js`.

Relasi:

- One-to-many ke `users` melalui `users.id_role`.

Business rule:

- User hanya valid jika `nama_role` masuk daftar `ALLOWED_ROLES`.
- `SUPER ADMIN` harus tidak memiliki `id_lokasi`.
- `ADMIN` harus memiliki `id_lokasi` valid.

## Tabel `lokasi`

Fungsi: menyimpan data lokasi atau tempat pelayanan.

Kolom:

| Kolom | Tipe | Null | Default | Key | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `int` | NO | `null` | PRI | `auto_increment` |
| `kode_lokasi` | `varchar(10)` | NO | `null` | UNI |  |
| `nama_lokasi` | `varchar(100)` | NO | `null` |  |  |
| `created_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED` |
| `updated_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` |

Primary key:

- `id`

Foreign key:

- Tidak ada.

Index:

- `PRIMARY` pada `id`.
- Unique index `kode_lokasi` pada `kode_lokasi`.

Constraint:

- `kode_lokasi` unik.
- `nama_lokasi` maksimal 100 karakter divalidasi aplikasi.

Relasi:

- One-to-many ke `users`.
- One-to-many ke `master_barang`.
- One-to-many ke `barang_masuk`.
- One-to-many ke `barang_keluar`.
- Dipakai oleh view `v_stok_barang`.

Business rule:

- Lokasi hanya boleh dibuat, diubah, dan dihapus oleh `SUPER ADMIN`.
- `kode_lokasi` dibuat otomatis dari inisial `nama_lokasi`, maksimal 10 karakter.
- Jika kode hasil inisial sudah dipakai, service menambahkan suffix angka dari `2` sampai `999`.
- Nama lokasi dicek unik secara case-insensitive dan trim di service.
- Lokasi tidak boleh dihapus jika masih dipakai oleh `users`, `master_barang`, `barang_masuk`, atau `barang_keluar`.
- User `ADMIN` hanya dapat membaca lokasi miliknya sendiri.

## Tabel `users`

Fungsi: menyimpan akun aplikasi.

Kolom:

| Kolom | Tipe | Null | Default | Key | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `int` | NO | `null` | PRI | `auto_increment` |
| `id_role` | `int` | NO | `null` | MUL |  |
| `id_lokasi` | `int` | YES | `null` | MUL |  |
| `nama` | `varchar(100)` | NO | `null` |  |  |
| `username` | `varchar(100)` | NO | `null` | UNI |  |
| `password_hash` | `varchar(255)` | NO | `null` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED` |
| `updated_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` |

Primary key:

- `id`

Foreign key:

- `fk_users_role`: `id_role` -> `roles.id`, `ON UPDATE NO ACTION`, `ON DELETE NO ACTION`.
- `fk_users_lokasi`: `id_lokasi` -> `lokasi.id`, `ON UPDATE NO ACTION`, `ON DELETE NO ACTION`.

Index:

- `PRIMARY` pada `id`.
- Unique index `uq_users_username` pada `username`.
- Index `fk_users_role` pada `id_role`.
- Index `fk_users_lokasi` pada `id_lokasi`.

Constraint:

- `username` unik.
- `password_hash` wajib.
- `id_lokasi` nullable untuk `SUPER ADMIN`.

Relasi:

- Many-to-one ke `roles`.
- Many-to-one nullable ke `lokasi`.

Business rule:

- Hanya `SUPER ADMIN` dapat CRUD user dan melihat dropdown role.
- Password minimal 8 karakter dan wajib dikonfirmasi saat create/reset.
- Username dicek unik case-insensitive oleh service sebelum insert/update.
- User aktif diperlukan untuk login dan akses protected endpoint.
- User tidak boleh menonaktifkan akun sendiri.
- User tidak boleh menghapus akun sendiri.
- Akun `SUPER ADMIN` terakhir tidak boleh dihapus.
- Akun `SUPER ADMIN` aktif terakhir tidak boleh dinonaktifkan.
- Akun `SUPER ADMIN` terakhir tidak boleh diubah menjadi `ADMIN`.
- User yang sedang login dan berrole `SUPER ADMIN` tidak boleh mengubah role sendiri menjadi non-super-admin.
- `SUPER ADMIN` harus `id_lokasi = null`.
- `ADMIN` harus memiliki lokasi valid.
- `getUserUsage` saat ini masih stub dan selalu mengembalikan array kosong, sehingga proteksi hapus user berbasis riwayat belum efektif.

## Tabel `master_barang`

Fungsi: menyimpan master barang/pupuk.

Kolom:

| Kolom | Tipe | Null | Default | Key | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `int` | NO | `null` | PRI | `auto_increment` |
| `kode_barang` | `varchar(100)` | NO | `null` | UNI |  |
| `nama_barang` | `varchar(255)` | NO | `null` |  |  |
| `satuan` | `varchar(50)` | NO | `null` |  |  |
| `id_lokasi` | `int` | NO | `null` | MUL |  |
| `harga_satuan` | `bigint` | NO | `0` |  |  |
| `created_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED` |
| `updated_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` |

Primary key:

- `id`

Foreign key:

- `fk_master_barang_lokasi`: `id_lokasi` -> `lokasi.id`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`.

Index:

- `PRIMARY` pada `id`.
- Unique index `kode_barang` pada `kode_barang`.
- Index `fk_master_barang_lokasi` pada `id_lokasi`.

Constraint:

- `kode_barang` unik di seluruh database, bukan per lokasi.
- `id_lokasi` wajib.
- `harga_satuan` bertipe `bigint`, sementara beberapa transaksi memakai `decimal(15,2)`.

Relasi:

- Many-to-one ke `lokasi`.
- One-to-many ke `barang_masuk`.
- One-to-many ke `barang_keluar`.
- Dipakai oleh view `v_stok_barang`.

Business rule:

- `ADMIN` otomatis dipaksa memakai `id_lokasi` miliknya saat create/update/list/detail/delete.
- `SUPER ADMIN` dapat mengirim filter `id_lokasi`.
- `harga_satuan` dipakai sebagai harga modal saat transaksi barang keluar.
- Delete adalah hard delete dan bergantung pada FK database. Jika barang sudah dipakai transaksi, database akan menolak karena `ON DELETE RESTRICT`.
- Tidak ada validasi aplikasi untuk format kode, panjang field, angka positif harga, atau uniqueness sebelum insert; sebagian constraint ditanggung database.

## Tabel `master_anggota`

Fungsi: menyimpan data anggota/customer/penerima barang keluar.

Kolom:

| Kolom | Tipe | Null | Default | Key | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `int` | NO | `null` | PRI | `auto_increment` |
| `nomor_anggota` | `varchar(100)` | NO | `null` | UNI |  |
| `nama_anggota` | `varchar(255)` | NO | `null` |  |  |
| `keterangan` | `varchar(100)` | YES | `null` |  |  |
| `created_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED` |
| `updated_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` |

Primary key:

- `id`

Foreign key:

- Tidak ada FK keluar.

Index:

- `PRIMARY` pada `id`.
- Unique index `nomor_anggota` pada `nomor_anggota`.

Constraint:

- `nomor_anggota` unik.
- `nomor_anggota` dan `nama_anggota` wajib.
- `keterangan` nullable.

Relasi:

- One-to-many nullable ke `barang_keluar` melalui `barang_keluar.id_master_anggota`.

Business rule:

- Transaksi barang keluar boleh tanpa anggota. Empty `id_master_anggota` dinormalisasi menjadi `null`.
- Jika anggota dihapus, FK `barang_keluar.id_master_anggota` memakai `ON DELETE SET NULL`, sehingga history transaksi keluar tetap ada tetapi relasi anggota dikosongkan.
- CRUD anggota hanya butuh user terautentikasi, tidak memakai location scope.

## Tabel `barang_masuk`

Fungsi: menyimpan transaksi barang masuk atau pembelian/penerimaan stok.

Kolom:

| Kolom | Tipe | Null | Default | Key | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `int` | NO | `null` | PRI | `auto_increment` |
| `tanggal` | `date` | NO | `null` |  |  |
| `id_master_barang` | `int` | NO | `null` | MUL |  |
| `id_lokasi` | `int` | NO | `null` | MUL |  |
| `jumlah` | `int` | NO | `0` |  |  |
| `harga_satuan` | `decimal(15,2)` | NO | `0.00` |  |  |
| `total_harga` | `decimal(15,2)` | NO | `0.00` |  |  |
| `jumlah_bayar` | `decimal(15,2)` | NO | `0.00` |  |  |
| `sisa_bayar` | `decimal(15,2)` | NO | `0.00` |  |  |
| `status` | `enum('LUNAS','PIUTANG','LOAN')` | NO | `LUNAS` |  |  |
| `created_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED` |
| `updated_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` |

Primary key:

- `id`

Foreign key:

- `fk_barang_masuk_master_barang`: `id_master_barang` -> `master_barang.id`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`.
- `fk_barang_masuk_lokasi`: `id_lokasi` -> `lokasi.id`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`.

Index:

- `PRIMARY` pada `id`.
- Index `fk_barang_masuk_master_barang` pada `id_master_barang`.
- Index `fk_barang_masuk_lokasi` pada `id_lokasi`.

Constraint:

- Status database hanya `LUNAS`, `PIUTANG`, `LOAN`.
- Jumlah default `0`, tetapi validator belum mengecek harus positif.
- Tanggal wajib, tetapi validator belum mengecek format tanggal.

Relasi:

- Many-to-one ke `master_barang`.
- Many-to-one ke `lokasi`.
- Sumber stok masuk untuk view `v_stok_barang`.

Business rule:

- `total_harga = jumlah * harga_satuan`.
- `sisa_bayar = jumlah_bayar - total_harga` pada kode saat ini.
- Jika nama `sisa_bayar` dimaksudkan sebagai sisa hutang, rumus ini berpotensi terbalik karena pembayaran lebih kecil dari total menghasilkan angka negatif.
- Status `LOAN` tidak dihitung sebagai stok masuk di view `v_stok_barang`.
- Create/update/delete tidak memakai transaksi database eksplisit.
- Tidak ada pengecekan aplikasi apakah `id_master_barang` sesuai dengan `id_lokasi`; FK hanya memastikan keduanya ada.
- `ADMIN` otomatis dibatasi ke lokasi miliknya.

## Tabel `barang_keluar`

Fungsi: menyimpan transaksi barang keluar atau penjualan/pengeluaran stok.

Kolom:

| Kolom | Tipe | Null | Default | Key | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `int` | NO | `null` | PRI | `auto_increment` |
| `tanggal` | `date` | NO | `null` |  |  |
| `id_master_anggota` | `int` | YES | `null` | MUL |  |
| `id_master_barang` | `int` | NO | `null` | MUL |  |
| `id_lokasi` | `int` | NO | `null` | MUL |  |
| `jumlah` | `int` | NO | `0` |  |  |
| `harga_jual` | `decimal(15,2)` | NO | `0.00` |  |  |
| `total_harga_jual` | `decimal(15,2)` | NO | `0.00` |  |  |
| `jumlah_bayar` | `decimal(15,2)` | NO | `0.00` |  |  |
| `sisa_bayar` | `decimal(15,2)` | NO | `0.00` |  |  |
| `harga_modal` | `decimal(15,2)` | NO | `0.00` |  |  |
| `margin` | `decimal(15,2)` | NO | `0.00` |  |  |
| `status` | `enum('C','L')` | NO | `L` |  |  |
| `created_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED` |
| `updated_at` | `timestamp` | YES | `CURRENT_TIMESTAMP` |  | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` |

Primary key:

- `id`

Foreign key:

- `fk_barang_keluar_master_anggota`: `id_master_anggota` -> `master_anggota.id`, `ON UPDATE CASCADE`, `ON DELETE SET NULL`.
- `fk_barang_keluar_master_barang`: `id_master_barang` -> `master_barang.id`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`.
- `fk_barang_keluar_lokasi`: `id_lokasi` -> `lokasi.id`, `ON UPDATE CASCADE`, `ON DELETE RESTRICT`.

Index:

- `PRIMARY` pada `id`.
- Index `fk_barang_keluar_master_anggota` pada `id_master_anggota`.
- Index `fk_barang_keluar_master_barang` pada `id_master_barang`.
- Index `fk_barang_keluar_lokasi` pada `id_lokasi`.

Constraint:

- Status database saat ini hanya `C` dan `L`.
- Validator juga hanya menerima `C` dan `L`.
- Script `sql/alter_barang_keluar_status_to_cash_loan.sql` memigrasikan status legacy `LUNAS`, `PIUTANG`, `LOAN` menjadi kontrak `C`/`L`.

Relasi:

- Many-to-one nullable ke `master_anggota`.
- Many-to-one ke `master_barang`.
- Many-to-one ke `lokasi`.
- Sumber stok keluar untuk view `v_stok_barang`.

Business rule:

- `harga_modal` diambil dari `master_barang.harga_satuan` pada saat transaksi dibuat/diubah.
- `total_harga_jual = jumlah * harga_jual`.
- `margin = total_harga_jual - (jumlah * harga_modal)`.
- `sisa_bayar = jumlah_bayar - total_harga_jual` pada kode saat ini.
- Stok harus cukup sebelum create barang keluar.
- Pada update barang keluar, jika item dan lokasi lama sama dengan item dan lokasi baru, stok efektif adalah stok tersedia saat ini ditambah jumlah lama transaksi tersebut.
- Jika item/lokasi berubah, jumlah lama tidak direstore untuk validasi stok item/lokasi baru.
- Transaksi keluar boleh tanpa anggota.
- `ADMIN` otomatis dibatasi ke lokasi miliknya.
- Create/update tidak memakai transaksi database atau locking, sehingga ada risiko race condition antara validasi stok dan insert/update.

## View `v_stok_barang`

Fungsi: menampilkan stok terkini per master barang dan lokasi.

Kolom:

| Kolom | Tipe | Arti |
| --- | --- | --- |
| `id_master_barang` | `int` | ID barang. |
| `kode_barang` | `varchar(100)` | Kode barang. |
| `nama_barang` | `varchar(255)` | Nama barang. |
| `satuan` | `varchar(50)` | Satuan. |
| `id_lokasi` | `int` | ID lokasi. |
| `kode_lokasi` | `varchar(10)` | Kode lokasi. |
| `nama_lokasi` | `varchar(100)` | Nama lokasi. |
| `stok_masuk` | `decimal(32,0)` | Total jumlah masuk selain status `LOAN`. |
| `stok_keluar` | `decimal(32,0)` | Total jumlah keluar. |
| `stok` | `decimal(33,0)` | `stok_masuk - stok_keluar`. |
| `harga_satuan` | `bigint` | Harga satuan/modal dari master barang. |
| `nilai_aset` | `decimal(52,0)` | `stok * harga_satuan`. |

Primary key:

- Tidak ada karena ini view.

Foreign key:

- Tidak ada karena ini view.

Index:

- Tidak ada index langsung pada view. Performa mengikuti table dan index sumber.

Relasi sumber:

- Join `master_barang` ke `lokasi`.
- Left join agregat `barang_masuk` berdasarkan `id_master_barang` dan `id_lokasi`.
- Left join agregat `barang_keluar` berdasarkan `id_master_barang` dan `id_lokasi`.

Business rule:

- Stok tidak disimpan sebagai row mutasi fisik.
- Stok dihitung dinamis dari transaksi.
- Barang masuk status `LOAN` tidak menambah stok.
- Semua barang keluar mengurangi stok tanpa melihat status `C` atau `L`.
- `nilai_aset` memakai harga satuan terbaru dari master barang, bukan harga historis transaksi masuk.

# 5. Endpoint

Base URL lokal default:

```text
http://localhost:5000
```

Semua response sukses standar:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Semua response error standar:

```json
{
  "success": false,
  "message": "string"
}
```

## Health / Root

| Method | URL | Body | Query | Response | Validation | Error | Permission |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GET` | `/` | none | none | `{ "message": "API Inventory Pupuk berjalan" }` | none | none khusus | Public |

## Example

| Method | URL | Body | Query | Response | Validation | Error | Permission |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GET` | `/api/examples` | none | none | `{ message, data: [{ id: 1, name: "Contoh data" }] }` | none | `500` dengan `error.message` mentah | Public |

Catatan: endpoint ini berbeda format dari response helper standar dan sebaiknya dianggap endpoint contoh/debug.

## Auth

### `POST /api/auth/login`

Body:

```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

Query: tidak ada.

Response success:

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "jwt",
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

Validation:

- `username` wajib.
- `password` wajib.
- Username di-trim.

Error:

- `400`: username/password kosong.
- `401`: username atau password salah.
- `403`: akun tidak aktif atau role/lokasi tidak valid.
- `500`: `JWT_SECRET` kosong atau error login generic.

Permission:

- Public.

### `GET /api/auth/me`

Body: none.

Query: none.

Header:

```text
Authorization: Bearer <token>
```

Response: data user aktif, termasuk `is_active`.

Validation:

- JWT valid.
- User masih ada.
- User aktif.
- Role/lokasi valid.

Error:

- `401`: token tidak ada, format token salah, token invalid/expired, user tidak ditemukan.
- `403`: akun tidak aktif atau role/lokasi invalid.
- `500`: konfigurasi auth tidak lengkap atau error generic.

Permission:

- Authenticated user.

## Users

Semua endpoint `/api/users` wajib:

- `authenticateToken`
- `requireRole('SUPER ADMIN')`

### `GET /api/users`

Query:

- `page`: angka positif, default `1`.
- `limit`: `20`, `50`, atau `100`, default `20`.
- `search`: optional; mencari nama, username, role, lokasi.
- `id_role`: optional angka positif.
- `id_lokasi`: optional angka positif.
- `status`: optional `active` atau `inactive`.
- `is_active`: optional boolean, `0`, atau `1` jika `status` tidak dikirim.

Response:

```json
{
  "success": true,
  "message": "Data pengguna berhasil diambil",
  "data": {
    "users": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "total_pages": 0
    }
  }
}
```

Error:

- `400` untuk query invalid.
- `500` generic.

Permission:

- `SUPER ADMIN`.

### `GET /api/users/:id`

Params:

- `id`: angka positif.

Response: detail user tanpa `password_hash`.

Error:

- `400`: ID invalid.
- `404`: user tidak ditemukan.
- `500`: generic.

Permission:

- `SUPER ADMIN`.

### `POST /api/users`

Body:

```json
{
  "nama": "Admin TP A",
  "username": "admin_tpa",
  "password": "password123",
  "password_confirmation": "password123",
  "id_role": 2,
  "id_lokasi": 1
}
```

Validation:

- `nama` wajib.
- `username` wajib.
- `password` wajib minimal 8 karakter.
- `password_confirmation` wajib dan harus sama.
- `id_role` wajib angka positif.
- `id_lokasi` optional tetapi jika ada harus angka positif.
- Jika role `SUPER ADMIN`, `id_lokasi` dipaksa `null`.
- Jika role `ADMIN`, `id_lokasi` wajib dan harus ada di tabel `lokasi`.
- Username harus tersedia.

Response:

- `201`, data user baru tanpa password.

Error:

- `400`: validation, role invalid, lokasi wajib/invalid.
- `409`: username sudah digunakan.
- `500`: generic.

Permission:

- `SUPER ADMIN`.

### `PUT /api/users/:id`

Body:

```json
{
  "nama": "Admin TP A",
  "username": "admin_tpa",
  "id_role": 2,
  "id_lokasi": 1
}
```

Validation dan business rule:

- ID harus angka positif.
- User target harus ada.
- Field `nama`, `username`, `id_role` wajib.
- Role/lokasi valid.
- Username unik.
- User yang sedang login tidak boleh mengubah role sendiri dari `SUPER ADMIN` menjadi role lain.
- `SUPER ADMIN` terakhir tidak boleh diubah menjadi `ADMIN`.

Error:

- `400`, `404`, `409`, `500`.

Permission:

- `SUPER ADMIN`.

### `PATCH /api/users/:id/status`

Body:

```json
{
  "is_active": 1
}
```

Validation:

- `is_active` harus boolean, `0`, atau `1`.
- User target harus ada.
- User tidak boleh menonaktifkan akun sendiri.
- `SUPER ADMIN` aktif terakhir tidak boleh dinonaktifkan.

Error:

- `400`, `404`, `500`.

Permission:

- `SUPER ADMIN`.

### `PATCH /api/users/:id/password`

Body:

```json
{
  "password": "passwordBaru123",
  "password_confirmation": "passwordBaru123"
}
```

Validation:

- Password wajib minimal 8 karakter.
- Konfirmasi wajib sama.
- User target harus ada.

Error:

- `400`, `404`, `500`.

Permission:

- `SUPER ADMIN`.

### `PUT /api/users/:id/reset-password`

Endpoint ini diarahkan ke controller yang sama dengan `PATCH /api/users/:id/password`.

Body, response, validation, error, dan permission sama.

### `DELETE /api/users/:id`

Validation dan business rule:

- ID angka positif.
- Tidak boleh menghapus akun sendiri.
- User harus ada.
- `SUPER ADMIN` terakhir tidak boleh dihapus.
- Jika `getUserUsage` mengembalikan usage, delete ditolak. Saat ini `getUserUsage` masih stub kosong.

Error:

- `400`: ID invalid atau hapus akun sendiri.
- `404`: user tidak ditemukan.
- `409`: user masih punya riwayat, tetapi saat ini belum efektif karena stub.
- `500`: generic.

Permission:

- `SUPER ADMIN`.

## Roles

Semua endpoint `/api/roles` wajib:

- `authenticateToken`
- `requireRole('SUPER ADMIN')`

### `GET /api/roles/dropdown`

Body: none.

Query: none.

Response:

```json
{
  "success": true,
  "message": "Dropdown role berhasil diambil",
  "data": [
    {
      "id": 1,
      "nama": "SUPER ADMIN"
    }
  ]
}
```

Permission:

- `SUPER ADMIN`.

## Dashboard

Semua endpoint `/api/dashboard` wajib:

- `authenticateToken`
- `attachLocationScope`

### `GET /api/dashboard`

Query:

- `period`: optional, default `this_month`; pilihan `today`, `this_week`, `this_month`, `this_year`, `custom`.
- `start_date`: wajib jika `period=custom`, format `YYYY-MM-DD`.
- `end_date`: wajib jika `period=custom`, format `YYYY-MM-DD`.
- `id_lokasi`: optional angka positif. Untuk `ADMIN`, tidak boleh meminta lokasi selain lokasi user.
- `recent_limit`: optional angka `1` sampai `20`, default `5`.

Response shape:

```json
{
  "success": true,
  "message": "Dashboard berhasil dimuat",
  "data": {
    "filters": {
      "period": "this_month",
      "start_date": "2026-07-01",
      "end_date": "2026-07-31",
      "id_lokasi": null,
      "nama_lokasi": null
    },
    "summary": {
      "barang_masuk": { "count": 0, "jumlah": 0, "total": 0 },
      "barang_keluar": { "count": 0, "jumlah": 0, "total": 0 },
      "stok": { "jumlah": 0, "nilai_aset": 0 },
      "finance": {
        "revenue": 0,
        "modal": 0,
        "margin": 0,
        "dibayar": 0,
        "piutang": 0
      }
    },
    "status_summary": [],
    "location_summary": [],
    "recent_barang_masuk": [],
    "recent_barang_keluar": [],
    "trend": []
  }
}
```

Validation:

- Period harus salah satu allowed values.
- `custom` wajib punya start/end date valid.
- `start_date` tidak boleh setelah `end_date`.
- `id_lokasi` angka positif.
- `recent_limit` 1 sampai 20.

Error:

- `400`: query invalid.
- `403`: admin mencoba akses lokasi lain.
- `404`: lokasi filter atau lokasi user tidak ditemukan.
- `500`: generic.

Permission:

- Authenticated `SUPER ADMIN` atau `ADMIN`.
- `ADMIN` scoped ke lokasi sendiri.

## Lokasi

Semua endpoint `/api/lokasi` wajib:

- `authenticateToken`
- `attachLocationScope`

Write endpoint juga wajib:

- `requireRole('SUPER ADMIN')`

### `GET /api/lokasi`

Query:

- `page`: angka positif, default `1`.
- `limit`: `20`, `50`, atau `100`, default `20`.
- `search`: optional.

Response:

```json
{
  "success": true,
  "message": "Data lokasi berhasil diambil",
  "data": {
    "lokasi": [],
    "pagination": {}
  }
}
```

Permission:

- `SUPER ADMIN`: semua lokasi.
- `ADMIN`: lokasi sendiri.

### `GET /api/lokasi/dropdown`

Response:

```json
{
  "success": true,
  "message": "Dropdown lokasi berhasil diambil",
  "data": [
    { "id": 1, "nama": "Pusat" }
  ]
}
```

Permission:

- `SUPER ADMIN`: semua lokasi.
- `ADMIN`: lokasi sendiri.

### `GET /api/lokasi/:id`

Params:

- `id`: angka positif.

Error:

- `400`: ID invalid.
- `404`: tidak ditemukan atau tidak dalam scope admin.

### `POST /api/lokasi`

Body:

```json
{
  "nama": "Pusat"
}
```

atau:

```json
{
  "nama_lokasi": "Pusat"
}
```

Validation:

- Nama lokasi wajib.
- Harus teks.
- Tidak boleh kosong.
- Maksimal 100 karakter.
- Nama unik case-insensitive.

Response:

- `201`, lokasi baru dengan `kode_lokasi` generated.

Error:

- `400`: validasi.
- `409`: nama lokasi sudah digunakan atau kode otomatis penuh.
- `500`: generic.

Permission:

- `SUPER ADMIN`.

### `PUT /api/lokasi/:id`

Body sama dengan create.

Business rule:

- `kode_lokasi` tidak diubah saat update nama.
- Nama baru harus unik.

Permission:

- `SUPER ADMIN`.

### `DELETE /api/lokasi/:id`

Business rule:

- Lokasi tidak boleh masih dipakai user, master barang, barang masuk, atau barang keluar.

Error:

- `400`, `404`, `409`, `500`.

Permission:

- `SUPER ADMIN`.

## Master Barang

Semua endpoint `/api/master-barang` wajib:

- `authenticateToken`
- `attachLocationScope`

### `GET /api/master-barang`

Query:

- `id_lokasi`: optional angka positif, hanya efektif untuk `SUPER ADMIN`.

Response:

- Array master barang.

Permission:

- `SUPER ADMIN`: semua barang atau filter lokasi.
- `ADMIN`: barang di lokasi sendiri; query `id_lokasi` client diabaikan.

### `GET /api/master-barang/:id`

Params:

- `id`: diteruskan ke service, belum divalidasi eksplisit sebagai angka.

Response:

- Detail barang atau `404`.

### `POST /api/master-barang`

Body:

```json
{
  "kode_barang": "UREA-001",
  "nama_barang": "Pupuk Urea",
  "satuan": "sak",
  "id_lokasi": 1,
  "harga_satuan": 120000
}
```

Validation:

- Wajib: `kode_barang`, `nama_barang`, `satuan`, `id_lokasi`, `harga_satuan`.
- Belum ada validasi format, panjang, angka positif, atau duplikasi di validator.
- Untuk `ADMIN`, `id_lokasi` body diganti oleh scope user.

Error:

- `400`: field wajib kosong.
- `500`: generic, termasuk kemungkinan constraint database.

Permission:

- Authenticated.
- Scoped lokasi.

### `PUT /api/master-barang/:id`

Body sama dengan create.

Business rule:

- Harus ada dalam scope user.
- Update mengganti semua field utama.

### `DELETE /api/master-barang/:id`

Business rule:

- Hard delete.
- Scoped lokasi untuk `ADMIN`.
- Jika masih dipakai transaksi, FK database `RESTRICT` akan menggagalkan delete dan controller mengembalikan generic `500`.

## Master Anggota

Semua endpoint `/api/master-anggota` wajib `authenticateToken`, tetapi tidak memakai location scope.

### `GET /api/master-anggota`

Query:

- `page`: angka positif, default `1`.
- `limit`: `20`, `50`, atau `100`, default `20`.
- `search`: optional; mencari nomor anggota, nama anggota, keterangan.

Response:

```json
{
  "success": true,
  "message": "Data master anggota berhasil diambil",
  "data": {
    "anggota": [],
    "pagination": {}
  }
}
```

### `GET /api/master-anggota/:id`

Response:

- Detail anggota atau `404`.

### `POST /api/master-anggota`

Body:

```json
{
  "nomor_anggota": "AGT-001",
  "nama_anggota": "Nama Anggota",
  "keterangan": "Optional"
}
```

Validation:

- `nomor_anggota` wajib.
- `nama_anggota` wajib.
- `keterangan` optional.

Error:

- `400`: field wajib.
- `500`: generic, termasuk duplikasi nomor anggota dari database.

### `PUT /api/master-anggota/:id`

Body sama dengan create.

### `DELETE /api/master-anggota/:id`

Business rule:

- Hard delete.
- FK barang keluar akan `SET NULL` pada transaksi yang memakai anggota tersebut.

## Barang Masuk

Semua endpoint `/api/barang-masuk` wajib:

- `authenticateToken`
- `attachLocationScope`

### `GET /api/barang-masuk`

Query:

- `bulan`: optional angka 1 sampai 12.
- `tahun`: optional angka positif.
- `status`: optional string; tidak dicek against enum.
- `search`: optional; mencari kode barang, nama barang, nama lokasi, status.
- `tp`: optional id lokasi untuk `SUPER ADMIN`.
- `id_lokasi`: alternatif filter lokasi untuk `SUPER ADMIN` jika `tp` tidak dikirim.
- `page`: optional; jika dikirim bersama/atau limit, pagination aktif.
- `limit`: optional `20`, `50`, atau `100`; jika pagination aktif default limit 20.

Response:

- Jika pagination tidak aktif, `data` adalah array row.
- Jika pagination aktif:

```json
{
  "success": true,
  "message": "Data barang masuk berhasil diambil",
  "data": {
    "barang_masuk": [],
    "pagination": {}
  }
}
```

Permission:

- `SUPER ADMIN`: semua lokasi atau filter lokasi.
- `ADMIN`: lokasi sendiri.

### `GET /api/barang-masuk/:id`

Response:

- Detail barang masuk atau `404`.

### `POST /api/barang-masuk`

Body:

```json
{
  "tanggal": "2026-07-30",
  "id_master_barang": 1,
  "id_lokasi": 1,
  "jumlah": 10,
  "harga_satuan": 100000,
  "jumlah_bayar": 1000000,
  "status": "LUNAS"
}
```

Validation:

- Wajib: `tanggal`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_satuan`, `jumlah_bayar`, `status`.
- Status hanya `LUNAS`, `PIUTANG`, `LOAN`.
- Belum ada validasi tanggal valid, angka positif, atau jumlah bayar non-negatif.
- Untuk `ADMIN`, `id_lokasi` body dipaksa lokasi user.

Perhitungan:

- `total_harga = jumlah * harga_satuan`.
- `sisa_bayar = jumlah_bayar - total_harga`.

Error:

- `400`: field wajib atau status invalid.
- `500`: generic.

### `PUT /api/barang-masuk/:id`

Body sama dengan create.

Business rule:

- Harus ada dalam scope user.
- Recalculate total dan sisa bayar.
- Update semua field utama.

### `DELETE /api/barang-masuk/:id`

Business rule:

- Hard delete.
- Stok akan berubah otomatis karena view menghitung ulang dari transaksi tersisa.

## Barang Keluar

Semua endpoint `/api/barang-keluar` wajib:

- `authenticateToken`
- `attachLocationScope`

### `GET /api/barang-keluar`

Query:

- `bulan`: optional angka 1 sampai 12.
- `tahun`: optional angka positif.
- `id_lokasi`: optional angka positif untuk `SUPER ADMIN`.
- `search`: optional; mencari kode barang, nama barang, nama anggota, nomor anggota, nama lokasi.
- `status`: optional string; tidak dicek di query validator.
- `page`: optional; pagination aktif jika `page` atau `limit` dikirim.
- `limit`: optional `20`, `50`, atau `100`.

Response:

- Tanpa pagination: `data` array rows.
- Dengan pagination:

```json
{
  "success": true,
  "message": "Data barang keluar berhasil diambil",
  "data": {
    "barang_keluar": [],
    "pagination": {}
  }
}
```

### `GET /api/barang-keluar/:id`

Response:

- Detail barang keluar atau `404`.

### `POST /api/barang-keluar`

Body:

```json
{
  "tanggal": "2026-07-30",
  "id_master_anggota": 1,
  "id_master_barang": 1,
  "id_lokasi": 1,
  "jumlah": 5,
  "harga_jual": 150000,
  "jumlah_bayar": 750000,
  "status": "C"
}
```

`id_master_anggota` boleh kosong, `null`, atau tidak dikirim.

Validation:

- Wajib: `tanggal`, `id_master_barang`, `id_lokasi`, `jumlah`, `harga_jual`, `jumlah_bayar`, `status`.
- `tanggal` harus valid format `YYYY-MM-DD`.
- `id_master_barang` angka positif.
- `id_lokasi` angka positif.
- `jumlah` angka bulat lebih dari 0.
- `harga_jual` angka minimal 0.
- `jumlah_bayar` angka minimal 0.
- `id_master_anggota` optional tetapi jika ada harus angka positif.
- `status` hanya `C` atau `L`.

Perhitungan:

- Ambil `harga_modal` dari `master_barang.harga_satuan`.
- `total_harga_jual = jumlah * harga_jual`.
- `margin = total_harga_jual - jumlah * harga_modal`.
- `sisa_bayar = jumlah_bayar - total_harga_jual`.

Business validation:

- Master barang harus ditemukan.
- Stok tersedia pada `v_stok_barang` harus cukup.

Error:

- `400`: validation invalid atau stok tidak cukup.
- `404`: master barang tidak ditemukan.
- `500`: generic.

### `PUT /api/barang-keluar/:id`

Body sama dengan create.

Business rule:

- Transaksi target harus ada dalam scope.
- Recalculate total, modal, margin, dan sisa bayar.
- Validasi stok memakai effective stock.
- Jika item/lokasi lama sama, jumlah lama dianggap dikembalikan dulu dalam validasi.

Error:

- `400`: validation atau stok tidak cukup.
- `404`: transaksi tidak ditemukan. Catatan: jika master barang baru tidak ditemukan, service juga bisa return `null` dan controller akan merespons seperti transaksi tidak ditemukan.
- `500`: generic.

### `DELETE /api/barang-keluar/:id`

Business rule:

- Hard delete.
- Stok view otomatis naik karena transaksi keluar hilang dari agregasi.

## Stok Barang

Semua endpoint `/api/stok-barang` wajib:

- `authenticateToken`
- `attachLocationScope`

### `GET /api/stok-barang`

Query:

- `id_lokasi`: optional angka positif, hanya efektif untuk `SUPER ADMIN`.
- `search`: optional; mencari kode barang, nama barang, satuan, kode lokasi, nama lokasi.
- `hanya_tersedia`: optional `true`, `false`, `1`, atau `0`.

Response:

- Array row dari `v_stok_barang`.

Permission:

- `SUPER ADMIN`: semua lokasi atau filter lokasi.
- `ADMIN`: lokasi sendiri; query `id_lokasi` dihapus oleh controller.

### `GET /api/stok-barang/ringkasan`

Query: none.

Response:

```json
{
  "success": true,
  "message": "Ringkasan stok barang berhasil diambil",
  "data": {
    "keseluruhan": {
      "total_jenis_barang": 0,
      "total_stok": 0,
      "total_nilai_aset": 0
    },
    "per_lokasi": []
  }
}
```

Permission:

- `SUPER ADMIN`: ringkasan semua lokasi.
- `ADMIN`: ringkasan lokasi sendiri.

# 6. Authentication

Backend memakai JWT bearer token.

## JWT

Login memakai `jsonwebtoken.sign` dengan payload:

```json
{
  "id": 1
}
```

Token ditandatangani memakai `process.env.JWT_SECRET`.

Expiry memakai:

```js
process.env.JWT_EXPIRES_IN || '8h'
```

Token dikirim client pada protected endpoint lewat header:

```text
Authorization: Bearer <token>
```

Middleware `authenticateToken` memeriksa:

- Header `authorization` ada.
- Header dimulai dengan `Bearer `.
- Header split menghasilkan tepat 2 bagian.
- `JWT_SECRET` tersedia.
- Token valid dan belum expired.
- User berdasarkan `decodedToken.id` ditemukan.
- `user.is_active` true.
- Role dan lokasi user valid.

## Session

Tidak ada session server-side. Tidak ada `express-session`, session store, Redis session, atau penyimpanan token di server.

## Cookie

Tidak ada cookie auth. Token tidak diset sebagai cookie HTTP-only oleh backend. Client bertanggung jawab menyimpan token dan mengirim header bearer.

## Role

Role yang didukung:

- `SUPER ADMIN`
- `ADMIN`

Konstanta role berada di `constants/roles.js`.

`SUPER ADMIN`:

- Harus memiliki `id_lokasi = null`.
- Bisa mengakses data semua lokasi untuk module scoped.
- Bisa CRUD user.
- Bisa melihat dropdown role.
- Bisa create/update/delete lokasi.

`ADMIN`:

- Harus memiliki `id_lokasi` valid dan `nama_lokasi` ada.
- Hanya boleh mengakses lokasi sendiri untuk module yang memakai `attachLocationScope`.
- Tidak boleh mengakses endpoint user/role.
- Tidak boleh create/update/delete lokasi.

## Permission

Permission belum granular berbasis tabel atau aksi. Sistem permission saat ini hanya:

- Authenticated vs public.
- Role `SUPER ADMIN` vs `ADMIN`.
- Location scope global vs lokasi sendiri.

Tidak ada tabel permission, role-permission pivot, policy engine, ACL, atau RBAC detail.

## Refresh Token

Tidak ada refresh token. Jika JWT expired, client harus login ulang. Tidak ada endpoint refresh, revoke token, token blacklist, atau rotation.

## Password

Password disimpan sebagai hash di `users.password_hash`.

Hash dibuat memakai `bcryptjs.hash(password, saltRounds)`.

Salt rounds:

- `process.env.BCRYPT_SALT_ROUNDS` jika valid.
- Default `10`.

Login memakai `bcrypt.compare(password, user.password_hash)`.

# 7. Business Rules

## Role dan Lokasi

Role valid hanya `SUPER ADMIN` dan `ADMIN`.

`SUPER ADMIN` harus tidak punya lokasi. Jika user super admin memiliki `id_lokasi`, autentikasi ditolak sebagai role tidak valid.

`ADMIN` wajib punya lokasi valid. Jika `id_lokasi` kosong, bukan angka positif, atau join lokasi tidak menghasilkan `nama_lokasi`, autentikasi ditolak.

`attachLocationScope` menghasilkan:

```js
// SUPER ADMIN
{
  isSuperAdmin: true,
  id_lokasi: null
}

// ADMIN
{
  isSuperAdmin: false,
  id_lokasi: req.user.id_lokasi
}
```

Business rule ini memengaruhi dashboard, lokasi, master barang, barang masuk, barang keluar, dan stok barang.

## User Management

Hanya `SUPER ADMIN` boleh mengelola user.

User baru harus punya nama, username, password, konfirmasi password, dan role.

Jika role target adalah `SUPER ADMIN`, lokasi dipaksa `null`.

Jika role target adalah `ADMIN`, lokasi wajib dan harus valid.

Username dicek case-insensitive supaya tidak ada duplikasi berbeda huruf besar/kecil.

User tidak boleh:

- Menonaktifkan akun sendiri.
- Menghapus akun sendiri.
- Mengubah role sendiri dari `SUPER ADMIN` menjadi non-super-admin.
- Menghapus `SUPER ADMIN` terakhir.
- Menonaktifkan `SUPER ADMIN` aktif terakhir.
- Mengubah `SUPER ADMIN` terakhir menjadi `ADMIN`.

## Perhitungan Barang Masuk

Barang masuk adalah transaksi yang menambah stok kecuali status `LOAN`.

Rumus saat create/update:

```text
total_harga = jumlah * harga_satuan
sisa_bayar = jumlah_bayar - total_harga
```

Status yang diterima:

- `LUNAS`
- `PIUTANG`
- `LOAN`

Catatan penting: nama `sisa_bayar` biasanya berarti sisa yang belum dibayar, yang secara umum dihitung `total_harga - jumlah_bayar`. Namun kode saat ini memakai `jumlah_bayar - total_harga`. AI berikutnya harus mengonfirmasi keputusan domain sebelum mengubah rumus karena perubahan ini akan memengaruhi data historis dan tampilan frontend.

## Perhitungan Barang Keluar

Barang keluar adalah transaksi yang mengurangi stok.

Rumus saat create/update:

```text
harga_modal = master_barang.harga_satuan
total_harga_jual = jumlah * harga_jual
margin = total_harga_jual - (jumlah * harga_modal)
sisa_bayar = jumlah_bayar - total_harga_jual
```

Status yang diterima:

- `C`
- `L`

Dari script SQL, status `C` kemungkinan berarti cash dan status `L` berarti loan. Legacy mapping:

- `LUNAS` -> `C`
- `PIUTANG` -> `L`
- `LOAN` -> `L`

Sama seperti barang masuk, rumus `sisa_bayar` memakai `jumlah_bayar - total_harga_jual`, sehingga unpaid akan negatif.

## Stok

Stok dihitung oleh view `v_stok_barang`:

```text
stok_masuk = SUM(barang_masuk.jumlah WHERE status <> 'LOAN')
stok_keluar = SUM(barang_keluar.jumlah)
stok = stok_masuk - stok_keluar
nilai_aset = stok * master_barang.harga_satuan
```

Tidak ada tabel mutasi stok eksplisit. Tidak ada kolom stok di `master_barang`. Tidak ada update stok manual saat transaksi ditambah/diedit/dihapus.

Konsekuensi:

- Create barang masuk otomatis menaikkan stok karena view menghitung ulang.
- Update barang masuk dapat menaikkan/menurunkan stok tergantung perubahan jumlah/status.
- Delete barang masuk menurunkan stok karena sumber stok masuk hilang.
- Create barang keluar mengurangi stok karena view menghitung ulang.
- Update barang keluar mengubah stok sesuai jumlah/item/lokasi baru.
- Delete barang keluar menaikkan stok karena sumber stok keluar hilang.

## Validasi Stok Barang Keluar

Saat create barang keluar:

1. Ambil harga modal dari `master_barang`.
2. Ambil stok tersedia dari `v_stok_barang` berdasarkan `id_master_barang` dan `id_lokasi`.
3. Jika `jumlah` request lebih besar dari stok, throw `ServiceError('Stok barang tidak mencukupi', 400)`.
4. Jika cukup, insert transaksi.

Saat update barang keluar:

1. Ambil transaksi existing.
2. Hitung apakah sumber stok lama sama dengan sumber stok baru.
3. Jika sama, `quantityToRestore = jumlah lama`.
4. `effectiveStock = availableStock + quantityToRestore`.
5. Jika jumlah baru lebih besar dari effective stock, tolak.
6. Jika cukup, update transaksi.

Validasi ini belum memakai transaksi database atau lock. Dua request paralel masih bisa sama-sama lolos validasi dan menyebabkan stok negatif setelah insert.

## Loan dan Piutang

Barang masuk memiliki status `LOAN`, `PIUTANG`, dan `LUNAS`.

Barang keluar saat ini memiliki status `C` dan `L`.

Piutang dashboard tidak memakai status, tetapi memakai rumus:

```text
GREATEST(total_harga_jual - jumlah_bayar, 0)
```

Untuk barang masuk summary dashboard, query menghitung `piutang`:

```text
GREATEST(total_harga - jumlah_bayar, 0)
```

Namun response `summary.barang_masuk` saat ini hanya mengembalikan `count`, `jumlah`, dan `total`; nilai `dibayar` dan `piutang` barang masuk dihitung query tetapi belum dikembalikan.

Loan barang masuk tidak masuk stok karena view mengecualikan `status = 'LOAN'`.

Loan barang keluar tetap mengurangi stok karena semua barang keluar dijumlahkan tanpa filter status.

## History dan Audit

History transaksi disimpan di tabel `barang_masuk` dan `barang_keluar`.

Tidak ada audit trail terpisah:

- Tidak ada `created_by`.
- Tidak ada `updated_by`.
- Tidak ada `deleted_by`.
- Tidak ada log perubahan.
- Tidak ada soft delete.
- Tidak ada tabel mutasi stok.

Semua delete saat ini adalah hard delete.

## Transaction dan Rollback

Tidak ada penggunaan `beginTransaction`, `commit`, atau `rollback` pada service aplikasi.

Operasi yang terdiri dari beberapa query, seperti:

- cek existing lalu update,
- cek stok lalu insert,
- insert lalu refetch,
- update lalu refetch,
- cek usage lalu delete,

belum dibungkus transaction. Jika ada error setelah sebagian query berhasil, tidak ada rollback aplikasi.

Script `createSuperAdmin.js` memakai `getConnection` dan `connection.execute`, tetapi tidak memakai `beginTransaction`.

# 8. Middleware

## Global Middleware

`app.use(cors())`

- Mengaktifkan CORS untuk semua origin dengan default config package `cors`.
- Belum ada whitelist origin.
- Belum ada credentials/cookie config.

`app.use(express.json())`

- Parse JSON body.
- Belum ada custom limit.
- Belum ada handler khusus malformed JSON.

## Auth Middleware

File: `middleware/authMiddleware.js`.

`authenticateToken`:

- Membaca `req.headers.authorization`.
- Format wajib `Bearer <token>`.
- Verify token dengan `JWT_SECRET`.
- Query user by id melalui `authService.findUserById`.
- Tolak jika user tidak ada.
- Tolak jika `is_active` false.
- Validasi role/lokasi via `authService.validateUserRoleLocation`.
- Set `req.user = authService.buildAuthUser(user)`.

`requireRole(...allowedRoles)`:

- Factory middleware.
- Mengecek `req.user.nama_role`.
- Jika tidak masuk allowed roles, return `403`.

`attachLocationScope`:

- Membutuhkan `req.user`.
- Untuk `SUPER ADMIN`, set global scope.
- Untuk `ADMIN`, validasi `id_lokasi` positif lalu set scoped location.
- Role lain ditolak.

## Logger Middleware

Belum ada logger middleware. Tidak ada Morgan, Winston, Pino, atau request logging custom.

## Validation Middleware

Belum ada validation middleware generik. Validasi dilakukan manual di masing-masing controller.

## Upload Middleware

Belum ada upload middleware. Tidak ada `multer` atau endpoint upload.

## Error Handler

Belum ada central error handler empat argumen `(err, req, res, next)`.

Error handling saat ini ada pada setiap controller dengan `try/catch`. Beberapa controller memakai helper lokal `handleServiceError` untuk mempertahankan `error.statusCode`.

# 9. Validation

## Auth Validation

Login:

- `username` wajib.
- `password` wajib.
- `username` di-trim.

Tidak ada validasi panjang username/password saat login selain required.

## Pagination Validation

Default:

- `page = 1`
- `limit = 20`

Allowed limit:

- `20`
- `50`
- `100`

Rules:

- `page` harus angka positif.
- `limit` harus angka positif.
- `limit` harus salah satu allowed values.

Pada beberapa endpoint transaksi, pagination bersifat optional; jika `page` dan `limit` tidak dikirim, endpoint mengembalikan array langsung.

## User Validation

Create user:

- `nama` wajib.
- `username` wajib.
- `password` wajib.
- `password` minimal 8 karakter.
- `password_confirmation` wajib.
- Konfirmasi password harus sama.
- `id_role` wajib angka positif.
- `id_lokasi` jika ada harus angka positif.

Update user:

- `nama` wajib.
- `username` wajib.
- `id_role` wajib angka positif.
- `id_lokasi` jika ada harus angka positif.

Status user:

- `is_active` harus boolean, `0`, atau `1`.

Password update/reset:

- Password wajib minimal 8 karakter.
- Konfirmasi wajib dan sama.

User query:

- Pagination wajib valid.
- `search` optional.
- `id_role` angka positif.
- `id_lokasi` angka positif.
- `status` hanya `active` atau `inactive`.
- `is_active` boolean, `0`, atau `1`.

Business validation user:

- Role harus ada.
- Lokasi harus ada untuk role `ADMIN`.
- Username tidak boleh duplikat.
- Proteksi super admin terakhir.

## Lokasi Validation

Payload:

- Menerima `nama` atau `nama_lokasi`.
- Nama wajib.
- Nama harus teks.
- Nama trim tidak boleh kosong.
- Panjang maksimal 100 karakter.

ID:

- Harus angka positif.

Query:

- Pagination valid.
- `search` optional.

Business validation:

- Nama lokasi unik case-insensitive.
- Lokasi tidak boleh dihapus jika masih dipakai.

## Master Barang Validation

Field wajib:

- `kode_barang`
- `nama_barang`
- `satuan`
- `id_lokasi`
- `harga_satuan`

Belum divalidasi:

- Format kode barang.
- Panjang kode/nama/satuan.
- `id_lokasi` angka positif.
- `harga_satuan` angka non-negatif.
- Keberadaan lokasi.
- Keunikan kode sebelum insert.

Business validation:

- Location scope untuk `ADMIN` mengganti `id_lokasi`.
- FK database memvalidasi lokasi.

## Master Anggota Validation

Field wajib:

- `nomor_anggota`
- `nama_anggota`

Optional:

- `keterangan`

Query:

- Pagination valid.
- `search` optional.

Belum divalidasi:

- Panjang field.
- Format nomor anggota.
- Uniqueness sebelum insert/update.

## Barang Masuk Validation

Field wajib:

- `tanggal`
- `id_master_barang`
- `id_lokasi`
- `jumlah`
- `harga_satuan`
- `jumlah_bayar`
- `status`

Status allowed:

- `LUNAS`
- `PIUTANG`
- `LOAN`

Belum divalidasi:

- Tanggal format `YYYY-MM-DD`.
- `id_master_barang` angka positif.
- `id_lokasi` angka positif.
- `jumlah` angka positif.
- `harga_satuan` angka non-negatif.
- `jumlah_bayar` angka non-negatif.
- Master barang ada dan sesuai lokasi.

Query:

- `bulan` 1 sampai 12.
- `tahun` angka positif.
- `status` optional string.
- `search` optional string.
- `tp` atau `id_lokasi` angka positif untuk super admin.
- Pagination optional valid.

## Barang Keluar Validation

Field wajib:

- `tanggal`
- `id_master_barang`
- `id_lokasi`
- `jumlah`
- `harga_jual`
- `jumlah_bayar`
- `status`

Field optional:

- `id_master_anggota`

Rules:

- `tanggal` harus tanggal valid format `YYYY-MM-DD`.
- `id_master_barang` angka positif.
- `id_lokasi` angka positif.
- `jumlah` integer lebih dari 0.
- `harga_jual` angka >= 0.
- `jumlah_bayar` angka >= 0.
- `id_master_anggota` kosong atau angka positif.
- `status` hanya `C` atau `L`.

Business validation:

- Master barang harus ada.
- Stok harus cukup.

Query:

- `bulan` 1 sampai 12.
- `tahun` angka positif.
- `id_lokasi` angka positif.
- `search` optional.
- `status` optional string.
- Pagination optional valid.

## Dashboard Validation

Query:

- `period`: `today`, `this_week`, `this_month`, `this_year`, `custom`.
- Default `period`: `this_month`.
- Untuk `custom`, `start_date` dan `end_date` wajib.
- Date harus valid format `YYYY-MM-DD`.
- `start_date` tidak boleh setelah `end_date`.
- `id_lokasi` angka positif.
- `recent_limit` angka 1 sampai 20.

Business validation:

- `ADMIN` tidak boleh meminta dashboard lokasi lain.
- Lokasi filter harus ada.

## Stok Barang Validation

Query:

- `id_lokasi`: angka positif string.
- `search`: optional.
- `hanya_tersedia`: `true`, `false`, `1`, atau `0`.

Untuk `ADMIN`, controller menghapus `id_lokasi` query sebelum validasi agar user tidak bisa memilih lokasi lain.

# 10. Error Handling

## Format Response Error

Format standar dari `utils/response.js`:

```json
{
  "success": false,
  "message": "Pesan error"
}
```

Tidak ada field:

- `detail`
- `errors`
- `code`
- `stack`
- `request_id`
- `timestamp`

## HTTP Code

Status code yang dipakai:

- `200`: success default.
- `201`: create success.
- `400`: validation error, business validation tertentu, ID invalid, stok tidak cukup.
- `401`: token diperlukan, token invalid/expired, user tidak ditemukan saat auth, username/password salah.
- `403`: akun tidak aktif, role tidak valid, akses role/lokasi ditolak.
- `404`: data tidak ditemukan, endpoint tidak ditemukan, lokasi dashboard tidak ditemukan.
- `409`: conflict seperti username/nama lokasi sudah dipakai atau lokasi masih digunakan.
- `500`: generic internal error dan konfigurasi auth belum lengkap.

## Message

Error message bersifat human-readable dalam Bahasa Indonesia. Contoh:

- `Token autentikasi diperlukan`
- `Token tidak valid atau telah kedaluwarsa`
- `Akun tidak aktif`
- `Anda tidak memiliki akses ke fitur ini`
- `Field wajib diisi: ...`
- `Stok barang tidak mencukupi`
- `Data ... tidak ditemukan`
- `Gagal mengambil data ...`

## Detail

Tidak ada detail error. Controller sengaja menyembunyikan error database asli, kecuali `exampleController.js` yang mengembalikan `error.message`.

## Validation Error

Validation error langsung berupa message string dan HTTP `400`.

Contoh:

```json
{
  "success": false,
  "message": "Tanggal harus berupa tanggal valid dengan format YYYY-MM-DD"
}
```

Tidak ada field per-field error.

## Internal Error

Internal error ditangkap controller dan dikembalikan generic:

```json
{
  "success": false,
  "message": "Gagal mengambil data ..."
}
```

Tidak ada logging error internal selain tidak eksplisit. Ini membuat debugging production sulit jika tidak ditambah logger.

## ServiceError dan DashboardError

`lokasiService.js` dan `barangKeluarService.js` memiliki `ServiceError` dengan `statusCode`.

`dashboardService.js` memiliki `DashboardError` dengan `statusCode`.

Controller yang menangani:

- `lokasiController` memakai `handleServiceError`.
- `barangKeluarController` memakai `handleServiceError`.
- `dashboardController` mengecek `error.statusCode`.

Controller lain tidak membaca `error.statusCode`.

# 11. Database Flow

## Barang Masuk

Create:

```text
Controller
-> resolveScopedPayload
-> validateBarangMasukPayload
-> service.createBarangMasuk
-> calculate total_harga dan sisa_bayar
-> INSERT barang_masuk
-> SELECT detail by insertId
-> response 201
```

Update:

```text
Controller
-> resolveScopedPayload
-> validate payload
-> service.updateBarangMasuk
-> SELECT existing by id dan scope
-> jika tidak ada return null
-> calculate ulang total_harga dan sisa_bayar
-> UPDATE barang_masuk
-> SELECT detail
-> response 200
```

Delete:

```text
Controller
-> service.deleteBarangMasuk
-> DELETE barang_masuk WHERE id dan scope
-> affectedRows > 0
-> response 200 atau 404
```

Rollback:

- Tidak ada rollback aplikasi.
- Jika insert berhasil tetapi refetch gagal, data tetap tersimpan.
- Jika update berhasil tetapi response gagal, data tetap berubah.

## Barang Keluar

Create:

```text
Controller
-> resolveScopedPayload
-> validateBarangKeluarPayload
-> service.createBarangKeluar
-> getScopedLocationId
-> calculateTransaction
   -> SELECT master_barang.harga_satuan
   -> hitung total_harga_jual, harga_modal, margin, sisa_bayar
-> validateAvailableStock
   -> SELECT stok dari v_stok_barang
   -> jika jumlah > stok, throw ServiceError
-> normalize id_master_anggota
-> INSERT barang_keluar
-> SELECT detail by insertId dan scope
-> response 201
```

Update:

```text
Controller
-> resolveScopedPayload
-> validateBarangKeluarPayload
-> service.updateBarangKeluar
-> SELECT existing by id dan scope
-> calculateTransaction
-> tentukan apakah sumber stok lama sama dengan baru
-> jika sama, restore jumlah lama untuk validasi
-> validateAvailableStock
-> normalize id_master_anggota
-> UPDATE barang_keluar
-> SELECT detail
-> response 200
```

Delete:

```text
Controller
-> service.deleteBarangKeluar
-> DELETE barang_keluar WHERE id dan scope
-> affectedRows > 0
-> response 200 atau 404
```

Rollback:

- Tidak ada transaction.
- Validasi stok dan insert/update tidak atomic.
- Race condition dapat terjadi pada request paralel.

## Update Stok

Tidak ada update stok fisik.

Stok berubah karena view:

```text
v_stok_barang = master_barang + lokasi + SUM(barang_masuk non-LOAN) - SUM(barang_keluar)
```

Semua perubahan transaksi memengaruhi stok secara tidak langsung.

## Delete

Delete master:

- `master_barang`: hard delete, akan ditolak database jika dipakai transaksi karena FK restrict.
- `master_anggota`: hard delete, transaksi keluar akan `SET NULL`.
- `lokasi`: dicek usage dulu oleh service, lalu hard delete.
- `users`: hard delete dengan proteksi super admin, tetapi usage check masih stub.

Delete transaksi:

- `barang_masuk`: hard delete.
- `barang_keluar`: hard delete.

Tidak ada soft delete.

## Edit

Edit master barang:

- Mengubah `harga_satuan`.
- Karena `v_stok_barang.nilai_aset` memakai `master_barang.harga_satuan`, nilai aset historis berubah mengikuti harga terbaru.
- Harga modal transaksi keluar yang sudah dibuat tidak otomatis berubah, karena `harga_modal` tersimpan di row transaksi saat create/update.

Edit barang masuk:

- Recalculate `total_harga` dan `sisa_bayar`.
- Dapat mengubah stok bila jumlah/status/item/lokasi berubah.

Edit barang keluar:

- Recalculate harga modal dari master barang saat update.
- Dapat mengubah stok bila jumlah/item/lokasi berubah.

## Loan

Loan barang masuk:

- Status `LOAN` valid pada barang masuk.
- Tidak menambah stok dalam view.

Loan barang keluar:

- Status `L` valid pada barang keluar.
- Tetap mengurangi stok.

## Piutang

Pada dashboard, piutang dihitung dengan rumus positif:

```text
GREATEST(total - jumlah_bayar, 0)
```

Pada row transaksi, `sisa_bayar` saat ini dihitung kebalikan:

```text
jumlah_bayar - total
```

Ini adalah inkonsistensi domain yang perlu diputuskan.

# 12. Current Progress

## Yang Sudah Selesai

- Server Express berjalan dengan route utama.
- Koneksi MySQL pool tersedia.
- Response helper standar tersedia.
- JWT authentication tersedia.
- Password hashing bcrypt tersedia.
- Role `SUPER ADMIN` dan `ADMIN` tersedia.
- Location scope untuk admin tersedia.
- CRUD user untuk `SUPER ADMIN` tersedia.
- Dropdown role tersedia.
- CRUD lokasi tersedia dengan proteksi `SUPER ADMIN` untuk write.
- Dropdown lokasi tersedia.
- CRUD master barang tersedia dan scoped lokasi.
- CRUD master anggota tersedia.
- CRUD barang masuk tersedia dan scoped lokasi.
- CRUD barang keluar tersedia dan scoped lokasi.
- Validasi stok barang keluar tersedia.
- Stok barang read-only via `v_stok_barang` tersedia.
- Ringkasan stok tersedia.
- Dashboard statistik baru tersedia dengan filter periode, lokasi, recent limit, summary, status summary, location summary, recent transaction, dan trend.
- Script migrasi status barang keluar ke `C`/`L` tersedia.
- Script create super admin tersedia.

## Yang Belum Selesai

- Belum ada repository layer terpisah.
- Belum ada model ORM.
- Belum ada migration lengkap atau schema dump di repo.
- Belum ada seed role/lokasi resmi selain script super admin.
- Belum ada central error middleware.
- Belum ada logger request dan logger error.
- Belum ada transaction/rollback untuk operasi multi-query.
- Belum ada row locking untuk stok.
- Belum ada audit trail.
- Belum ada soft delete.
- Belum ada refresh token.
- Belum ada password change mandiri oleh user biasa.
- Belum ada forgot password.
- Belum ada upload file.
- Belum ada testing otomatis.
- Belum ada API docs machine-readable seperti OpenAPI/Swagger.
- Belum ada rate limiting.
- Belum ada CORS whitelist.
- Belum ada sanitasi/normalisasi angka yang konsisten di semua validator.

## Bug atau Risiko

- `sisa_bayar` dihitung `jumlah_bayar - total`, tetapi dashboard piutang memakai `total - jumlah_bayar`.
- Barang masuk validator belum mengecek tipe angka dan tanggal.
- Master barang validator belum mengecek angka positif, panjang, dan format.
- Master anggota validator belum mengecek panjang dan uniqueness sebelum database.
- Delete master barang yang dipakai transaksi kemungkinan menjadi generic `500`, bukan `409`.
- `getUserUsage` masih stub kosong, sehingga user dengan history mungkin tetap bisa dihapus.
- Barang keluar stock check tidak atomic.
- Barang masuk dapat membuat stok negatif secara tidak langsung jika update/delete dilakukan setelah barang keluar, karena tidak ada validasi stok akhir.
- `status` filter barang masuk/keluar tidak dibatasi ke enum.
- `exampleController` membocorkan `error.message`.
- Tidak ada malformed JSON handler.
- Tidak ada startup database health check.
- `APP_TIMEZONE` dipakai tapi belum ada di `.env.example`.
- `barang_keluar.status` default database terbaca `L`, sedangkan script migrasi komentar menyatakan target default `C`; perlu verifikasi schema final.

## Technical Debt

- Service berisi query dan business logic sekaligus.
- Banyak validator memakai pola berbeda.
- Response error tidak menyediakan detail field validation.
- Tidak ada test coverage untuk business rule kritis.
- Query raw SQL tersebar dan belum dikonsolidasikan.
- Tidak ada typed contract untuk response.
- Tidak ada pagination di master barang dan stok barang.
- Tidak ada consistent ID validation di semua detail/update/delete endpoint.

# 13. Future Roadmap

Roadmap backend yang disarankan:

1. Tambahkan migration system resmi.
2. Commit schema SQL lengkap termasuk view `v_stok_barang`.
3. Tambahkan seed roles `SUPER ADMIN` dan `ADMIN`.
4. Tambahkan `.env.example` untuk `APP_TIMEZONE`.
5. Tambahkan central error handler Express 5.
6. Tambahkan logger request dan error.
7. Tambahkan OpenAPI/Swagger docs.
8. Tambahkan automated tests untuk auth, user, stok, barang masuk, barang keluar, dan dashboard.
9. Refactor repository layer agar service fokus business logic.
10. Bungkus operasi stock-sensitive dengan transaction dan locking.
11. Putuskan rumus final `sisa_bayar`.
12. Tambahkan validasi barang masuk setara dengan barang keluar.
13. Tambahkan validasi master barang yang lebih kuat.
14. Tangani FK conflict sebagai `409`, bukan generic `500`.
15. Implementasikan audit trail.
16. Pertimbangkan soft delete untuk master dan transaksi.
17. Tambahkan created_by/updated_by pada transaksi.
18. Tambahkan refresh token atau strategi token renewal.
19. Tambahkan revoke/logout token bila diperlukan.
20. Tambahkan rate limit endpoint login.
21. Tambahkan CORS whitelist production.
22. Tambahkan health check database.
23. Tambahkan dashboard finance barang masuk jika dibutuhkan.
24. Tambahkan pagination untuk master barang dan stok.
25. Tambahkan filter date range pada barang masuk/keluar selain bulan/tahun.
26. Tambahkan endpoint laporan/export bila frontend membutuhkan.
27. Tambahkan history/mutasi stok eksplisit jika audit stok harus lengkap.
28. Tambahkan role/permission granular bila operasi perlu dibedakan lebih detail.

# 14. Important Decisions

## Mengapa Memakai Express

Express dipakai karena ringan, populer, mudah dipahami, dan cocok untuk REST API sederhana sampai menengah. Struktur saat ini menunjukkan tujuan pragmatic: route-controller-service, raw SQL, dan helper response kecil. Untuk aplikasi inventory internal, Express memberi fleksibilitas tinggi tanpa overhead framework besar.

Keputusan memakai Express 5 memberi akses versi terbaru, tetapi juga berarti developer perlu berhati-hati terhadap behavior Express 5, terutama error async dan kompatibilitas middleware.

## Mengapa Struktur Folder Seperti Sekarang

Struktur folder memisahkan HTTP layer dan business/data layer:

- `routes` untuk URL.
- `controllers` untuk request/response.
- `validators` untuk validasi input.
- `services` untuk query dan business logic.
- `middleware` untuk auth dan authorization.
- `config` untuk database.
- `utils` untuk helper reusable.
- `constants` untuk role.

Struktur ini mudah dibaca oleh developer Express dan cocok untuk project yang belum terlalu besar. Kekurangannya adalah service menjadi agak gemuk karena belum ada repository layer.

## Mengapa Database Dibuat Seperti Sekarang

Database memakai master table dan transaction table yang jelas:

- `roles` dan `users` untuk auth.
- `lokasi` untuk scope data.
- `master_barang` untuk barang per lokasi.
- `master_anggota` untuk customer/anggota.
- `barang_masuk` dan `barang_keluar` untuk transaksi.
- `v_stok_barang` untuk stok hasil agregasi.

Keputusan memakai view stok membuat sistem tidak perlu menjaga kolom stok manual. Ini mengurangi risiko lupa update stok pada create/update/delete transaksi. Tradeoff-nya adalah validasi stok dan performa bergantung pada query agregasi, dan audit mutasi stok tidak tersimpan sebagai ledger terpisah.

## Mengapa Tabel Dipisah

`master_barang` dipisah dari transaksi agar data barang seperti kode, nama, satuan, lokasi, dan harga satuan tidak diulang di setiap transaksi. Transaksi hanya menyimpan referensi dan nilai historis yang diperlukan.

`master_anggota` dipisah agar transaksi keluar dapat mereferensikan anggota, tetapi tetap bisa bertahan ketika anggota dihapus karena FK `SET NULL`.

`lokasi` dipisah karena lokasi adalah konsep akses sekaligus dimensi stok. Satu user admin, satu barang, dan transaksi memiliki lokasi.

`roles` dipisah agar role user tidak hardcoded sebagai string di tabel user, walaupun konstanta aplikasi saat ini hanya dua.

`barang_masuk` dan `barang_keluar` dipisah karena memiliki field dan aturan berbeda. Barang masuk memakai `harga_satuan`, `total_harga`, dan status `LUNAS/PIUTANG/LOAN`. Barang keluar memakai `harga_jual`, `harga_modal`, `margin`, dan status `C/L`.

## Mengapa Endpoint Dibuat Seperti Sekarang

Endpoint memakai resource REST-style:

- `/api/master-barang`
- `/api/master-anggota`
- `/api/lokasi`
- `/api/barang-masuk`
- `/api/barang-keluar`
- `/api/stok-barang`
- `/api/dashboard`
- `/api/users`
- `/api/roles`
- `/api/auth`

CRUD memakai method umum:

- `GET /resource`
- `GET /resource/:id`
- `POST /resource`
- `PUT /resource/:id`
- `DELETE /resource/:id`

Partial action user memakai `PATCH`:

- `PATCH /api/users/:id/status`
- `PATCH /api/users/:id/password`

Dropdown memakai subresource:

- `/api/lokasi/dropdown`
- `/api/roles/dropdown`

Stok dibuat read-only karena stok berasal dari transaksi, bukan data yang diedit langsung.

Dashboard dibuat sebagai single aggregate endpoint karena frontend kemungkinan membutuhkan satu payload lengkap untuk kartu summary, chart, list recent, dan ringkasan lokasi.

## Keputusan Scope Lokasi

Scope lokasi ditempatkan di middleware, bukan disalin manual di setiap controller. Ini keputusan bagus karena:

- Role user divalidasi sekali.
- Controller cukup membaca `req.locationScope`.
- Service bisa menerima `scope` dan menambahkan kondisi SQL.

Namun penerapannya masih perlu dijaga konsisten. Master anggota tidak scoped lokasi; jika domain menganggap anggota global koperasi, ini benar. Jika anggota seharusnya per lokasi, perlu perubahan skema dan endpoint.

## Keputusan Status Barang Keluar

Barang keluar sekarang memakai status `C` dan `L`. Ada script migrasi yang menunjukkan perubahan dari legacy `LUNAS/PIUTANG/LOAN` ke `C/L`.

Keputusan ini menyederhanakan status barang keluar, tetapi perlu dokumentasi domain:

- Apakah `C` berarti cash?
- Apakah `L` berarti loan?
- Apakah piutang dan loan sengaja disatukan?

AI berikutnya harus menjaga kompatibilitas frontend dan database enum saat mengubah status.

## Keputusan Tidak Memakai Transaction

Saat ini backend belum memakai transaction database. Ini mungkin keputusan awal agar development cepat dan kode sederhana. Untuk data inventory, terutama stok, keputusan ini sebaiknya ditinjau ulang karena race condition dapat memengaruhi akurasi stok.

Prioritas perbaikan tertinggi adalah operasi barang keluar create/update:

- Validasi stok.
- Insert/update transaksi.
- Refetch detail.

Semua sebaiknya berada dalam transaction dengan lock atau strategi konsistensi yang jelas.

## Keputusan Hard Delete

Semua delete saat ini hard delete. Ini sederhana, tetapi memiliki konsekuensi:

- History bisa hilang.
- Audit sulit.
- Stok historis berubah ketika transaksi dihapus.
- FK conflict perlu ditangani baik.

Untuk aplikasi inventory, soft delete atau audit table biasanya lebih aman.

## Keputusan Response Sederhana

Response helper sengaja sederhana:

- `success`
- `message`
- `data`

Error juga sederhana:

- `success`
- `message`

Ini mudah dikonsumsi frontend, tetapi kurang kaya untuk debugging dan validasi form. Jika frontend butuh highlight field error, format perlu diperluas.

## Keputusan Dashboard Periode

Dashboard mendukung `today`, `this_week`, `this_month`, `this_year`, dan `custom`. Tanggal dihitung memakai timezone aplikasi. Untuk `this_week`, minggu dimulai Senin dan selesai Minggu.

Trend dashboard:

- Group by bulan untuk `this_year`.
- Group by bulan untuk custom range lebih dari 31 hari.
- Group by hari untuk range pendek.

Ini adalah keputusan praktis agar data chart tidak terlalu panjang.

## Ringkasan untuk AI Berikutnya

Jika AI berikutnya ingin melanjutkan development, jalur paling aman:

1. Jangan ubah rumus `sisa_bayar` tanpa konfirmasi domain.
2. Jangan membuat stok fisik baru sebelum memahami `v_stok_barang`.
3. Pertahankan `locationScope` untuk semua data yang terkait lokasi.
4. Perlakukan `master_anggota` sebagai global kecuali user meminta per lokasi.
5. Tambahkan tests sebelum refactor besar.
6. Jika membuat repository layer, pindahkan SQL pelan-pelan tanpa mengubah response contract.
7. Jika memperbaiki stok race condition, mulai dari `barangKeluarService`.
8. Jika memperbaiki error handling, tetap jaga format `{ success, message, data }` agar frontend tidak rusak.
