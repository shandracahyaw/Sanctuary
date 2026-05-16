import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  enableIndexedDbPersistence, 
  doc, 
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Using initializeFirestore with experimentalForceLongPolling to handle proxy/iframe constraints
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, (firebaseConfig as any).firestoreDatabaseId);

// Persistence is now handled in initializeFirestore localCache
if (typeof window !== 'undefined') {
  // CRITICAL CONSTRAINT: Test connection on boot
  async function testConnection() {
    try {
      // Small delay to let the network stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firestore connection successful");
    } catch (error) {
      if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Could not reach'))) {
        console.error("Please check your Firebase configuration. The client is offline or unreachable.");
      } else {
        console.warn("Firestore connection test initial attempt failed, this might be normal if the doc doesn't exist yet, but connectivity should be active.");
      }
    }
  }
  testConnection();
}

export const auth = getAuth(app);
