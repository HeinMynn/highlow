import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import {
  auth,
  db,
  registerWithEmailAndPassword,
  signInWithGoogle,
} from "../components/Auth";
import "../App.css";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  Alert,
  Button,
  Container,
  FormControl,
  Grid,
  TextField,
} from "@mui/material";
function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, loading] = useAuthState(auth);
  const [errMsg, setErrMsg] = useState("");
  const [docId, setDocId] = useState([]);

  const navigate = useNavigate();

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

  const register = async (e) => {
    e.preventDefault();
    let register = await registerWithEmailAndPassword(name, email, password);
    switch (register.code) {
      case "auth/email-already-in-use":
        setErrMsg("Email is already in use.");
        break;
      case "auth/invalid-email":
        setErrMsg("Invalid Email");
        break;
      case "auth/weak-password":
        setErrMsg("Please choose stronger password.");
        break;
      default:
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
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
    if (loading) return;
    if (user && docId.length > 0)
      navigate("/play", {
        state: {
          id: docId[0].id,
          balance: docId[0].data.balance,
          name: docId[0].data.name,
        },
      });
    // eslint-disable-next-line
  }, [user, loading, docId]);
  return (
    <div className="register">
      <Container
        maxWidth="sm"
        sx={{
          backgroundColor: "#dcdcdc",
          color: "black",
          textAlign: "center",
          padding: "30px",
        }}
      >
        {errMsg && <Alert severity="error">{errMsg}</Alert>}
        <form onSubmit={register}>
          <Grid container spacing={2}>
            <Grid item md={12}>
              <FormControl fullWidth>
                <TextField
                  fullWidth
                  value={name}
                  label="Full Name"
                  variant="filled"
                  onChange={handleNameChange}
                  required
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <TextField
                  className="register__textBox"
                  type="email"
                  value={email}
                  label="Email Address"
                  onChange={handleEmailChange}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <TextField
                  className="register__textBox"
                  type="password"
                  value={password}
                  label="Password"
                  onChange={handlePasswordChange}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                sx={{ backgroundColor: "black", color: "white" }}
                variant="outlined"
                size="large"
                fullWidth
                type="submit"
              >
                Register
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                sx={{ backgroundColor: "#4285f4", color: "white" }}
                variant="contained"
                size="large"
                fullWidth
                onClick={signInWithGoogle}
              >
                Register with Google
              </Button>
            </Grid>
          </Grid>
        </form>

        <Grid item sm={12} textAlign="center">
          Already have an account? <Link to="/">Login</Link> now.
        </Grid>
      </Container>
    </div>
  );
}
export default Register;
