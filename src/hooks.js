import { useState, useEffect, useRef, useCallback } from "react";

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
