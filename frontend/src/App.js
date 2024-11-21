import {useState} from "react";
import {LobbySeat, GameMasterSeat, TeamSeat, ScreenSeat} from "./seats";


export const App = () => {
  //const [seat, setSeat] = useState(null);
  const hash = window.location.hash;
  const seat = hash ? hash.substring(1) : "team";
  const setSeat = null;

  if(seat === null){
    return <LobbySeat setSeat={setSeat}/>
  }
  else if(seat === "gamemaster"){
    return <GameMasterSeat/>;
  }
  else if(seat === "team"){
    return <TeamSeat/>
  }
  else if(seat === "screen"){
    return <ScreenSeat/>
  }
  else{
    throw Error(`Seat "${seat} is not known`);
  }
}


export default App;
