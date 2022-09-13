import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
// import PlaceBet from "./Pages/PlaceBet";
import Play from "./pages/Play";
import Login from "./pages/Login";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const myTheme = createTheme({
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: "#ffffff",
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
  },
  // style radio button as button element
  components: {
    MuiToggleButton: {
      styleOverrides: {
        root: {
          color: "#ffffff",
          // margin: "10px 20px 0 0",
          padding: "5px 20px",
          // width: "max-content",
          borderStyle: "none",
          border: "1px solid !important",
          borderRadius: "10px!important",
          "&.Mui-selected": {
            backgroundColor: "#D6DBF5",
            borderStyle: "none!important",
          },
          "&:hover": {
            backgroundColor: "#D6DBF5",
          },
        },
      },
    },
  },
});

function App() {
  return (
    <Router>
      <ThemeProvider theme={myTheme}>
        <div className="App">
          <Routes>
            <Route exact path="/" element={<Login />} />
            <Route exact path="/play" element={<Play />} />
            {/* <Route exact path="/" element={<PlaceBet />} /> */}
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;
