require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/db");

const SUPER_ADMIN = {
    nama: "Super Admin",
    username: "admin",
    password: "Admin123!",
};

async function createSuperAdmin() {
    let connection;

    try {
        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

        if (!Number.isInteger(saltRounds) || saltRounds < 4) {
            throw new Error("BCRYPT_SALT_ROUNDS tidak valid.");
        }

        connection = await db.getConnection();

        const [roles] = await connection.execute(
            `
        SELECT id
        FROM roles
        WHERE nama_role = ?
        LIMIT 1
      `,
            ["SUPER ADMIN"],
        );

        if (roles.length === 0) {
            throw new Error(
                'Role "SUPER ADMIN" tidak ditemukan. Pastikan tabel roles sudah memiliki role tersebut.',
            );
        }

        const idRoleSuperAdmin = roles[0].id;

        const [existingUsers] = await connection.execute(
            `
        SELECT id, username
        FROM users
        WHERE username = ?
        LIMIT 1
      `,
            [SUPER_ADMIN.username],
        );

        if (existingUsers.length > 0) {
            console.log("==========================================");
            console.log("Super Admin sudah tersedia.");
            console.log(`Username : ${SUPER_ADMIN.username}`);
            console.log("Tidak ada data yang diubah.");
            console.log("==========================================");
            return;
        }

        const passwordHash = await bcrypt.hash(
            SUPER_ADMIN.password,
            saltRounds,
        );

        await connection.execute(
            `
        INSERT INTO users (
          id_role,
          id_lokasi,
          nama,
          username,
          password_hash,
          is_active
        )
        VALUES (?, NULL, ?, ?, ?, 1)
      `,
            [
                idRoleSuperAdmin,
                SUPER_ADMIN.nama,
                SUPER_ADMIN.username,
                passwordHash,
            ],
        );

        console.log("==========================================");
        console.log("Super Admin berhasil dibuat.");
        console.log("");
        console.log(`Nama     : ${SUPER_ADMIN.nama}`);
        console.log(`Username : ${SUPER_ADMIN.username}`);
        console.log(`Password : ${SUPER_ADMIN.password}`);
        console.log("");
        console.log("Segera ganti password untuk production.");
        console.log("==========================================");
    } catch (error) {
        console.error("==========================================");
        console.error("Gagal membuat Super Admin.");
        console.error(error.message);
        console.error("==========================================");

        process.exitCode = 1;
    } finally {
        if (connection) {
            connection.release();
        }

        if (typeof db.end === "function") {
            await db.end();
        }
    }
}

createSuperAdmin();
