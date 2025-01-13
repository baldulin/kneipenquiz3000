import {useState} from "react";
import {useTeam, useGameMaster, useScreen} from "./hooks";
import {BaseTeamRenderer, QuestionRenderer} from "./renderer";


const gameName = "Test";


export const LobbySeat = ({setSeat}) => (
  <div className="App Lobby">
    <button
      className="Button"
      onClick={() => setSeat("gamemaster")}
      tabIndex={0}
    >
      GameMaster
    </button>
    <button
      className="Button"
      onClick={() => setSeat("team")}
      tabIndex={0}
    >
      Team
    </button>
    <button
      className="Button"
      onClick={() => setSeat("screen")}
      tabIndex={0}
    >
      Screen
    </button>
  </div>
);


export const GameMasterSeat = () => {
  const [password, setPassword] = useState("");
  const [state, actions] = useGameMaster(password);
  const quiz = state?.questions;
  const blockIndex = state?.current_question_index?.[0];

  if(!state){
    return <div className="App">
      <input type="password" value={password} onChange={(ev) => setPassword(ev.target.value)}/>
    </div>
  }

  return <div className="App">
    <div className="Generel">
      <span className="Title">Quiz: {state.name} [{state.game_state}, {state.question_state}] Team: {state.team_count}</span>
      <div className="Actions">
        {state.game_state === "INIT"
           && <button
            className="Button"
            onClick={() => actions.start_game()}
            tabIndex={0}
          >
             Start
          </button>
        }
        {state.game_state === "PLAY"
           && <button
            className="Button"
            onClick={() => actions.end_game()}
            tabIndex={0}
          >
             Stop
          </button>
        }
        {state.game_state === "END"
           && <button
            className="Button"
            onClick={() => actions.reset_game()}
            tabIndex={0}
          >
             Reset
          </button>
        }
      </div>
    </div>
    <BaseTeamRenderer gameMasterData={state} actions={actions}/>
    <div className="Question List">
      {quiz.blocks.map(({ questions, startTitle }, i) => (
        <div
          className={
            "Block" +
            (blockIndex === i ? " Block--current" : "")
          }
          key={blockIndex}
        >
          <div className="BlockTitle">
            Block {i + 1}
            {startTitle ? "- " + startTitle: ""}
          </div>
          <div className="BlockChildren">
            {questions.map((question, j) => (
              <QuestionRenderer
                type="list"
                question={question}
                questionIndex={j}
                blockIndex={i}
                state={state}
                actions={actions}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
};


const emotions = ["😀","😄","😆","😅","😂","🫠","😉","😊","😇","🥰","🤩","🥲","😛","🤗"];
export const ShowEmotions = ({showEmotion, currentEmotion}) => (
  <div className="Emotions">
    {emotions.map((emotion) => (
      <button
        type="button"
        className={emotion === currentEmotion ? "Emotion Emotion--current" : "Emotion"}
        onClick={() => {currentEmotion === emotion ? showEmotion(null) : showEmotion(emotion)}}>
          {emotion}
      </button>
    ))}
  </div>
);


export const TeamSeat = () => {
  const [preName, setPreName] = useState("");
  const [name, setName] = useState("");
  const [state, actions] = useTeam(gameName, name)

  if(!state){
    return <div className="App Login">
      <div className="Title">Kneipenquiz</div>
      <div className="Wrapper">
     <div className="Title">Team Name:</div>
      <div className="Password">
        <input type="text" value={preName} onChange={(ev) => setPreName(ev.target.value)}/>
      </div>
      <input type="button" onClick={() => setName(preName)} value="Start!"/>
      </div>
    </div>
  }

  return <div className="App Candidate">
    <div className="header">
      <span>{state.team_data.name}</span>
      &nbsp;
      <span>{state.title}: {state.game_state} {state.question_state}</span>
    </div>
    {state?.game_state === "PLAY"
      && (state?.question_state === "ASK" ||
        state?.question_state === "ANSWER" || state?.question_state === "SCORE")

        ? ( <QuestionRenderer
          type="team"
          question={state.question_data}
          state={state}
          currentAnswer={state.team_data.current_answer}
          actions={actions}
        />
    ) : ( // This is init
      <div className="Start">{state?.name}</div>
    )}
    <ShowEmotions showEmotion={actions.show_emotion} currentEmotion={state.team_data.current_emotion}/>
  </div>
};


export const ScreenSeat = () => {
  const state = useScreen();

  return <div className="App Candidate">
    {state?.game_state === "PLAY"
      && (state?.question_state === "ASK" || state?.question_state === "SCORE" ||
        state?.question_state === "ANSWER")

        ? ( <QuestionRenderer
          type="screen"
          question={state?.question_data}
          state={state}
        />
    ) : ( // This is init
      <div className="Start">{state?.name}</div>
    )}
    <div className="EmotionFooter">
      {Object.entries(state?.emotion_data || {}).map(([team, emotion]) => emotion).join("")}
    </div>
  </div>
};
