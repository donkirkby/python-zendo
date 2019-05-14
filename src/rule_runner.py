import sys
from io import StringIO

try:
    # noinspection PyUnresolvedReferences
    from js import document, window
    IS_JAVASCRIPT_AVAILABLE = True
except ImportError:
    IS_JAVASCRIPT_AVAILABLE = False


def is_rule_followed(rule_text: str, input_text: str) -> bool:
    original_stdout = sys.stdout
    original_stdin = sys.stdin
    mock_stdout = StringIO()
    sys.stdout = mock_stdout
    sys.stdin = StringIO(input_text)
    # noinspection PyBroadException
    try:
        try:
            global_variables = {}
            exec(rule_text, global_variables)
        finally:
            sys.stdout = original_stdout
            sys.stdin = original_stdin
    except BaseException:
        return False
    stdout_text = mock_stdout.getvalue()
    return stdout_text.strip() == 'True'


if IS_JAVASCRIPT_AVAILABLE:
    window.is_rule_followed = is_rule_followed
