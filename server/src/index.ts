import { Firestore } from "@google-cloud/firestore"

function getCities(db) {
  return db.collection("cities");
}

async function initDb(db) {
  const cities = getCities(db);
  const promises = [];

  promises.push(
    cities.doc("SF").set({
      name: "San Francisco",
      state: "CA",
      country: "USA",
      capital: false,
      population: 860000,
      regions: ["west_coast", "norcal"]
    })
  );

  promises.push(
    cities.doc("LA").set({
      name: "Los Angeles",
      state: "CA",
      country: "USA",
      capital: false,
      population: 3900000,
      regions: ["west_coast", "socal"]
    })
  );

  promises.push(
    cities.doc("DC").set({
      name: "Washington D.C.",
      state: null,
      country: "USA",
      capital: true,
      population: 680000,
      regions: ["east_coast"]
    })
  );

  promises.push(
    cities.doc("TOK").set({
      name: "Tokyo",
      state: null,
      country: "Japan",
      capital: true,
      population: 9000000,
      regions: ["kanto", "honshu"]
    })
  );

  promises.push(
    cities.doc("BJ").set({
      name: "Beijing",
      state: null,
      country: "China",
      capital: true,
      population: 21500000,
      regions: ["jingjinji", "hebei"]
    })
  );

  await Promise.all(promises);
}

async function main() {  
  const db = new Firestore({
    host: "localhost",
    port: 1865,
    projectId: "gossage",
    ssl: false
  });

  await initDb(db);

  const cities = getCities(db);
  const query = await cities.where("state", "==", "CA").get();
  if (query.empty) {
    console.log("Empty results");
  }

  console.log("query", query);
  query.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
