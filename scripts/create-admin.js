require("dotenv").config();

const bcrypt = require("bcrypt");
const readline = require("readline");
const pool = require("../src/db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function createAdmin() {
  try {
    console.log("=== Admin Oluşturma ===");

    const username = await ask("Kullanıcı adı: ");
    const password = await ask("Şifre: ");

    if (!username || !password) {
      console.log("Kullanıcı adı ve şifre boş olamaz.");
      rl.close();
      await pool.end();
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const existingAdmin = await pool.query(
      "SELECT id FROM cf_admins WHERE username = $1 LIMIT 1",
      [username]
    );

    if (existingAdmin.rows.length > 0) {
      await pool.query(
        "UPDATE cf_admins SET password_hash = $1 WHERE username = $2",
        [passwordHash, username]
      );

      console.log(`"${username}" kullanıcısının şifresi güncellendi.`);
    } else {
      await pool.query(
        "INSERT INTO cf_admins (username, password_hash) VALUES ($1, $2)",
        [username, passwordHash]
      );

      console.log(`"${username}" kullanıcısı oluşturuldu.`);
    }

    console.log("İşlem başarılı.");
  } catch (error) {
    console.error("Admin oluşturma hatası:", error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();