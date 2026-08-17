import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBk0b1VfUQsY69YY2ATRIQ4zWKr1pQHMJI",
  authDomain: "jy001-eb144.firebaseapp.com",
  projectId: "jy001-eb144",
  storageBucket: "jy001-eb144.firebasestorage.app",
  messagingSenderId: "1079897779096",
  appId: "1:1079897779096:web:6f9d2a2acdc1c8a2e2d9ed",
  measurementId: "G-LX68WLEF4R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);
