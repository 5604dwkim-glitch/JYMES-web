const fs = require('fs');
let code = fs.readFileSync('src/services/firestore.js', 'utf8');

const appendCode = `
// ==================== CHANGE POINTS (변동점 관리) ====================
export const addChangePoint = async (data) => {
  try {
    const docRef = await addDoc(collection(db, 'changePoints'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding change point:', error);
    throw error;
  }
};

export const fetchChangePoints = async () => {
  try {
    const q = query(collection(db, 'changePoints'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching change points:', error);
    throw error;
  }
};

export const updateChangePoint = async (id, data) => {
  try {
    const docRef = doc(db, 'changePoints', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating change point:', error);
    throw error;
  }
};

export const deleteChangePoint = async (id) => {
  try {
    const docRef = doc(db, 'changePoints', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting change point:', error);
    throw error;
  }
};
`;

if (!code.includes('addChangePoint')) {
  fs.writeFileSync('src/services/firestore.js', code + appendCode);
  console.log('firestore.js updated');
} else {
  console.log('Already updated');
}
