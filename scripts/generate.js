const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// =======================
// Firebase認証（GitHub Secrets）
// =======================
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// =======================
// 出力先設定
// =======================
const dir = path.join(__dirname, "../public/api");
const filePath = path.join(dir, "schedule.txt");

// フォルダが無い場合は作成（超重要）
fs.mkdirSync(dir, { recursive: true });

// =======================
// メイン処理
// =======================
async function run() {
  try {
    const snap = await db.collection("calendars")
      .doc("family-calendar")
      .collection("days")
      .get();

    let result = [];

    snap.forEach(doc => {
      result.push({
        date: doc.id,
        ...doc.data()
      });
    });

    // 日付ソート（文字列ISO前提）
    result.sort((a, b) => a.date.localeCompare(b.date));

    // =======================
    // ★ここが重要：JSON出力
    // =======================
    const output = {
      data: result
    };

    fs.writeFileSync(
      "public/api/schedule.json",
      JSON.stringify(output)
    );

    console.log("✅ schedule JSON generated:", filePath);
    console.log("📦 items:", result.length);

  } catch (error) {
    console.error("❌ Error generating schedule:", error);
    process.exit(1);
  }
}

run();