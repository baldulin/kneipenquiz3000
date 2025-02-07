"""

GameState:

- Setting up phase
    - Show wifi/url link to join
    - Show lobby

- Game Phase
    - Question Phase
        - Answer Phase
    - Score Phase

- After Game Phase
    - Show score

"""
import json
from enum import Enum
from pprint import pprint
from .logs import logger
from .exceptions import WrongPasswordException


GameStates = Enum("GameState", ("INIT", "PLAY", "END"))
QuestionStates = Enum("QuestionStates", ("ASK", "SCORE", "ANSWER"))
ScreenStates = Enum("ScreenStates", ("SETUP", "LOBBY", "QUESTION", "ANSWER", "SCORE", "FINAL"))


class GameException(Exception):
    pass


class TeamAlreadyExistsException(GameException):
    pass


class Scorer:
    def __init__(self):
        self.default_score = 0

    def init_score(self, teams):
        for team in teams:
            team.current_score = 0

    def score(self, question, teams):
        if question.renderer == "base":
            for team in teams:
                if team.current_answer is None:
                    continue
                guess = int(team.current_answer)
                if guess is not None and not isinstance(guess, int):
                    raise TypeError(f"Answer must be of type (int, None) not {guess}")
                answer = question.answers[guess]
                team.current_answer_score = 1 if answer.kwargs.get("correct", False) else 0
        elif question.renderer == "guess":
            max_guess_score = 4
            answer = float(question.answers[0].kwargs["text"])
            guesses = [(team, abs(answer - float(team.current_answer))) for team in teams if team.current_answer is not None]
            guesses = sorted(guesses, key=lambda x:x[1])[:max_guess_score - 1]

            for points, (team, guess) in enumerate(guesses):
                team.current_answer_score = max_guess_score - points
        else:
            raise Exception(f"Renderer {question.renderer} not implemented")

class Team:
    def __init__(self, address, name, cookie):
        self.address = address
        self.name = name
        self.cookie = cookie
        self.answers = {}
        self.current_answer = None
        self.current_emotion = None
        self.current_answer_score = None
        self.current_score = None
        self.active = True

    def __str__(self):
        return f"Team({self.name})"

    def guess(self, answer):
        self.current_answer = answer

    def show_emotion(self, emotion):
        self.current_emotion = emotion

    def reward(self, reward):
        self.current_score += int(reward)
        self.current_answer_score = 0

    def reset_answer(self):
        self.current_answer = None


class Screen:
    def __init__(self, address):
        self.address = address
        self.name = None


class Gamemaster:
    def __init__(self, address, cookie):
        self.address = address
        self.cookie = cookie


class Quiz:
    def __init__(self, name, title, blocks):
        self.name = name
        self.title = title
        self.blocks = blocks

    def __getitem__(self, index):
        block_index, question_index = index
        return self.blocks[block_index].questions[question_index]

    def get_next_index(self, index):
        if index is None:
            if len(self.blocks) > 0 and len(self.blocks[0]) > 0:
                return (0, 0)
            else:
                raise Exception("No more questions")

        block_index, question_index = index
        block = self.blocks[block_index]

        if len(block) > question_index + 1:
            return (block_index, question_index + 1)

        # TODO skip empty blocks?
        if len(self.blocks) <= block_index + 1:
            raise Exception("No more questions")

        block_index += 1
        if len(self.blocks[block_index]) > 0:
            return (block_index, 0)
        raise Exception("No more questions")

    def __len__(self):
        return sum(len(block) for block in self.blocks)

    def has_blocks(self):
        return len(self.blocks) > 1

    def to_answer_json(self):
        return {
            "name": self.name,
            "title": self.title,
            "blocks": [block.to_answer_json() for block in self.blocks],
        }

    @classmethod
    def from_json(cls, data):
        name = data.get("name", "Quiz Name")
        title = data.get("startTitle", "Title")
        blocks = [QuestionBlock.from_json(block) for block in data.get("blocks", [])]

        return Quiz(name, title, blocks)

    @classmethod
    def from_path(cls, path):
        with open(path) as f:
            return cls.from_json(json.load(f))


class QuestionBlock:
    def __init__(self, title, questions):
        self.title = title
        self.questions = questions

    def __len__(self):
        return len(self.questions)

    def __getitem__(self, index):
        return self.questions[index]

    @classmethod
    def from_json(cls, data):
        title = data.get("startTitle", "Block Title")
        questions = [Question.from_json(question) for question in data.get("questions", [])]

        return QuestionBlock(title, questions)

    def to_answer_json(self):
        return {
            "title": self.title,
            "questions": [question.to_answer_json() for question in self.questions],
        }


class Question:
    def __init__(self, title, renderer, answers, correct=None):
        self.title = title
        self.renderer = renderer
        self.answers = answers
        self.correct = correct

    def __str__(self):
        return f"Question({self.title})"

    @classmethod
    def from_json(cls, data):
        title = data["title"]
        renderer = data["renderer"]
        answers = [Answer(**answer) for answer in data.get("answers", [])]
        correct = data.get("correct")

        return Question(title, renderer, answers, correct)

    def to_json(self):
        return {
            "title": self.title,
            "renderer": self.renderer,
            "answers": [answer.to_json() for answer in self.answers],
        }

    def to_answer_json(self):
        return {
            "title": self.title,
            "renderer": self.renderer,
            "answers": [answer.to_answer_json() for answer in self.answers],
            "correct": self.correct,
        }


class Answer:
    def __init__(self, **kwargs):
        self.kwargs = kwargs

    def __str__(self):
        return f"Answer({self.kwargs})"

    def to_json(self):
        return self.kwargs

    def to_answer_json(self):
        return self.kwargs


class Game:
    games = {}

    def __init__(self, questions, key=None, gamemaster_password=None):
        self.gamemaster_password = gamemaster_password
        self.key = key
        self.game_state = GameStates.INIT
        self.question_state = None
        self.screen_state = ScreenStates.SETUP
        self.questions = questions
        self.teams = []
        self.screens = []
        self.gamemasters = []
        self.current_question_index = None
        self.scorer = Scorer()

    @property
    def active(self):
        return self.game_state != GameStates.END

    @property
    def name(self):
        return self.questions.name

    @property
    def title(self):
        return self.questions.title

    @property
    def question_data(self):
        if self.current_question is None:
            return None

        if self.question_state == QuestionStates.ASK:
            return self.current_question.to_json()
        elif self.question_state == QuestionStates.ANSWER:
            return self.current_question.to_answer_json()
        elif self.question_state == QuestionStates.SCORE:
            return self.current_question.to_json()
        raise Exception("Unkown state")

    @property
    def guess_data(self):
        if self.current_question is None:
            return None
        # TODO different modes here?
        if self.question_state == QuestionStates.ANSWER:
            return {team.name: team.current_answer for team in self.teams}

    @property
    def current_answer_score_data(self):
        if self.question_state == QuestionStates.SCORE:
            return {team.name: team.current_answer_score for team in self.teams}

    @property
    def gamemaster_data(self):
        guess_data = {team.name: team.current_answer for team in self.teams}
        keys = ["key", "active", "team_count", "game_state", "title", "name",
            "question_count", "current_question_index", "question_state", "screen_state",
            "question_data", "guess_data", "emotion_data", "score_data", "current_answer_score_data",
        ]
        kwargs = {key: getattr(self, key) for key in keys}

        return {
            **kwargs,
            "questions": self.questions.to_answer_json(),
            "score_data": self.score_data,
            "emotion_data": self.emotion_data,
            "guess_data": guess_data,
        }

    @property
    def emotion_data(self):
        return {team.name: team.current_emotion for team in self.teams}

    @property
    def score_data(self):
        return {team.name: team.current_score for team in self.teams}

    @classmethod
    def get_active_games(cls):
        return [game for game in cls.games.values() if game.active]

    @classmethod
    def get_games(cls):
        return cls.games.values()

    @classmethod
    def get_game(cls, key):
        return cls.games[key]

    def get_team_by_cookie(self, cookie):
        for team in self.teams:
            if team.cookie == cookie:
                return team
        raise KeyError("Team with that cookie not found")

    def get_gamemaster_by_cookie(self, cookie):
        for gamemaster in self.gamemasters:
            if gamemaster.cookie == cookie:
                return gamemaster
        raise KeyError("Team with that cookie not found")

    @classmethod
    def add_game(cls, game):
        if game.key in cls.games:
            raise Exception("Game already exists")
        cls.games[game.key] = game

    @property
    def current_question(self):
        if self.current_question_index is None:
            return None
        return self.questions[self.current_question_index]

    @property
    def question_count(self):
        return len(self.questions)

    @property
    def team_count(self):
        return len(self.teams)

    def ask_next_question(self):
        self.current_question_index = self.questions.get_next_index(self.current_question_index)
        self.question_state = QuestionStates.ASK

        # Reset team questions
        for team in self.teams:
            team.reset_answer()

    def show_question(self, index):
        self.current_question_index = index

        self.question_state = QuestionStates.ASK
        for team in self.teams:
            team.reset_answer()

    def score_answer(self):
        if self.current_question is None:
            raise Exception("No question asked")
        if self.question_state != QuestionStates.ASK:
            raise Exception("Wrong Question State")
        self.question_state = QuestionStates.SCORE

        # Do the scoring
        self.scorer.score(self.current_question, self.teams)

    def show_answer(self, scores=None):
        if self.current_question is None:
            raise Exception("No question asked")
        self.question_state = QuestionStates.ANSWER

        if scores is None:
            for team in self.teams:
                logger.debug("Team %s in Game %s rewarded %s", team.name, self.name, team.current_answer_score)
                team.reward(team.current_answer_score)
        else:
            for team in self.teams:
                logger.debug("Team %s in Game %s rewarded %s", team.name, self.name, team.current_answer_score)
                team.reward(scores.get(team.name, 0))

    def set_screen_state(self, state):
        self.screen_state = state

    def start_game(self):
        self.game_state = GameStates.PLAY

    def end_game(self):
        self.game_state = GameStates.END

    def join_team(self, team):
        for t in self.teams:
            if t.name == team.name:
                raise TeamAlreadyExistsException(f"Team with name \"{team.name}\" already exists")
        self.scorer.init_score([team])
        self.teams.append(team)

    def leave_team(self, team):
        self.teams.remove(team)

    def join_screen(self, screen):
        self.screens.append(screen)

    def leave_screen(self, screen):
        self.screens.remove(screen)

    def join_gamemaster(self, password, gamemaster):
        if password == self.gamemaster_password:
            self.gamemasters.append(gamemaster)
        else:
            raise WrongPasswordException("Wrong Password for Gamemaster")

    def leave_gamemaster(self, gamemaster):
        self.gamemasters.remove(gamemaster)
