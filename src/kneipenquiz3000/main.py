def run_tool():
    from ackermann import run
    from ackermann.units import run_command
    from . import commands

    run(targets=[run_command])
