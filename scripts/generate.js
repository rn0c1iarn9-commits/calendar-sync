const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

function formatDate(d){
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

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

  // =========================
  // 🔥 今日から5日だけ
  // =========================

  const today = new Date();

  const output = [];

  for(let i=0;i<5;i++){

    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const key = formatDate(d);

    const found = result.find(r => r.date === key);

    output.push(found || {
      date: key,
      user1: "",
      user2: ""
    });
  }

  // =========================
  // JSON出力（配列直出し）
  // =========================

  fs.writeFileSync(
    "public/api/schedule.json",
    JSON.stringify(output)
  );

  console.log("generated 5-day flat JSON");
}

run();