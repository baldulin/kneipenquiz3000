from aiohttp import web
import aiohttp_cors
import secrets
from ackermann import Command
from pathlib import Path
from .states import Game, Quiz
from .server import routes
from importlib.resources import files


class Serve(Command):
    name = "serve"

    @classmethod
    def get_arguments(cls, parser):
        parser.add_argument(
            "-p", "--port", help="Port of the server", type=int, default=8080
        )
        parser.add_argument(
            "-H", "--host", help="The hostname where to listen too"
        )
        parser.add_argument(
            "-f", "--frontend", help="Serve frontend as well", action="store_true"
        )
        parser.add_argument(
            "-c", "--devcors", help="Allow cors request for any host", action="store_true"
        )
        parser.add_argument(
            "-q", "--quiz", help="Path to quiz file", type=Path, required=True
        )
        parser.add_argument(
            "-n", "--name", help="Quiz name"
        )
        parser.add_argument(
            "-P", "--password", help="Gamemaster password"
        )

    def run(self, config):
        args = config["ARGS"]

        app = web.Application()

        # Add cors setting for dev mode
        if args.devcors:
            cors = aiohttp_cors.setup(app, defaults={
               "*": aiohttp_cors.ResourceOptions(
                    allow_credentials=True,
                    expose_headers="*",
                    allow_headers="*"
                )
              })

        # Initialize frontend routes
        # TODO maybe add cache key for easy nginx caching
        if args.frontend:
            static_files = files("kneipenquiz3000.frontend")

            @routes.get("/")
            async def handle(request):
                return web.FileResponse(static_files / "index.html")

            routes.static('/', static_files._paths[0])

        # Initialize routes
        app.add_routes(routes)

        if args.devcors:
            for route in list(app.router.routes()):
                cors.add(route)

        # Add game
        quiz = Quiz.from_path(args.quiz)
        password = args.password if args.password else secrets.token_urlsafe(10)
        game = Game(quiz, key=args.name, gamemaster_password=password)
        Game.add_game(game)

        # Run app
        web.run_app(app, host=args.host, port=args.port)
