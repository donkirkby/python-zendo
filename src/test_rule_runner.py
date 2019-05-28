from pathlib import Path

from rule_runner import is_rule_followed, check_rule


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


def test_contains_a_vowel():
    rule_text = """\
input_text = input()
v = 'aeiou'
is_rule_followed = bool([x for x in input_text if x in v])
print(is_rule_followed)
"""
    input_text = 'Good'

    assert is_rule_followed(rule_text, input_text)


def test_check_rule_passes():
    rule_text = """\
print('   True   ')
"""
    input_text = 'ignored'
    expected_output = '   True   \n'
    expected_is_followed = True

    is_followed, output = check_rule(rule_text, input_text)

    assert expected_is_followed == is_followed
    assert expected_output == output


def test_check_rule_output():
    rule_text = """\
print('Hello, World!')
"""
    input_text = 'ignored'
    expected_output = 'Hello, World!\n'
    expected_is_followed = False

    is_followed, output = check_rule(rule_text, input_text)

    assert expected_is_followed == is_followed
    assert expected_output == output


def test_check_rule_error():
    rule_text = """\
1/0
"""
    input_text = 'ignored'
    source_path = Path(__file__).parent / "rule_runner.py"
    expected_output = f"""\
Traceback (most recent call last):
  File "{source_path}", line 38, in check_rule
    exec(rule_text, global_variables)
  File "<string>", line 1, in <module>
ZeroDivisionError: division by zero
"""
    expected_is_followed = False

    is_followed, output = check_rule(rule_text, input_text)

    assert expected_is_followed == is_followed
    assert expected_output == output
