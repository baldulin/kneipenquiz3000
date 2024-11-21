import json
import base64
import secrets
import re
from aiohttp import web
from enum import Enum
from .states import Game, ScreenStates, Team, Gamemaster, QuestionStates
from .logs import logger
from .exceptions import WrongPasswordException


"""
There are basically three types of clients (in game phase).

1. The Screen i.e. the display of the game state
2. The Game master
3. The Teams
(4. A visitor (pre join phase))

For each of these steps different data is required.
"""

_re_authorization = re.compile(r"^Bearer (?P<token>[a-zA-Z0-9=+/]+)$")

routes = web.RouteTableDef()


def props(item, *keys):
    return {key: getattr(item, key) for key in keys}


def _dump_default(arg):
    if isinstance(arg, Enum):
        return arg.name
    return str(arg)


def _dump_with_enum(data):
    return json.dumps(data, default=_dump_default)


def json_response(data, **kwargs):
    return web.json_response(data, **kwargs, dumps=_dump_with_enum)


@routes.get("/api/")
async def root(request):
    """ Root request"""

    response = {
        "games": [
            props(game, "active", "key", "team_count", "game_state")
            for game in Game.get_games()
        ],
    }
    logger.debug("Access root from %s", request.remote)
    return json_response(response)


@routes.get("/api/{game_name}/")
async def game_root(request):
    game = get_game(request)
    logger.debug("Access Game:%s", game.name)

    return json_response(props(game,
                "key", "active", "team_count", "game_state", "title", "name",
                "question_count", "current_question_index", "question_state", "screen_state",
                "question_data", "guess_data", "emotion_data", "score_data",
            )
        )


def get_game(request):
    try:
        return Game.get_game(request.match_info["game_name"])
    except KeyError:
        raise web.HTTPNotFound()


def get_team(request, game):
    try:
        return game.get_team_by_cookie(request.cookies["team"])
    except KeyError:
        pass

    try:
        if mro := _re_authorization.match(request.headers["Authorization"]):
            return game.get_team_by_cookie(mro.group("token"))
    except KeyError:
        pass

    logger.error("Invalid Team Bearer Token from %s", request.remote)
    raise web.HTTPUnauthorized()

def get_gamemaster(request, game):
    try:
        return game.get_gamemaster_by_cookie(request.cookies["gamemaster"])
    except KeyError:
        pass

    try:
        if mro := _re_authorization.match(request.headers["Authorization"]):
            return game.get_gamemaster_by_cookie(mro.group("token"))
    except KeyError:
        pass

    logger.error("Invalid Gamemaster Bearer Token from %s", request.remote)
    raise web.HTTPUnauthorized()


# TODO unecessairy
def get_screen(request, game):
    try:
        return game.get_team_by_cookie(request.cookies["screen"])
    except KeyError:
        raise web.HTTPUnauthorized()


def get_secret():
    return base64.b64encode(secrets.token_bytes(32)).decode("utf8")


@routes.put("/api/{game_name}/join_team")
async def join_team(request):
    game = get_game(request)

    data = await request.json()
    address = request.remote
    name = data["name"]
    session_key = get_secret()

    team = Team(address, name, session_key)
    game.join_team(team)

    response = json_response(session_key)
    response.set_cookie("team", session_key)
    logger.debug("Team %s joined game %s from %s", name, game.name, request.remote)
    return response


@routes.get("/api/{game_name}/team")
async def show_team(request):
    game = get_game(request)
    team = get_team(request, game)

    game_state = props(game,
            "key", "active", "team_count", "game_state", "title", "name",
            "question_count", "current_question_index", "question_state", "screen_state",
            "question_data", "guess_data", "emotion_data", "score_data",
        )
    team_state = props(team, "active", "name", "current_answer", "current_emotion")

    return json_response({**game_state, "team_data": team_state})


@routes.delete("/api/{game_name}/team")
async def leave_team(request):
    game = get_game(request)
    team = get_team(request, game)
    game.leave_team(team)

    logger.debug("Team %s left game %s from %s", team.name, game.name, request.remote)
    return json_response({})


@routes.put("/api/{game_name}/team/guess")
async def guess_team(request):
    game = get_game(request)
    team = get_team(request, game)
    answer = await request.json()

    if game.question_state == QuestionStates.ASK:
        team.guess(answer)

    logger.debug("Team %s of game %s guessed %s", team.name, game.name, answer)
    return json_response({})


@routes.put("/api/{game_name}/team/show_emotion")
async def show_emotion_team(request):
    game = get_game(request)
    team = get_team(request, game)
    emotion = await request.json()
    team.show_emotion(emotion)

    logger.debug("Team %s of game %s feels %s", team.name, game.name, emotion)
    return json_response({})


@routes.put("/api/{game_name}/join_gamemaster")
async def join_gamemaster(request):
    game = get_game(request)

    password = await request.json()

    session_key = get_secret()
    address = request.remote
    gamemaster = Gamemaster(address, session_key)
    try:
        game.join_gamemaster(password, gamemaster)
    except WrongPasswordException:
        raise web.HTTPUnauthorized()

    response = json_response(session_key)
    response.set_cookie("gamemaster", session_key)
    logger.debug("Gamemaster joined game %s from %s", game.name, request.remote)
    return response


@routes.get("/api/{game_name}/gamemaster")
async def show_gamemaster(request):
    game = get_game(request)
    gamemaster = get_gamemaster(request, game)

    return json_response(game.gamemaster_data)


@routes.delete("/api/{game_name}/gamemaster")
async def leave_gamemaster(request):
    game = get_game(request)
    gamemaster = get_gamemaster(request, game)
    game.leave_gamemaster(gamemaster)

    logger.debug("Gamemaster left game %s from %s", game.name, request.remote)
    return json_response({})


@routes.put("/api/{game_name}/gamemaster/{action}")
async def game_action(request):
    game = get_game(request)
    gamemaster = get_gamemaster(request, game)
    action = request.match_info["action"]

    try:
        data = await request.json()
    except:
        data = None

    if action == "end_game":
        game.end_game()
    elif action == "start_game":
        game.start_game()
    elif action == "show_question":
        game.show_question(await request.json())
    elif action == "score_answer":
        game.score_answer()
    elif action == "show_answer":
        game.show_answer(data)
    elif action == "ask_next_question":
        game.ask_next_question()
    elif action == "set_screen_state":
        screen_state = ScreenStates[data]
        game.set_screen_state(screen_state)
    else:
        logger.error("Unkown action %s inquired by Gamemaster for Game %s from %s", action, game.name, request.remote)
        raise web.HTTPNotFound()

    logger.debug("Gamemaster took action %s in game %s with params %s", action, game.name, data)
    return json_response({})


@routes.put("/api/{game_name}/join_screen")
async def join_screen(request):
    game = get_game(request)

    session_key = get_secret()
    address = request.remote
    screen = Gamemaster(address, session_key)
    game.join_screen(screen)

    response = json_response({})
    response.set_cookie("screen", session_key)
    return response


@routes.get("/api/{game_name}/screen")
async def show_screen(request):
    game = get_game(request)
    screen = get_screen(request, game)

    return json_response(props(screen, "address"))


@routes.delete("/api/{game_name}/screen")
async def leave_screen(request):
    game = get_game(request)
    screen = get_screen(request, game)
    game.leave_screen(screen)

    return json_response({})
