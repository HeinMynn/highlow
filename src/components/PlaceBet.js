import {
  Alert,
  Button,
  Container,
  FormControl,
  MenuItem,
  Select,
} from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { db } from "./Auth";

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
      props.gameStateChanger("entry");
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
            <Select value={bet} onChange={handleChange} label="Bet Here">
              <MenuItem value={100}>$100</MenuItem>
              <MenuItem value={1000}>$1,000</MenuItem>
              <MenuItem value={10000}>$10,000</MenuItem>
              <MenuItem value={100000}>$100,000</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <Button type="submit" name="Bet" variant="outlined">
              Play
            </Button>
          </FormControl>
        </form>
      </Container>
    </div>
  );
}

export default PlaceBet;
