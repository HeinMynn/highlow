import {
  Alert,
  Button,
  FormControl,
  InputAdornment,
  LinearProgress,
  TextField,
} from "@mui/material";
import { Container } from "@mui/system";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db, logout } from "../components/Auth";

function PlaceBet(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const storageMoney = localStorage.getItem("balance");
  const [betMoney, setBetMoney] = useState(
    location.state === null ? 0 : location.state.betMoney
  );
  const [money, setMoney] = useState(
    storageMoney === null ? "50000" : storageMoney
  );
  const [balance, setBalance] = useState([]);
  const [errorMsg, setErrorMsg] = useState(false);
  const [user, loading] = useAuthState(auth);

  function handleChange(e) {
    setBetMoney(e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (balance[0].data.balance > parseInt(betMoney)) {
      const balanceDocRef = doc(db, "users", balance[0].id);
      try {
        await updateDoc(balanceDocRef, {
          balance: balance[0].data.balance - parseInt(betMoney),
        });
        navigate("/play", {
          state: {
            id: balance[0].id,
            betMoney: betMoney,
            balance: balance[0].data.balance - parseInt(betMoney),
          },
        });
      } catch (err) {
        alert(err);
      }
    }
    if (parseInt(money) > parseInt(betMoney)) {
      setMoney(parseInt(money) - parseInt(betMoney));
      localStorage.setItem("balance", parseInt(money) - parseInt(betMoney));
    } else {
      setErrorMsg(true);
    }
  }

  useEffect(() => {
    localStorage.setItem("balance", money);
    if (loading) {
      return;
    }
    if (!user) {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [money, user, loading]);

  useEffect(() => {
    async function getUser() {
      if (user) {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        onSnapshot(q, (querySnapshot) => {
          setBalance(
            querySnapshot.docs.map((doc) => ({
              id: doc.id,
              data: doc.data(),
            }))
          );
        });
      }
    }
    getUser();
  }, [user]);
  console.log(balance);
  return (
    <div>
      {loading ? (
        <LinearProgress />
      ) : (
        <Container maxWidth="sm">
          {balance &&
            balance.map((b) => <p key={b.id}>You have ${b.data.balance} </p>)}
          {errorMsg ? (
            <Alert severity="error">Bss.You have no enough balance.</Alert>
          ) : (
            ""
          )}
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ m: 1 }} variant="standard">
              <TextField
                required
                id="standard-basic"
                value={betMoney}
                label="Bet Here"
                type="number"
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                  inputProps: { min: 1 },
                }}
              />
            </FormControl>
            <FormControl>
              <Button type="submit" name="Bet" variant="outlined">
                Play
              </Button>
            </FormControl>
            <FormControl>
              <Button onClick={logout}>Sign Out</Button>
            </FormControl>
          </form>
        </Container>
      )}
    </div>
  );
}

export default PlaceBet;
