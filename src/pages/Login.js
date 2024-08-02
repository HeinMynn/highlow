import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  auth,
  db,
  logInWithEmailAndPassword,
  signInWithGoogle,
} from "../components/Auth";
import { useAuthState } from "react-firebase-hooks/auth";
import "../App.css";
import { Button, Grid, LinearProgress, TextField } from "@mui/material";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Container } from "@mui/system";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, loading] = useAuthState(auth);
  const [docId, setDocId] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      // maybe trigger a loading screen
      return;
    }
    if (user) navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const fetchUserName = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      onSnapshot(q, (querySnapshot) => {
        setDocId(
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
          }))
        );
      });
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };

  useEffect(() => {
    if (!user) {
      // maybe trigger a loading screen
      return;
    }
    if (user) {
      fetchUserName();
      console.log(user.uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, docId]);
  useEffect(() => {
    if (user && docId.length > 0)
      navigate("/", {
        state: {
          id: docId[0].id,
          balance: docId[0].data.balance,
          name: docId[0].data.name,
        },
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, docId]);
  return (
    <div className="login">
      {loading && <LinearProgress />}
      <Container maxWidth="sm">
        <Grid
          container
          spacing={2}
          sx={{
            backgroundColor: "#dcdcdc",
            textAlign: "center",
            padding: "30px",
            color: "black",
          }}
        >
          <Grid item sm={12}>
            <TextField
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid item sm={12}>
            <TextField
              fullWidth
              required
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Grid>
          <Grid item sm={12}>
            <Button
              variant="contained"
              sx={{ backgroundColor: "black", color: "white" }}
              fullWidth
              onClick={() => logInWithEmailAndPassword(email, password)}
            >
              Login
            </Button>
          </Grid>
          <Grid item sm={12}>
            <Button
              variant="outlined"
              sx={{ backgroundColor: "#4285f4", color: "white" }}
              fullWidth
              onClick={signInWithGoogle}
            >
              Login with Google
            </Button>
          </Grid>

          <Grid item sm={12}>
            <Link to="/reset">Forgot Password</Link>
          </Grid>
          <Grid item sm={12} textAlign="center">
            Don't have an account? <Link to="/register">Register</Link> now.
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}
export default Login;
