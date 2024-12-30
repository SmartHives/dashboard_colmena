import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC6iNC-yMrLt84i0hb0XX3aa3uL0808Vgo",
  authDomain: "colmenaiot-86983.firebaseapp.com",
  databaseURL: "https://colmenaiot-86983-default-rtdb.firebaseio.com",
  projectId: "colmenaiot-86983",
  storageBucket: "colmenaiot-86983.firebasestorage.app",
  messagingSenderId: "252663183717",
  appId: "1:252663183717:web:f0523d1fed1ded3028498c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };