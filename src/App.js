import { useRef, useState, useEffect } from "react";
import data from "./data.json";
import { useLocalStorage } from "./hooks";

const BaseRenderer = ({ title, answers, state }) => (
  <div className="Question Base">
    <div className="Title">{title}</div>
    <div className="Answers">
      {answers.map(({ letter, text, correct }, index) => (
        <div
          className={
            "Answer" +
            (state.questionState === "answer" && correct
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

const GuessRenderer = ({ title, answers, state }) => {
  const { letter, text } = answers[0];

  return (
    <div className="Question Guess">
      <div className="Title">{title}</div>
      <div className="Answers">
        {state.questionState === "answer" && (
          <div className="Answer Answer--correct">
            {letter ? <span className="Letter">{letter})</span> : ""}
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

const ImageRenderer = ({ title, answers, state, image }) => {
  const { letter, text } = answers[0];

  return (
    <div className="Question Image">
      <div className="Title">{title}</div>
      <img src={image}/>
      <div className="Answers">
        {state.questionState === "answer" && (
          <div className="Answer Answer--correct">
            {letter ? <span className="Letter">{letter})</span> : ""}
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

const SilentVideoRenderer = ({ title, video, correct, state }) => {
  const videoRef = useRef();
  const playingState = useRef("start");

  useEffect(() => {
    const node = videoRef.current;
    if (state.questionState === "play") {
      //node.requestFullscreen();
      node.currentTime = 0;
      node.volume = 0.0;
      node.play();
    } else if (state.questionState === "stop") {
      node.pause();
    } else if (state.questionState === "answer") {
      node.currentTime = 0;
      node.volume = 1.0;
      node.play();
    }
  }, [state.questionState, videoRef]);

  return (
    <div className="Question SilentVideo">
      {state.questionState === "answer" && (
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

const BaseActions = ({ state, setState, questionIndex, blockIndex }) => (
  <div className="Actions">
    <button
      className="Button"
      onClick={() =>
        setState((oldState) => ({
          ...oldState,
          blockIndex,
          questionIndex,
          questionState: "ask",
        }))
      }
    >
      Show
    </button>
    <button
      className="Button Button--showanswer"
      onClick={() =>
        setState((oldState) => ({
          ...oldState,
          questionState: "answer",
          questionIndex,
          blockIndex,
        }))
      }
    >
      Show Answer
    </button>
  </div>
);

const BaseListRenderer = ({
  blockIndex,
  questionIndex,
  title,
  answers,
  setState,
  state,
}) => (
  <div
    className={
      "Question Base" +
      (state.blockIndex === blockIndex && state.questionIndex === questionIndex
        ? " Question--current"
        : "")
    }
  >
    <span className="Title">{title}</span>
    <span className="Type">Base</span>
    <BaseActions
      state={state}
      setState={setState}
      questionIndex={questionIndex}
      blockIndex={blockIndex}
    />
  </div>
);

const SilentVideoActions = ({ state, setState, questionIndex, blockIndex }) => (
  <div className="Actions">
    <button
      className="Button"
      onClick={() =>
        setState((oldState) => ({
          ...oldState,
          questionIndex,
          blockIndex,
          questionState: "ask",
        }))
      }
    >
      Show
    </button>
    {state.questionState === "play" || state.questionState === "answer" ? (
      <button
        className="Button"
        onClick={() =>
          setState((oldState) => ({
            ...oldState,
            questionIndex,
            blockIndex,
            questionState: "stop",
          }))
        }
      >
        Stop
      </button>
    ) : (
      <button
        className="Button"
        onClick={() =>
          setState((oldState) => ({
            ...oldState,
            questionState: "play",
            questionIndex,
            blockIndex,
          }))
        }
      >
        Play
      </button>
    )}
    <button
      className="Button Button--showanswer"
      onClick={() =>
        setState((oldState) => ({
          ...oldState,
          questionIndex,
          blockIndex,
          questionState: "answer",
        }))
      }
    >
      Show Answer
    </button>
  </div>
);
const SilentVideoListRenderer = ({
  blockIndex,
  questionIndex,
  title,
  video,
  correct,
  setState,
  state,
}) => (
  <div
    className={
      "Question Base" +
      (state.blockIndex === blockIndex && state.questionIndex === questionIndex
        ? " Question--current"
        : "")
    }
  >
    <span className="Title">{title}</span>
    <span className="Type">Base</span>
    <SilentVideoActions
      state={state}
      setState={setState}
      questionIndex={questionIndex}
      blockIndex={blockIndex}
    />
  </div>
);

const candidateRenderers = {
  base: BaseRenderer,
  guess: GuessRenderer,
  image: ImageRenderer,
  silentVideo: SilentVideoRenderer,
};

const listRenderers = {
  base: BaseListRenderer,
  guess: BaseListRenderer,
  image: BaseListRenderer,
  silentVideo: SilentVideoListRenderer,
};

const titleRenderers = {
  base: BaseActions,
  guess: BaseActions,
  image: BaseListRenderer,
  silentVideo: SilentVideoActions,
};

const renderersByType = {
  list: listRenderers,
  title: titleRenderers,
  candidate: candidateRenderers,
};

const QuestionRenderer = ({
  type,
  question,
  state,
  setState,
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
        setState={setState}
      />
    );
  }
  return null;
};

const gameState = {
  blockIndex: null,
  questionIndex: null,
  questionState: null,
  gameState: null,
  questionStates: {},
};

const App = () => {
  const [seat, setSeat] = useState("lobby");
  const [state, setState] = useLocalStorage(gameState);

  useEffect(() => {
    if (window.location.hash.includes("candidate")) {
      setSeat("candidate");
    } else if (window.location.hash.includes("master")) {
      setSeat("master");
    }
  }, []);

  if (seat === "lobby") {
    return (
      <div className="App Lobby">
        <button
          className="Button"
          onClick={() => setSeat("master")}
          tabIndex={0}
        >
          Master
        </button>
        <button
          className="Button"
          onClick={() => setSeat("candidate")}
          tabIndex={0}
        >
          Candidate
        </button>
      </div>
    );
  } else if (seat === "master") {
    const { blockIndex, questionIndex, questionState } = state;

    return (
      <div className="App">
        <div className="Generel">
          <span className="Title">Quiz {data.name}</span>
          <div className="Actions">
            <button
              className="Button"
              onClick={() => setState(gameState)}
              tabIndex={0}
            >
              Reset
            </button>
          </div>
        </div>
        <div className="Game">
          <div className="Title">
            <span className="Title">
              Block {blockIndex === null ? 0 : blockIndex + 1} /{" "}
              {data.blocks.length}
            </span>
            <span className="Title">
              Question {questionIndex === null ? 0 : questionIndex + 1} /{" "}
              {data.blocks[blockIndex]?.questions.length || 0}
            </span>
            <div className="Actions">
              {blockIndex !== null &&
              data.blocks[blockIndex].questions.length > questionIndex + 1 ? (
                <button
                  className="Button"
                  onClick={() =>
                    setState((oldState) => ({
                      ...oldState,
                      questionIndex:
                        oldState.questionIndex === null
                          ? 0
                          : oldState.questionIndex + 1,
                    }))
                  }
                >
                  Nächste Frage
                </button>
              ) : blockIndex === null || data.blocks.length > blockIndex + 1 ? (
                <button
                  className="Button"
                  onClick={() =>
                    setState((oldState) => ({
                      ...oldState,
                      questionIndex: 0,
                      blockIndex:
                        oldState.blockIndex === null
                          ? 0
                          : oldState.blockIndex + 1,
                    }))
                  }
                >
                  Nächster Block
                </button>
              ) : (
                "Spiel Vorbei"
              )}
            </div>
          </div>
          <div className="Question">
            {data.blocks[blockIndex]?.questions[questionIndex] && (
              <QuestionRenderer
                type="title"
                blockIndex={blockIndex}
                questionIndex={questionIndex}
                question={data.blocks[blockIndex].questions[questionIndex]}
                state={state}
                setState={setState}
              />
            )}
          </div>
        </div>
        <div className="Question List">
          {data.blocks.map(({ questions, startTitle }, blockIndex) => (
            <div
              className={
                "Block" +
                (blockIndex === state.blockIndex ? " Block--current" : "")
              }
              key={blockIndex}
            >
              <div
                onClick={() =>
                  setState((oldState) => ({
                    ...oldState,
                    blockIndex,
                    quesionIndex: null,
                  }))
                }
                className="BlockTitle"
              >
                Block {blockIndex + 1}
                {startTitle ? "- " + startTitle: ""}
              </div>
              <div className="BlockChildren">
                {questions.map((question, questionIndex) => (
                  <QuestionRenderer
                    type="list"
                    question={question}
                    questionIndex={questionIndex}
                    blockIndex={blockIndex}
                    state={state}
                    setState={setState}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (seat === "candidate") {
    const { questionIndex, blockIndex } = state;

    return (
      <div className="App Candidate">
        {blockIndex !== null ? (
          questionIndex !== null &&
          data.blocks[blockIndex].questions[questionIndex] ? (
            <QuestionRenderer
              type="candidate"
              blockIndex={blockIndex}
              questionIndex={questionIndex}
              question={data.blocks[blockIndex].questions[questionIndex]}
              state={state}
              setState={setState}
            />
          ) : (
            <div className="Start">
              {data.blocks[blockIndex]?.startTitle ? (
                data.blocks[blockIndex].startTitle
              ) : (
                <>Block {blockIndex + 1}</>
              )}
            </div>
          )
        ) : (
          <div className="Start">{data.startTitle}</div>
        )}
      </div>
    );
  } else {
    throw Error("Seat must be lobby, master or candidate");
  }
};

export default App;
