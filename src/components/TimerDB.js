import {
  getFirestore,
  query,
  getDocs,
  collection,
  where,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "./Auth";

const addNewGame = async (pot, round, bet) => {
  try {
    const [user, loading] = useAuthState(auth);
    const q = query(collection(db, "games"), where("userId", "==", user.uid));
    const docs = await getDocs(q);
    if (docs.docs.length === 0) {
      await addDoc(collection(db, "games"), {
        userId: user.uid,
        bet: bet,
        pot: pot,
        startTime: Timestamp.fromDate(new Date()),
        expireTime: Timestamp.fromDate(
          new Date().getTime() + 30 * 60 * 1000 * round
        ),
      });
    }
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

export default addNewGame;
