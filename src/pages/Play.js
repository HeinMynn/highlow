import { useEffect, useState } from "react";
import {
  FormControl,
  Button,
  Alert,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from "@mui/material";
import {
  updateDoc,
  doc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { Box, Container } from "@mui/system";
import { useLocation, useNavigate } from "react-router-dom";
import { analytics } from "../components/Firebase";
import { logEvent } from "firebase/analytics";
import Stats from "../components/Stats";
import { Deck } from "../api";
import { auth, db } from "../components/Auth";
import { useAuthState } from "react-firebase-hooks/auth";
import PlaceBet from "../components/PlaceBet";

function Play(props) {
  // const storageMoney = localStorage.getItem("balance");
  const [user, loading] = useAuthState(auth);
  const [deck, setDeck] = useState(null);
  const [shuffle, setShuffle] = useState(true);
  const [drawnCard, setDrawnCard] = useState([]);
  const [success, setSuccess] = useState(false);
  const [guess, setGuess] = useState(null);
  const [points, setPoints] = useState(0);
  const [gameStatus, setGameStatus] = useState("start");

  const navigate = useNavigate();
  const location = useLocation();
  const [betMoney, setBetMoney] = useState(0);
  const [current, setCurrent] = useState(0);
  const [balance, setBalance] = useState([]);
  const [id] = useState(location.state.id);
  const [errorMsg, setErrorMsg] = useState(false);

  const fetchUserName = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const data = doc.docs[0].data();
      setBalance(data.balance);
      console.log(doc);
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };

  const balanceDocRef = doc(db, "users", id);

  async function drawCard(deck_id) {
    let cards = await Deck.draw_card(deck_id);
    setDrawnCard([...drawnCard, cards]);
    setShuffle(false);
    setSuccess(true);
    console.log(cards);
  }
  useEffect(() => {
    setCurrent(betMoney);
  }, [betMoney]);

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/");
    fetchUserName();
    if (gameStatus === "start") {
      logEvent(analytics, "start_game");
      async function fetchDeck() {
        let deck_id = await Deck.get_deck();
        console.log(deck_id);
        setDeck(deck_id);
      }
      fetchDeck();
    }
    //eslint-disable-next-line
  }, [gameStatus, user, loading, balance]);

  //draw cards
  useEffect(() => {
    if (deck !== null) {
      drawCard(deck);
    }
    //eslint-disable-next-line
  }, [deck]);
  console.log("bet", betMoney);
  console.log("current", current);
  const handleChange = (e) => {
    setGuess(e.target.value);
  };

  const handleNext = async (e) => {
    setShuffle(true);
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
        localStorage.setItem("balance", parseInt(balance) - betMoney);
        setBalance(parseInt(balance) - parseInt(betMoney));
        setCurrent(betMoney);
      } else {
        setShuffle("false");
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
      drawnCard[0].cards[1].value === "KING" ||
      drawnCard[0].cards[1].value === "QUEEN" ||
      drawnCard[0].cards[1].value === "JACK"
    ) {
      drawnCard[0].cards[1].value = 10;
    } else if (drawnCard[0].cards[1].value === "ACE") {
      drawnCard[0].cards[1].value = 11;
    }

    if (
      drawnCard[0].cards[0].value === "KING" ||
      drawnCard[0].cards[0].value === "QUEEN" ||
      drawnCard[0].cards[0].value === "JACK"
    ) {
      drawnCard[0].cards[0].value = 10;
    } else if (drawnCard[0].cards[0].value === "ACE") {
      drawnCard[0].cards[0].value = 1;
    }
  }

  function guessCheck(guessing) {
    if (
      (guessing === "High" &&
        parseInt(drawnCard[0].cards[1].value) >
          parseInt(drawnCard[0].cards[0].value)) ||
      (guessing === "Low" &&
        parseInt(drawnCard[0].cards[1].value) <
          parseInt(drawnCard[0].cards[0].value))
    ) {
      setPoints(points + 1);
      setGameStatus("continue");
      setCurrent(parseInt(current) + (parseInt(current) / 100) * 20);
      logEvent(analytics, "goal_completion", { name: "claim_money" });
    } else if (
      parseInt(drawnCard[0].cards[1].value) ===
      parseInt(drawnCard[0].cards[0].value)
    ) {
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
          <Stats name="balance" value={balance} />
          <Stats name="current" value={current} />
          <Chip label="Modifier - 20%" color="primary" />
        </Grid>
        {betMoney === 0 && (
          <PlaceBet
            id={id}
            balance={balance}
            betStateChanger={setBetMoney}
            balanceStateChanger={setBalance}
            betMoney={betMoney}
          />
        )}
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
            {shuffle ? (
              <Grid item xs={12} justifyContent="center" alignitems="center">
                Shuffling
              </Grid>
            ) : (
              ""
            )}
            <Grid item xs={6}>
              <p>Dealer's Card:</p>
              {success && drawnCard[0].cards.length > 0 ? (
                <Box
                  component="img"
                  alt="dealer card"
                  src={drawnCard[0].cards[0].image}
                  sx={{ width: 1 }}
                />
              ) : (
                ""
              )}
            </Grid>
            <Grid item xs={6}>
              <p>Your Card:</p>
              {success &&
              gameStatus !== "start" &&
              drawnCard[0].cards.length > 0 ? (
                <Box
                  component="img"
                  alt="guess card"
                  src={drawnCard[0].cards[1].image}
                  sx={{ width: 1 }}
                />
              ) : (
                ""
              )}
              {success &&
              gameStatus === "start" &&
              drawnCard[0].cards.length > 0 ? (
                <Box
                  component="img"
                  alt="guess card"
                  src="back.jpg"
                  sx={{ width: 1 }}
                />
              ) : (
                ""
              )}
            </Grid>
          </Grid>
        </Container>
        <Container alignitems="center">
          {gameStatus === "start" && betMoney > 0 ? (
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
