import sys
import typing
from io import StringIO
from traceback import print_exc

try:
    # noinspection PyUnresolvedReferences
    from js import document, window
    IS_JAVASCRIPT_AVAILABLE = True
except ImportError:
    IS_JAVASCRIPT_AVAILABLE = False


def is_rule_followed(rule_text: str, input_text: str) -> bool:
    is_followed, output = check_rule(rule_text, input_text)
    return is_followed


def check_rule(rule_text: str, input_text: str) -> typing.Tuple[bool, str]:
    """ Check if the input_text follows the rule in rule_text.

    :param rule_text: the source code for the rule
    :param input_text: the input to check
    :return: a boolean to show whether the rule was followed, and any text
        from stdout or stderr.
    """
    original_stdout = sys.stdout
    original_stderr = sys.stderr
    original_stdin = sys.stdin
    mock_stdout = StringIO()
    sys.stdout = mock_stdout
    sys.stderr = mock_stdout
    sys.stdin = StringIO(input_text)
    try:
        # noinspection PyBroadException
        try:
            global_variables = {}
            exec(rule_text, global_variables)
        except BaseException:
            print_exc()
    finally:
        sys.stdout = original_stdout
        sys.stderr = original_stderr
        sys.stdin = original_stdin
    stdout_text = mock_stdout.getvalue()
    return stdout_text.strip() == 'True', stdout_text


if IS_JAVASCRIPT_AVAILABLE:
    window.check_rule = check_rule
