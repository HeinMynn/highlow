import axios from "axios";

import { base_url } from "./config";

const get_deck = async () => {
  let res = await axios.get(base_url + "new/shuffle/?deck_count=1");
  return res.data.deck_id;
};

const draw_card = async (id) => {
  let res = await axios.get(base_url + id + "/draw/?count=2");
  return res.data;
};

const Deck = {
  get_deck,
  draw_card,
};
export default Deck;
