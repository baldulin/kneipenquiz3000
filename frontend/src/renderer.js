import { useRef, useState, useEffect } from "react";


const classJoiner = (d) => Object.entries(d).filter(([k, v]) => v).map(([k, v]) => k).join(" ");


export const TeamBaseRenderer = ({ title, answers, state, actions, currentAnswer }) => (
  <div className="Question Base">
    <div className="Title">{title}</div>
    <div className="Answers">
      {answers.map(({ letter, text, correct }, index) => (
        <div
          className={classJoiner({
              "Answer": true,
              "Answer--correct": state.question_state === "ANSWER" && correct,
              "Answer--selected": (state.question_state === "ASK" || state.question_state === "SCORE") && currentAnswer === index,
              "Answer--wrong": state.question_state === "ANSWER" && currentAnswer == index && !correct,
            })
          }
          key={index}
          onClick={() => {
            if(state.question_state === "ASK"){
              actions.guess(index);
            }
          }}
        >
          {letter ? <span className="Letter">{letter})</span> : ""}
          {text}
        </div>
      ))}
    </div>
  </div>
);


// TODO here the input lag of server and return makes currentAnswer weird!
// currently its decoupled but maybe I need to couple it
export const TeamGuessRenderer = ({ title, answers, state, actions, currentAnswer, min, max, start}) => {
  const [value, setValue] = useState(start);
  const letter = answers?.[0]?.letter;
  const text = answers?.[0]?.text;

  return (
    <div className="Question Guess">
      <div className="Title">{title}</div>
      <div className="Answers">
        {state?.question_state === "ANSWER"
          ? (<>
            <div className="Answer Answer--correct">
                {letter ? <span className="Letter">{letter})</span> : ""}
                {text}
            </div>
            {(currentAnswer !== text) && <div className="Answer">
              {(currentAnswer === "" || currentAnswer === null || currentAnswer === undefined) ? "-" : currentAnswer}
            </div>}
          </>) : (state?.question_state === "SCORE")
            ? (
            <div className="Answer">
              {currentAnswer}
            </div>
            ) : (
            <div className="Answer">
              <input type="text" value={value} disabled/>
              <input type="range" min={min} max={max} value={value} onChange={(ev) => {setValue(ev.target.value); actions.guess(ev.target.value);}}/>
            </div>
        )}
      </div>
    </div>
  );
};

export const TeamImageRenderer = ({ title, answers, state, image }) => {
  const { letter, text } = answers[0];

  return (
    <div className="Question Image">
      <div className="Title">{title}</div>
      <img src={image}/>
      <div className="Answers">
        {state.question_state === "ANSWER" && (
          <div className="Answer Answer--correct">
            {letter ? <span className="Letter">{letter})</span> : ""}
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export const TeamSilentVideoRenderer = ({ title, video, correct, state }) => {
  const videoRef = useRef();
  const playingState = useRef("start");

  useEffect(() => {
    const node = videoRef.current;
    if (state?.question_state === "PLAY") {
      //node.requestFullscreen();
      node.currentTime = 0;
      node.volume = 0.0;
      node.play();
    } else if (state.question_state === "STOP") {
      node.pause();
    } else if (state.question_state === "ANSWER") {
      node.currentTime = 0;
      node.volume = 1.0;
      node.play();
    }
  }, [state.question_state, videoRef]);

  return (
    <div className="Question SilentVideo">
      {state.question_state === "ANSWER" && (
        <div className="Answers">
          <div className="Answer Answer--correct">{correct}</div>
        </div>
      )}
      <div className="Video">
        <video ref={videoRef} src={video} />
      </div>
    </div>
  );
};


export const BaseRenderer = ({ title, answers, state }) => (
  <div className="Question Base">
    <div className="Title">{title}</div>
    <div className="Answers">
      {answers.map(({ letter, text, correct }, index) => (
        <div
          className={
            "Answer" +
            (state.question_state === "ANSWER" && correct
              ? " Answer--correct"
              : "")
          }
          key={index}
        >
          {letter ? <span className="Letter">{letter})</span> : ""}
          {text}
        </div>
      ))}
    </div>
  </div>
);


export const GuessRenderer = ({ title, answers, state }) => {
  const { letter, text } = answers[0];

  return (
    <div className="Question Guess">
      <div className="Title">{title}</div>
      <div className="Answers">
        {state?.question_state === "ANSWER" && (
          <div className="Answer Answer--correct">
            {letter ? <span className="Letter">{letter})</span> : ""}
            {text}
          </div>
        )}
      </div>
    </div>
  );
};


export const ImageRenderer = ({ title, answers, state, image }) => {
  const { letter, text } = answers[0];

  return (
    <div className="Question Image">
      <div className="Title">{title}</div>
      <img src={image}/>
      <div className="Answers">
        {state.question_state === "ANSWER" && (
          <div className="Answer Answer--correct">
            {letter ? <span className="Letter">{letter})</span> : ""}
            {text}
          </div>
        )}
      </div>
    </div>
  );
};


