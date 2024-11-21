import { useState, useEffect, useRef, useCallback } from "react";
import {hostName} from "./config";

const localStorageKey = "quizKey";

export const useLocalStorage = (initialState) => {
  const [state, setStateInner] = useState(initialState);

  useEffect(() => {
    const json = JSON.stringify(initialState);
    window.localStorage.setItem(localStorageKey, json);

    const listener = (event) => {
      console.log("Got event", event);

      if (event.key !== localStorageKey) return;

      const data = JSON.parse(event.newValue);
      setState(data);
    };
    window.addEventListener("storage", listener);

    return () => window.removeEventListener("storage", listener);
  }, []);

  const setState = useCallback(
    (stateValue) => {
      const newState =
        typeof stateValue === "function" ? stateValue(state) : stateValue;
      console.log("SET STATE", newState);
      const json = JSON.stringify(newState);
      window.localStorage.setItem(localStorageKey, json);
      setStateInner(newState);
    },
    [setStateInner, state],
  );
  console.log("STATE", state, setState, initialState);
  return [state, setState];
};


export const useRemoteState = (defaultState) => {
  let [state, setState] = useState(defaultState);

  useEffect(() => {
    let running = true;
    let pollingInterval = 5000;
    let gameName = "Test";

    const func = () => {
      console.log("Get Info");
      fetch(`${hostName}/api/${gameName}/`).then((response) => response.json()).then(
        (data) => {
          console.log(data);
          setState((oldData) => ({...oldData, newState: data}));
        }
      );

      if(running){
        setTimeout(func, pollingInterval);
      }
    };

    func();
    return () => running = false; 
  }, []);

  return [state, setState]
}


export const useScreen = () => {
  const [state, setState] = useState(null);

  let gameName = "Test";
  useEffect(() => {
    const timeout = 1000;
    let running = true;
    const func = () => {
        fetch(`${hostName}/api/${gameName}/`).then((response) => response.json()).then(
        (data) => {
          setState(data);
          if(running){
            setTimeout(func, timeout);
          }
        }
      );
    }
    func();
    return () => running = false;
  }, []);
  return state;
}


export const useTeam = (gameName, name) => {
  const [teamToken, setTeamToken] = useState(null);
  const [teamData, setTeamData] = useState(null);

  useEffect(() => {
    if(name?.length > 0){
      fetch(`${hostName}/api/${gameName}/join_team`, {
        method: "PUT",
        body: JSON.stringify({"name": name}),
      }).then((response) => response.json()).then(
        (data) => {
          setTeamToken(data);
        }
      );
    }
  }, [name]);

  useEffect(() => {
    if(!teamToken){
      return;
    }
    let timeout = 1000;
    let running = true;
    const func = () => {
      fetch(`${hostName}/api/${gameName}/team`, {
        headers: {"Authorization": `Bearer ${teamToken}`},
      }).then((response) => response.json()).then(
        (data) => {
          setTeamData(data);
          if(running){
            setTimeout(func, timeout);
          }
        }
      );
    };

    func();
    return () => {running = false};
  }, [teamToken]);

  const sendAction = (action) => (
    (data) => {
      console.log("action", data);
      fetch(`${hostName}/api/${gameName}/team/${action}`, {
        headers: {"Authorization": `Bearer ${teamToken}`},
        method: "PUT",
        body: JSON.stringify(data),
      }).then(console.log);
    }
  );

  const actionNames = ["show_emotion", "guess"];
  const actions = Object.fromEntries(actionNames.map((name) => [name, sendAction(name)]));

  return [teamData, actions];
}


export const useGameMaster = (password) => {
  const [gameMasterToken, setGameMasterToken] = useState(null);
  const [quizData, setQuizData] = useState(null);

  let gameName = "Test";
  useEffect(() => {
    if(password?.length > 4){
      fetch(`${hostName}/api/${gameName}/join_gamemaster`, {
        method: "PUT",
        body: JSON.stringify(password),
      }).then((response) => {
        if(response.status !== 200){
          return null;
        }
        return response.json();
      }).then(
        (data) => {
          setGameMasterToken(data);
        }
      );
    }
  }, [password]);

  useEffect(() => {
    if(gameMasterToken === null){
      return;
    }

    let gameName = "Test";
    let running = true;
    const func = () => {
      fetch(`${hostName}/api/${gameName}/gamemaster`, {
        headers: {"Authorization": `Bearer ${gameMasterToken}`},
      }).then((response) => response.json()).then(
        (data) => {
          setQuizData(data);
          if(running){
            setTimeout(func, 3000);
          }
        }
      );
    };
    func();

    return () => running = false;
  }, [gameMasterToken]);

  const sendAction = (action) => (
    (data) => (
      fetch(`${hostName}/api/${gameName}/gamemaster/${action}`, {
        headers: {"Authorization": `Bearer ${gameMasterToken}`},
        method: "PUT",
        body: JSON.stringify(data),
      }).then(console.log)
    )
  );

  const actionNames = ["ask_next_question", "show_question", "score_answer", "show_answer", "start_game", "end_game", "set_screen_state"];
  const actions = Object.fromEntries(actionNames.map((name) => [name, sendAction(name)]));

  return [quizData, actions];
}
