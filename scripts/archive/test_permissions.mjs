import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBk0b1VfUQsY69YY2ATRIQ4zWKr1pQHMJI",
  authDomain: "jy001-eb144.firebaseapp.com",
  projectId: "jy001-eb144"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Testing read reports...");
  try { await getDoc(doc(db, "reports", "TEST_DOC")); console.log("Read reports OK"); } catch (e) { console.error("Read reports failed:", e.message); }
  
  console.log("Testing write reports...");
  try { await setDoc(doc(db, "reports", "TEST_DOC"), {test: 1}); console.log("Write reports OK"); } catch (e) { console.error("Write reports failed:", e.message); }

  console.log("Testing read counters...");
  try { await getDoc(doc(db, "counters", "TEST_DOC")); console.log("Read counters OK"); } catch (e) { console.error("Read counters failed:", e.message); }

  console.log("Testing write counters...");
  try { await setDoc(doc(db, "counters", "TEST_DOC"), {test: 1}); console.log("Write counters OK"); } catch (e) { console.error("Write counters failed:", e.message); }
  
  process.exit(0);
}
run();
