import { db, collection, addDoc, serverTimestamp } from './firebase';

export async function recordAdminLog(
  adminId: string,
  adminEmail: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: string
) {
  try {
    await addDoc(collection(db, 'adminLogs'), {
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      details: details || '',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to record admin audit log:", err);
  }
}
