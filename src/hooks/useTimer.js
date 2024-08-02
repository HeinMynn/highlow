import { useState, useEffect } from "react";
import { db } from "../components/Auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
// import getServerTime from "../utils/getServerTime";

const useTimer = (userId) => {
  const balanceThreshold = parseInt(
    process.env.REACT_APP_BALANCE_THRESHOLD,
    10
  );
  const timerDuration = parseInt(process.env.REACT_APP_TIMER_DURATION, 10);
  const balanceIncrement = parseInt(
    process.env.REACT_APP_BALANCE_INCREMENT,
    10
  );

  const [time, setTime] = useState(timerDuration); // Initialize timer to timerDuration seconds
  const [isRunning, setIsRunning] = useState(false);
  const [balance, setBalance] = useState(0);
  const [counter, setCounter] = useState(0);
  const [totalRemainingTime, setTotalRemainingTime] = useState(0);
  const balanceDocRef = doc(db, "users", userId);

  useEffect(() => {
    const storedEndTime = localStorage.getItem("endTime");
    if (storedEndTime) {
      const remainingTime = Math.floor((storedEndTime - Date.now()) / 1000);
      if (remainingTime > 0) {
        setTime(remainingTime); //timer remaining time
        setIsRunning(true);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(balanceDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCounter(data.counter || 0);
        setBalance(data.balance);
        setTotalRemainingTime(data.totalTime || 0); //total time remaining in server
        if (data.balance < balanceThreshold) {
          //calculate here for the offline earning by comparing totalRemainingTime from server with current server time.
          setCounter(
            Math.ceil((balanceThreshold - data.balance) / balanceIncrement)
          );
          setTotalRemainingTime(
            Math.ceil(
              ((balanceThreshold - data.balance) * timerDuration) /
                balanceIncrement
            )
          );
          console.log(
            "Total remaining time:",
            totalRemainingTime,
            "counter:",
            counter
          );
          setIsRunning(true);
        } else {
          setIsRunning(false);
          setTime(timerDuration); // Reset timer to timerDuration if balance is sufficient
        }
      }
    });
    return () => unsubscribe();
  }, [balanceDocRef, balanceThreshold, timerDuration]);

  useEffect(() => {
    let timer;
    if (isRunning && balance < balanceThreshold) {
      const endTime = Date.now() + time * 1000;
      localStorage.setItem("endTime", endTime); // Store end time in local storage

      timer = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 0) {
            topUpBalance();
            return timerDuration; // Reset timer to timerDuration after topping up
          } else {
            return prevTime - 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, balance, balanceThreshold, timerDuration]);

  const topUpBalance = async () => {
    const newBalance = balance + balanceIncrement;
    const totalTime = Date.now() + totalRemainingTime * 1000;
    try {
      await setDoc(
        balanceDocRef,
        { balance: newBalance, counter: counter - 1, totalTime: totalTime },
        { merge: true }
      );
      console.log(`Balance updated to: ${newBalance}`); // Debugging statement
      setBalance(newBalance);
    } catch (error) {
      console.error("Error topping up balance:", error);
    }
  };

  return { balance, time, isRunning };
};

export default useTimer;
