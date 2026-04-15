const admin = require("firebase-admin");
const fs = require("fs");

// GitHub Secretsから読み込み
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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

  const now = new Date();

  let text = "";

  result.forEach(item=>{
    const d = new Date(item.date);
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");

    text += `${mm}/${dd} ${item.user1 || "-"} / ${item.user2 || "-"}\n`;
  });

  fs.writeFileSync("public/api/schedule.txt", text);
  console.log("generated");
}

run();