export const SilentVideoRenderer = ({ title, video, correct, state }) => {
  const videoRef = useRef();
  const playingState = useRef("start");

  useEffect(() => {
    const node = videoRef.current;
    if (state?.question_state === "PLAY") {
      //node.requestFullscreen();
      node.currentTime = 0;
      node.volume = 0.0;
      node.play();
    } else if (state.question_state === "STOP") {
      node.pause();
    } else if (state.question_state === "ANSWER") {
      node.currentTime = 0;
      node.volume = 1.0;
      node.play();
    }
  }, [state.question_state, videoRef]);

  return (
    <div className="Question SilentVideo">
      {state.question_state === "ANSWER" && (
        <div className="Answers">
          <div className="Answer Answer--correct">{correct}</div>
        </div>
      )}
      <div className="Video">
        <video ref={videoRef} src={video} />
      </div>
    </div>
  );
};


export const BaseActions = ({ state, actions, questionIndex, blockIndex, isCurrentQuestion }) => (
  <div className="Actions">
    {!isCurrentQuestion && state.game_state === "PLAY" && (state.question_state === "ANSWER" || !state.question_state) && <button
      className="Button"
      onClick={() => actions.show_question([blockIndex, questionIndex])}
    >
      Show
    </button>}
  </div>
);


export const ItemAnswerRenderer = ({gameMasterData, answer}) => {
  const renderer = gameMasterData?.question_data?.renderer;
  if(renderer === "guess"){
    return answer;
  }
  else if(renderer === "base"){
    return gameMasterData.question_data.answers[answer]?.text;
  }
  return answer;
}

export const BaseTeamRenderer = ({gameMasterData, actions}) => {
  const [scores, setScores] = useState({});
  const teams = Object.keys(gameMasterData?.emotion_data || {});
  const isScoring = gameMasterData.question_state === "SCORE";
  // TODO fix indexing
  const blockIndex = gameMasterData.current_question_index?.[0] ? gameMasterData.current_question_index[0]: 0;
  const blockLength = gameMasterData.questions.blocks.length
  const questionIndex = gameMasterData.current_question_index?.[1] ? gameMasterData.current_question_index[1]: 0;
  const questionLength = gameMasterData.questions.blocks?.[blockIndex]?.questions?.length
  const hasNextQuestion = !(blockIndex + 1 >= blockLength && questionIndex + 1 >= questionLength);

  // TODO this is awkward
  let correctAnswer = gameMasterData.question_data?.answers?.find((answer) => answer.correct)?.text;
  if(gameMasterData.question_data?.answers?.length === 1){
    correctAnswer = gameMasterData.question_data.answers[0].text;
  }
  if(gameMasterData.question_data?.correct){
    correctAnswer = gameMasterData.question_data.correct;
  }

  useEffect(() => {
    setScores(gameMasterData.current_answer_score_data);
  }, [isScoring]);

  return <div className="Game">
      <div className="Title">
        <span className="Title">State</span>
        <span className="Title">
          Block {blockIndex + 1}/{blockLength}
        </span>
        <span className="Title">
          Question {questionIndex + 1}/{questionLength}
        </span>
        {isScoring &&
          <button type="button" className="Button Button--answer" onClick={() => actions.show_answer(scores)}>
            Answer
          </button>
        }
        {!isScoring && gameMasterData.question_state === "ASK" &&
            <button
              className="Button"
              onClick={() => actions.score_answer()}
            >
              Score
            </button>
        }
        {!isScoring && hasNextQuestion && (gameMasterData.question_state === "ANSWER" || !gameMasterData.question_state) &&
            <button
              className="Button"
              onClick={() => actions.ask_next_question()}
            >
              Nächste Frage
            </button>
        }
      </div>
      <div className="BlockChildren">
        {gameMasterData.question_data && <>
          <div className="Question">
            {gameMasterData.question_data.title}
          </div>
          <div className="Answer" style={{marginBottom:"20px"}}>
            Antwort: {correctAnswer}
          </div>
        </>
        }
      </div>
      <div className="BlockChildren">
          {teams.map((team) => (
            <div
              className="Question Base"
            >
              <span className="Title">{team}</span>
              {isScoring
                ? <input
                    type="text"
                    value={scores?.[team]}
                    autocomplete="off"
                    onChange={(ev) => setScores((oldState) => ({...oldState, [team]: ev.target.value}))}
                  />
                : ""
              }
              <span className="Type"><ItemAnswerRenderer gameMasterData={gameMasterData} answer={gameMasterData.guess_data?.[team]}/></span>
              <span className="Type">{gameMasterData.emotion_data?.[team]}</span>
              <span className="Type">{gameMasterData.score_data?.[team]}</span>
          </div>
          ))}
      </div>
    </div>
}


