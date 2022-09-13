import { Box } from "@mui/material";
import React from "react";

function Stats(props) {
  return (
    <div>
      <Box sx={{ alignItems: "center" }}>
        <img src={`${props.name}.png`} alt={props.name} />
        <p>{props.value}</p>
      </Box>
    </div>
  );
}

export default Stats;
