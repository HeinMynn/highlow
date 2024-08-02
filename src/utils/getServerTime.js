import { db } from "../components/Auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const getServerTime = async () => {
  const timeDocRef = doc(db, "serverTime", "currentTime");

  // Write the server timestamp to Firestore
  await setDoc(timeDocRef, { timestamp: serverTimestamp() });

  // Retrieve the server timestamp from Firestore
  const docSnap = await getDoc(timeDocRef);
  if (docSnap.exists()) {
    const serverTime = docSnap.data().timestamp.toMillis();
    // console.log("Server time:", serverTime);
    return serverTime;
  } else {
    console.error("Failed to retrieve server time from Firestore.");
    return Date.now(); // Fallback to local time if retrieval fails
  }
};

export default getServerTime;
