import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
  type DocumentData,
  type QueryConstraint
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Detail: ', JSON.stringify(errInfo));
  
  // If it's a "Could not reach" or "Offline" error, we might want to suggest checking config
  if (errInfo.error.includes('Could not reach') || errInfo.error.includes('offline')) {
    console.error("CRITICAL: Firestore is unreachable. Check your project ID and database ID in firebase-applet-config.json");
  }
  
  throw new Error(JSON.stringify(errInfo));
}

// User Profile Services
export const saveUserProfile = async (userId: string, data: any) => {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, path), {
      ...data,
      updatedAt: serverTimestamp(),
      ...(data.createdAt ? {} : { createdAt: serverTimestamp() })
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserProfile = async (userId: string) => {
  const path = `users/${userId}`;
  try {
    // Try forcing fetch from server for the profile to catch connection issues early
    const docSnap = await getDocFromServer(doc(db, path)).catch(() => getDoc(doc(db, path)));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

// Course Services
export const addCourse = async (userId: string, courseData: any) => {
  const colPath = `users/${userId}/courses`;
  try {
    const newDocRef = doc(collection(db, colPath));
    await setDoc(newDocRef, {
      ...courseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
};

export const getCourses = async (userId: string) => {
  const colPath = `users/${userId}/courses`;
  try {
    const q = query(collection(db, colPath), orderBy('semester', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
};

export const updateCourse = async (userId: string, courseId: string, data: any) => {
  const path = `users/${userId}/courses/${courseId}`;
  try {
    await updateDoc(doc(db, path), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteCourse = async (userId: string, courseId: string) => {
  const path = `users/${userId}/courses/${courseId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Evaluation Services
export const addEvaluation = async (userId: string, courseId: string, evalData: any) => {
  const colPath = `users/${userId}/courses/${courseId}/evaluations`;
  try {
    const newDocRef = doc(collection(db, colPath));
    await setDoc(newDocRef, {
      ...evalData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
};

export const getEvaluations = (userId: string, courseId: string, callback: (data: any[]) => void) => {
  const colPath = `users/${userId}/courses/${courseId}/evaluations`;
  const q = query(collection(db, colPath), orderBy('session', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, colPath);
  });
};

// Grade Services
export const addGrade = async (userId: string, gradeData: any) => {
  const colPath = `users/${userId}/grades`;
  try {
    const newDocRef = doc(collection(db, colPath));
    await setDoc(newDocRef, {
      ...gradeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
};

export const getGrades = async (userId: string) => {
  const colPath = `users/${userId}/grades`;
  try {
    const q = query(collection(db, colPath), orderBy('semester', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
};

export const updateGrade = async (userId: string, gradeId: string, data: any) => {
  const path = `users/${userId}/grades/${gradeId}`;
  try {
    await updateDoc(doc(db, path), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteGrade = async (userId: string, gradeId: string) => {
  const path = `users/${userId}/grades/${gradeId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateEvaluation = async (userId: string, courseId: string, evalId: string, data: any) => {
  const path = `users/${userId}/courses/${courseId}/evaluations/${evalId}`;
  try {
    await updateDoc(doc(db, path), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteEvaluation = async (userId: string, courseId: string, evalId: string) => {
  const path = `users/${userId}/courses/${courseId}/evaluations/${evalId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};
