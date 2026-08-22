import { generate50Workers } from './src/constants/masterData.js';
import { db } from './src/firebase.js';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

async function run() {
  console.log("Fetching old workers...");
  const snap = await getDocs(collection(db, 'workers'));
  console.log(`Found ${snap.docs.length} workers to delete.`);
  for (const docSnap of snap.docs) {
    await deleteDoc(docSnap.ref);
  }
  
  console.log("Inserting new workers...");
  const newWorkers = generate50Workers();
  for (const w of newWorkers) {
    await setDoc(doc(db, 'workers', w.id), w);
  }
  console.log("Done updating workers!");
}

run().catch(console.error).then(() => process.exit(0));
