const admin = require("firebase-admin");
const fs = require("fs");

// ===== Firebase 初期化 =====
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ===== 日付フォーマット（4/15(火)）=====
function formatDateJP(dateStr){
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();

  const week = ["日","月","火","水","木","金","土"];
  const w = week[d.getDay()];

  return `${m}/${day}(${w})`;
}

// ===== 色識別用マーク =====
function mark(v){
  if(v === "出社") return "R出社"; // 赤
  if(v === "在宅") return "B在宅"; // 青
  if(v === "休日") return "G休日"; // 緑
  return "-";
}

// ===== メイン処理 =====
async function run(){

  // Firestore取得
  const snap = await db.collection("calendars")
    .doc("family-calendar")
    .collection("days")
    .get();

  let data = [];

  snap.forEach(doc=>{
    data.push({date: doc.id, ...doc.data()});
  });

  // 日付順ソート
  data.sort((a,b)=>a.date.localeCompare(b.date));

  // ===== 今日から5日 =====
  const today = new Date();

  let days = [];

  for(let i=0;i<5;i++){
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");

    const key = `${yyyy}-${mm}-${dd}`;

    const found = data.find(x => x.date === key);

    days.push(found || {
      date: key,
      user1: "",
      user2: ""
    });
  }

  // ===== TXT生成（カンマ区切り）=====

  // 日付行
  let line1 = "";
  days.forEach(d=>{
    line1 += formatDateJP(d.date) + ",";
  });

  // user1行
  let line2 = "";
  days.forEach(d=>{
    line2 += mark(d.user1) + ",";
  });

  // user2行
  let line3 = "";
  days.forEach(d=>{
    line3 += mark(d.user2) + ",";
  });

  const text =
    line1 + "\n" +
    line2 + "\n" +
    line3;

  // ===== 出力 =====
  fs.writeFileSync("public/api/schedule.txt", text);

  console.log("TXT generated (5 days)");
}

run();