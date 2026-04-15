const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ===== Firebase認証 =====
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ===== 出力パス =====
const dir = path.join(__dirname, "../public/api");
const filePath = path.join(dir, "schedule.txt");

// ★重要：フォルダ作成（これが今回のバグ原因）
fs.mkdirSync(dir, { recursive: true });

async function run(){

  const snap = await db.collection("calendars")
    .doc("family-calendar")
    .collection("days")
    .get();

  let result = [];

  snap.forEach(doc=>{
    result.push({date: doc.id, ...doc.data()});
  });

  result.sort((a,b)=>a.date.localeCompare(b.date));

  let text = "";

  result.forEach(item=>{
    const d = new Date(item.date);

    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");

    text += `${mm}/${dd} ${item.user1 || "-"} / ${item.user2 || "-"}\n`;
  });

  fs.writeFileSync(filePath, text, "utf-8");

  console.log("generated:", filePath);
}

run();