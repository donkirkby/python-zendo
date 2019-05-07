from rule_runner import is_rule_followed


def test_true():
    rule_text = """\
print('True')
"""
    input_text = 'ignored'

    assert is_rule_followed(rule_text, input_text)


def test_false():
    rule_text = """\
print('False')
"""
    input_text = 'ignored'

    assert not is_rule_followed(rule_text, input_text)


def test_contains_e():
    rule_text = """\
print('e' in input())
"""
    input_text = 'Best'

    assert is_rule_followed(rule_text, input_text)


def test_contains_no_e():
    rule_text = """\
print('e' in input())
"""
    input_text = 'Worst'

    assert not is_rule_followed(rule_text, input_text)
