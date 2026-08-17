import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { CAR_MODELS } from '../constants/masterData';

const REPORTS_COLLECTION = 'reports';

// --- Reports ---

export async function fetchReports(filters = {}) {
  try {
    let q = collection(db, REPORTS_COLLECTION);
    
    // Note: In Firestore, complex multi-field filtering is limited.
    // For a real production app, we would use proper query indexes.
    // Here we fetch all and filter client-side for simplicity and full compatibility with the legacy app's flexible search.
    const querySnapshot = await getDocs(q);
    let result = [];
    querySnapshot.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() });
    });

    if (filters.startDate) result = result.filter(r => r.date >= filters.startDate);
    if (filters.endDate) result = result.filter(r => r.date <= filters.endDate);
    if (filters.carModel && filters.carModel !== 'ALL') result = result.filter(r => r.carModel === filters.carModel);
    if (filters.processName && filters.processName !== 'ALL') result = result.filter(r => r.processName === filters.processName);
    if (filters.status && filters.status !== 'ALL') result = result.filter(r => r.status === filters.status);
    if (filters.workerName) {
      const kw = filters.workerName.toLowerCase();
      result = result.filter(r => r.workerName.toLowerCase().includes(kw));
    }
    if (filters.searchQuery) {
      const kw = filters.searchQuery.toLowerCase();
      result = result.filter(r => 
        r.id.toLowerCase().includes(kw) ||
        (r.carModel && r.carModel.toLowerCase().includes(kw)) ||
        (r.itemName && r.itemName.toLowerCase().includes(kw)) ||
        r.workerName.toLowerCase().includes(kw) ||
        (r.notes && r.notes.toLowerCase().includes(kw))
      );
    }
    
    // Sort descending by date and ID
    return result.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export async function getReportById(id) {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), where("id", "==", id));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting report:", error);
    return null;
  }
}

export async function addReport(reportData, currentCount = 0) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const seq = String(currentCount + 101).slice(-3);
    const newId = `RPT-${todayStr.replace(/-/g, '')}-${seq}`;

    const targetQty = Number(reportData.targetQty) || 0;
    const actualQty = Number(reportData.actualQty) || 0;
    const defectQty = Number(reportData.defectQty) || 0;

    const attainmentRate = targetQty > 0 ? Number(((actualQty / targetQty) * 100).toFixed(1)) : 0;
    const defectRate = actualQty > 0 ? Number(((defectQty / actualQty) * 100).toFixed(2)) : 0;

    const carModel = reportData.carModel || 'JG1';
    const carObj = CAR_MODELS.find(c => c.code === carModel);

    const newReport = {
      id: newId,
      date: reportData.date || todayStr,
      workHours: reportData.workHours || '08:00 ~ 17:00',
      shift: '주간',
      carModel: carModel,
      carModelName: carObj ? carObj.name : carModel,
      processId: reportData.processId || '',
      processName: reportData.processName || '검사포장',
      line: '1라인',
      workerId: reportData.workerId || 'EMP001',
      workerName: reportData.workerName || '장수미',
      itemCode: reportData.itemCode || '인벨트',
      itemName: reportData.itemName || '인벨트',
      targetQty,
      actualQty,
      defectQty,
      attainmentRate,
      defectRate,
      materialLots: reportData.materialLots || {},
      isLeaderForm: reportData.isLeaderForm || (reportData.workerName === '장수미'),
      formCode: 'HSC-DT-005',
      leaderFormItems: reportData.leaderFormItems || [],
      attendanceData: reportData.attendanceData || {},
      downtimeMinutes: Number(reportData.downtimeMinutes) || 0,
      downtimeReason: reportData.downtimeReason || '',
      notes: reportData.notes || '',
      status: reportData.status || '승인 대기',
      approver: '',
      approvedAt: '',
      createdAt: new Date().toLocaleString('ko-KR')
    };

    const docRef = doc(collection(db, REPORTS_COLLECTION), newId);
    await setDoc(docRef, newReport);
    return newReport;
  } catch (error) {
    console.error("Error adding report:", error);
    throw error;
  }
}

export async function updateReport(id, updatedFields) {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, id);
    // Note: We should ideally calculate updated attainmentRate if quantities changed.
    // Assuming updatedFields handles it or we recalculate.
    await updateDoc(docRef, updatedFields);
    return true;
  } catch (error) {
    console.error("Error updating report:", error);
    throw error;
  }
}

export async function deleteReport(id) {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting report:", error);
    throw error;
  }
}

export async function bulkApproveReports(ids, approverName = '관리자') {
  try {
    const batch = writeBatch(db);
    const now = new Date().toLocaleString('ko-KR');
    
    ids.forEach(id => {
      const docRef = doc(db, REPORTS_COLLECTION, id);
      batch.update(docRef, {
        status: '승인 완료',
        approver: approverName,
        approvedAt: now
      });
    });
    
    await batch.commit();
    return ids.length;
  } catch (error) {
    console.error("Error bulk approving:", error);
    throw error;
  }
}

export async function bulkDeleteReports(ids) {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, REPORTS_COLLECTION, id);
      batch.delete(docRef);
    });
    
    await batch.commit();
    return ids.length;
  } catch (error) {
    console.error("Error bulk deleting:", error);
    throw error;
  }
}
