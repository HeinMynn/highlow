import { useEffect, useState } from "react";
import axios from "axios";
import {
  FormControl,
  Button,
  Alert,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from "@mui/material";
import { updateDoc, doc, onSnapshot } from "firebase/firestore";
import { Box, Container } from "@mui/system";
import { useLocation, useNavigate } from "react-router-dom";
import { analytics } from "../components/Firebase";
import { db } from "../components/Auth";
import { logEvent } from "firebase/analytics";
import Stats from "../components/Stats";
import useTimer from "../hooks/useTimer"; // Import the custom hook

function Play(props) {
  const initialBalance = 10000; // Initial balance hardcoded as per requirement

  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawnCard, setDrawnCard] = useState([]);
  const [success, setSuccess] = useState(false);
  const [guess, setGuess] = useState(null);
  const [points, setPoints] = useState(0);
  const [gameStatus, setGameStatus] = useState("start");

  const navigate = useNavigate();
  const location = useLocation();
  const [betMoney, setBetMoney] = useState(
    location.state.betMoney || localStorage.getItem("betMoney")
  );
  const [current, setCurrent] = useState(
    location.state.betMoney || localStorage.getItem("current")
  );
  const [balance, setBalance] = useState(
    location.state.balance || localStorage.getItem("balance") || initialBalance
  );
  const [id, setId] = useState(location.state.id || localStorage.getItem("id"));
  const [errorMsg, setErrorMsg] = useState(false);

  // Use the custom hook
  const { balance: timerBalance, time, isRunning } = useTimer(id);

  useEffect(() => {
    setBalance(timerBalance);
  }, [timerBalance]);

  const balanceDocRef = doc(db, "users", id);

  // Load state from local storage
  useEffect(() => {
    const savedState = JSON.parse(localStorage.getItem("gameState"));
    if (savedState) {
      setDeck(savedState.deck);
      setDrawnCard(savedState.drawnCard);
      setSuccess(savedState.success);
      setGuess(savedState.guess);
      setPoints(savedState.points);
      setGameStatus(savedState.gameStatus);
      setCurrent(savedState.current);
      setBalance(savedState.balance);
      setId(savedState.id);
      setBetMoney(savedState.betMoney);
    }
  }, []);

  // Sync Firestore balance with local state
  useEffect(() => {
    const unsubscribe = onSnapshot(balanceDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBalance(data.balance);
      }
    });
    return () => unsubscribe();
  }, [balanceDocRef]);

  // Save state to local storage when it changes
  useEffect(() => {
    localStorage.setItem(
      "gameState",
      JSON.stringify({
        deck,
        drawnCard,
        success,
        guess,
        points,
        gameStatus,
        current,
        balance,
        id,
        betMoney,
      })
    );
  }, [
    deck,
    drawnCard,
    success,
    guess,
    points,
    gameStatus,
    current,
    balance,
    id,
    betMoney,
  ]);

  const drawCard = async (deckId) => {
    const { data } = await axios.get(
      `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`
    );
    setLoading(false);
    setSuccess(data.success);
    setDrawnCard((prevDrawnCards) => [...prevDrawnCards, ...data.cards]);
  };

  useEffect(() => {
    if (gameStatus === "start") {
      logEvent(analytics, "start_game");
      axios
        .get("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1")
        .then((res) => {
          setDeck(res.data.deck_id);
          drawCard(res.data.deck_id);
        });
    }
    //eslint-disable-next-line
  }, [gameStatus]);

  const handleChange = (e) => {
    setGuess(e.target.value);
  };

  const handleNext = async (e) => {
    setLoading(true);
    setSuccess(false);
    setDrawnCard([]);
    setGuess(null);
    if (e.target.value === "over") {
      if (parseInt(balance) > betMoney) {
        setGameStatus("start");
        try {
          await updateDoc(balanceDocRef, {
            balance: parseInt(balance) - parseInt(betMoney),
          });
        } catch (err) {
          alert(err);
        }
        localStorage.setItem("balance", parseInt(balance) - parseInt(betMoney));
        setBalance(parseInt(balance) - parseInt(betMoney));
        setCurrent(betMoney);
      } else {
        setLoading("false");
        setGameStatus("over");
        setErrorMsg("true");
      }
    } else {
      setGameStatus("start");
    }
    console.log(e.target.value);
    // drawCard(deck);
  };

  const handleClaim = async (e) => {
    var claim = e.target.value;
    if (claim === "claimhalf") {
      setCurrent(current / 2);
    }
    localStorage.setItem("balance", parseInt(balance) + current);
    try {
      await updateDoc(balanceDocRef, {
        balance: parseInt(balance) + current,
      });
    } catch (err) {
      alert(err);
    }
    setBalance(parseInt(balance) + current);
    setCurrent(0);
    setPoints(0);
    setGameStatus("won");
  };

  const handleBet = (e) => {
    navigate("/", { state: { id: 2, betMoney: betMoney } });
  };

  const handleGuess = (e) => {
    e.preventDefault();
    guessCheck(guess);
  };

  if (drawnCard.length > 0) {
    if (
      drawnCard[1].value === "KING" ||
      drawnCard[1].value === "QUEEN" ||
      drawnCard[1].value === "JACK"
    ) {
      drawnCard[1].value = 10;
    } else if (drawnCard[1].value === "ACE") {
      drawnCard[1].value = 11;
    }

    if (
      drawnCard[0].value === "KING" ||
      drawnCard[0].value === "QUEEN" ||
      drawnCard[0].value === "JACK"
    ) {
      drawnCard[0].value = 10;
    } else if (drawnCard[0].value === "ACE") {
      drawnCard[0].value = 11;
    }
  }

  function guessCheck(guessing) {
    if (
      (guessing === "High" &&
        parseInt(drawnCard[1].value) > parseInt(drawnCard[0].value)) ||
      (guessing === "Low" &&
        parseInt(drawnCard[1].value) < parseInt(drawnCard[0].value))
    ) {
      setPoints(points + 1);
      setGameStatus("continue");
      setCurrent(parseInt(current) + (parseInt(current) / 100) * 20);
      logEvent(analytics, "goal_completion", { name: "claim_money" });
    } else if (parseInt(drawnCard[1].value) === parseInt(drawnCard[0].value)) {
      setPoints(points);
      setGameStatus("draw");
    } else {
      setPoints(0);
      setGameStatus("over");
      setCurrent(betMoney);
    }
  }

  return (
    <div>
      <Container maxWidth="sm" mt={3}>
        <Grid sx={{ display: "flex", justifyContent: "space-evenly", m: 1 }}>
          <Stats name="points" value={points} />
          <Stats name="betMoney" value={betMoney} />
          <Stats name="current" value={current} />
          <Stats name="balance" value={balance} />
          {/* Display Timer component visually */}
          {isRunning && (
            <Chip
              label={`Next top-up in: ${Math.floor(time / 60)}:${
                time % 60 < 10 ? `0${time % 60}` : time % 60
              }`}
              color="primary"
            />
          )}
          <Chip label="Modifier - 20%" color="primary" />
        </Grid>
        <Grid sx={{ display: "flex", justifyContent: "space-evenly", m: 1 }}>
          {deck && gameStatus === "over" && !errorMsg && (
            <Alert severity="error">
              Sorry. Your card was {guess === "High" ? "lower" : "higher"} than
              the dealer's card. The pot has been lost.
            </Alert>
          )}
          {gameStatus === "draw" && (
            <Alert severity="info">Hmm. You Got Another Chance.</Alert>
          )}
          {gameStatus === "continue" && (
            <Alert severity="success">
              Your card was {guess}er than the dealer's card. ${current} has
              been added to the pot.
            </Alert>
          )}
          {gameStatus === "won" && (
            <Alert severity="success">
              Congratulations! You claimed the money. Your balance is ${balance}
              .
            </Alert>
          )}
        </Grid>

        <Container>
          <Grid container spacing={2}>
            {loading ? (
              <Grid item xs={12} justifyContent="center" alignitems="center">
                Shuffling
              </Grid>
            ) : (
              ""
            )}
            <Grid item xs={6}>
              <p>Dealer's Card:</p>
              {success && drawnCard.length > 0 ? (
                <Box
                  component="img"
                  alt="dealer card"
                  // src={drawnCard[0].image}
                  sx={{ width: 1 }}
                />
              ) : (
                ""
              )}
            </Grid>
            <Grid item xs={6}>
              <p>Your Card:</p>
              {success && gameStatus !== "start" && drawnCard.length > 0 ? (
                <Box
                  component="img"
                  alt="guess card"
                  // src={drawnCard[1].image}
                  sx={{ width: 1 }}
                />
              ) : (
                ""
              )}
              {success && gameStatus === "start" && drawnCard.length > 0 ? (
                <Box
                  component="img"
                  alt="guess card"
                  // src="back.jpg"
                  sx={{ width: 1 }}
                />
              ) : (
                ""
              )}
            </Grid>
          </Grid>
        </Container>
        <Container alignitems="center">
          {gameStatus === "start" ? (
            <form onSubmit={handleGuess}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl>
                    <ToggleButtonGroup
                      value={guess}
                      exclusive
                      onChange={handleChange}
                      aria-label="guess high or low"
                    >
                      <ToggleButton value="High">High</ToggleButton>
                      <ToggleButton value="Low">Low</ToggleButton>
                    </ToggleButtonGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl>
                    <Button type="submit" variant="outlined">
                      Guess
                    </Button>
                  </FormControl>
                </Grid>
              </Grid>
            </form>
          ) : (
            ""
          )}
        </Container>
        {gameStatus !== "start" && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <FormControl>
              <Button
                name="Next"
                onClick={handleNext}
                variant="contained"
                value={
                  gameStatus === "continue" || gameStatus === "draw"
                    ? "continue"
                    : "over"
                }
              >
                {gameStatus === "continue" || gameStatus === "draw"
                  ? "Continue"
                  : "Replay"}
              </Button>
            </FormControl>
            {gameStatus === "continue" || gameStatus === "draw" ? (
              <FormControl>
                <Button
                  name="Claim"
                  value="claim"
                  onClick={handleClaim}
                  variant="outlined"
                >
                  Claim the money
                </Button>
              </FormControl>
            ) : (
              <FormControl>
                <Button
                  name="change bet"
                  onClick={handleBet}
                  variant="outlined"
                >
                  Change Bet
                </Button>
              </FormControl>
            )}
          </Box>
        )}
        {gameStatus === "start" && points > 0 ? (
          <Box
            sx={{
              marginTop: "20px",
            }}
          >
            <FormControl>
              <Button
                name="Claim Half"
                value="claimhalf"
                onClick={handleClaim}
                variant="outlined"
              >
                Claim the money(Half)
              </Button>
            </FormControl>
          </Box>
        ) : (
          ""
        )}
        {errorMsg && (
          <Alert severity="error">You have no enough balance.</Alert>
        )}
      </Container>
    </div>
  );
}

export default Play;
