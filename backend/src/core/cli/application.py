from typing import Callable

import os, asyncio, sys


class CommandLineInterface:
    _default_command: str
    _commands: dict[str, Callable] = {}
    _running_file: str
    _loop: asyncio.AbstractEventLoop

    def __init__(self) -> None:
        """TopFunds command line interface (CLI)"""
        print("**************************************************************** here is command line interface ****************************************************************")
        self._running_file = sys.argv[0]
        self._loop = asyncio.get_event_loop()

        @self.command()
        def help(*args, **kwargs) -> None:
            print(f'\n  Usage: {self._running_file} NAME')
            print('\n  Available commands:')

            if len(self._commands) == 0:
                print('    ** There are no commands available to execute')

            for name in self._commands.keys():
                print(f'    * {name}')

    def command(self, default_command: bool = False) -> Callable:
        def decorator(function: Callable) -> Callable:
            command_name = function.__name__
            self._commands[command_name] = function

            if default_command is True:
                self._default_command = command_name

            return function
        return decorator

    def __call__(self, *args, **kwargs) -> any:
        command_name = self._default_command

        if sys.argv[0].endswith('.py') and len(sys.argv) > 1:
            command_name = sys.argv[1]

        if command_name not in self._commands:
            print(f'Unknown command: {command_name}\nType \'{self._running_file} help\' for usage.')

        command = self._commands[command_name]
        return command(*args, **kwargs)