export const BaseListRenderer = ({
  blockIndex,
  questionIndex,
  title,
  answers,
  actions,
  state,
}) => {
  const isCurrent = (state?.current_question_index?.[0] === blockIndex && state?.current_question_index?.[1] === questionIndex);

  return <div
    className={
      "Question Base" +
        (isCurrent
        ? " Question--current"
        : "")
    }
  >
    <span className="Title">{title}</span>
    <span className="Type">Base</span>
    <BaseActions
      state={state}
      actions={actions}
      questionIndex={questionIndex}
      blockIndex={blockIndex}
      isCurrentQuestion={isCurrent}
    />
  </div>
};


export const SilentVideoActions = ({ state, actions, questionIndex, blockIndex }) => (
  <div className="Actions">
    <button
      className="Button"
      onClick={() => actions.show_question([blockIndex, questionIndex])}
    >
      Show
    </button>
    {state.question_state === "PLAY" || state.question_state === "ANSWER" ? (
      <button
        className="Button"
        onClick={() => actions.set_screen_state("PLAY_STOP")}
      >
        Stop
      </button>
    ) : (
      <button
        className="Button"
        onClick={() => actions.set_screen_state("PLAY")}
      >
        Play
      </button>
    )}
    <button
      className="Button Button--showanswer"
      onClick={() => actions.show_answer()}
    >
      Show Answer
    </button>
  </div>
);


export const SilentVideoListRenderer = ({
  blockIndex,
  questionIndex,
  title,
  video,
  correct,
  actions,
  state,
}) => (
  <div
    className={
      "Question Base" +
      (state?.current_question_index?.[0] === blockIndex && state?.current_question_index?.[1] === questionIndex
        ? " Question--current"
        : "")
    }
  >
    <span className="Title">{title}</span>
    <span className="Type">Base</span>
    <SilentVideoActions
      state={state}
      actions={actions}
      questionIndex={questionIndex}
      blockIndex={blockIndex}
    />
  </div>
);


export const screenRenderers = {
  base: BaseRenderer,
  guess: GuessRenderer,
  image: ImageRenderer,
  silentVideo: SilentVideoRenderer,
};


export const teamRenderers = {
  base: TeamBaseRenderer,
  guess: TeamGuessRenderer,
  image: TeamImageRenderer,
  silentVideo: TeamSilentVideoRenderer,
};


export const listRenderers = {
  base: BaseListRenderer,
  guess: BaseListRenderer,
  image: BaseListRenderer,
  silentVideo: SilentVideoListRenderer,
};


export const titleRenderers = {
  base: BaseActions,
  guess: BaseActions,
  image: BaseListRenderer,
  silentVideo: SilentVideoActions,
};


export const renderersByType = {
  list: listRenderers,
  title: titleRenderers,
  screen: screenRenderers,
  team: teamRenderers,
};


export const QuestionRenderer = ({
  type,
  question,
  currentAnswer,
  state,
  actions,
  questionIndex,
  blockIndex,
}) => {
  const Renderer = renderersByType[type][question.renderer];

  if (Renderer) {
    return (
      <Renderer
        {...question}
        questionIndex={questionIndex}
        blockIndex={blockIndex}
        state={state}
        actions={actions}
        currentAnswer={currentAnswer}
      />
    );
  }
  return null;
};
