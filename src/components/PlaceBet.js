import {
  Alert,
  Button,
  Container,
  FormControl,
  InputAdornment,
  TextField,
} from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { db, logout } from "./Auth";

function PlaceBet(props) {
  const [bet, setBet] = useState(props.betMoney);
  const [errorMsg, setErrorMsg] = useState(false);
  let id = props.id;

  function handleChange(e) {
    setBet(e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (props.balance > parseInt(bet)) {
      props.betStateChanger(bet);
      props.balanceStateChanger(props.balance - parseInt(bet));
      const balanceDocRef = doc(db, "users", id);

      try {
        await updateDoc(balanceDocRef, {
          balance: props.balance - parseInt(bet),
        });
      } catch (err) {
        alert(err);
      }
    } else {
      setErrorMsg(true);
    }
  }
  return (
    <div>
      <Container maxWidth="sm">
        {errorMsg ? (
          <Alert severity="error">You have no enough balance.</Alert>
        ) : (
          ""
        )}
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ m: 1 }} variant="standard">
            <TextField
              required
              id="standard-basic"
              value={bet}
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
    </div>
  );
}

export default PlaceBet;
