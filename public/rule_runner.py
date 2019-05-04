try:
    # noinspection PyUnresolvedReferences
    from js import document, window
    IS_JAVASCRIPT_AVAILABLE = True
except ImportError:
    IS_JAVASCRIPT_AVAILABLE = False


def is_rule_followed(rule_text: str, input_text: str) -> bool:
    print('In Python.')
    return rule_text and (rule_text[0] in input_text)


if IS_JAVASCRIPT_AVAILABLE:
    window.is_rule_followed = is_rule_followed
