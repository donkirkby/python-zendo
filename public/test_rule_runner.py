from rule_runner import is_rule_followed


def test_true():
    rule_text = """\
print('True')
"""
    input_text = 'someping'

    assert is_rule_followed(rule_text, input_text)


def test_false():
    rule_text = """\
print('False')
"""
    input_text = 'nothing'

    assert not is_rule_followed(rule_text, input_text)
