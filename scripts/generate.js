const admin = require("firebase-admin");
const fs = require("fs");

// ===== Firebase =====
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ===== 日付フォーマット =====
function formatDateJP(dateStr){
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();

  const week = ["日","月","火","水","木","金","土"];
  const w = week[d.getDay()];

  return `${m}/${day}(${w})`;
}

// ===== 中央揃え（ここが重要）=====
function padCenter(str, len){
  str = str || "";
  const space = len - str.length;

  if(space <= 0) return str;

  const left = Math.floor(space / 2);
  const right = space - left;

  return " ".repeat(left) + str + " ".repeat(right);
}

// ===== メイン =====
async function run(){

  const snap = await db.collection("calendars")
    .doc("family-calendar")
    .collection("days")
    .get();

  let data = [];

  snap.forEach(doc=>{
    data.push({date: doc.id, ...doc.data()});
  });

  data.sort((a,b)=>a.date.localeCompare(b.date));

  // ===== 今日から5日 =====
  const now = new Date();
  const today = new Date(
    now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
  );
  today.setHours(0,0,0,0);  

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

  // ===== 幅 =====
  const labelWidth = 8;
  const colWidth   = 12;

  // ===== 日付行 =====
  let line1 = padCenter("", labelWidth);

  days.forEach(d=>{
    line1 += padCenter(formatDateJP(d.date), colWidth);
  });

  // ===== user1 =====
  let line2 = padCenter("     ", labelWidth);

  days.forEach(d=>{
    line2 += " " + padCenter(d.user1 || "-", colWidth);
  });

  // ===== user2 =====
  let line3 = padCenter("     ", labelWidth);

  days.forEach(d=>{
    line3 += " " + padCenter(d.user2 || "-", colWidth);
  });

  const text = line1 + "\n" + line2 + "\n" + line3;

  fs.writeFileSync("public/api/schedule.txt", text);

  console.log("center aligned TXT generated");
}

run();