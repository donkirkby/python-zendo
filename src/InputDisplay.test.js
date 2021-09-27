import InputDisplay from './InputDisplay';

const mockEvaluate = (display) => {
    display.setEvaluate((rule, input) => [
        (rule === input),
        'output for ' + input]);
};

it('collects inputs with no rule or guess', () => {
    let dbInputs = {id1: {text: 'a'}, id2: {text: 'b'}},
        expectedInputs = {id1: {text: 'a'}, id2: {text: 'b'}};

    let display = new InputDisplay();
    mockEvaluate(display);
    display.updateInputs(dbInputs);

    expect(display.inputs).toStrictEqual(expectedInputs);
});

it('updates inputs with a rule', () => {
    let dbInputs = {id1: {text: 'a'}, id2: {text: 'b'}},
        expectedInputs = {
            id1: {text: 'a', followsRule: true, ruleOutput: 'output for a'},
            id2: {text: 'b', followsRule: false, ruleOutput: 'output for b'}
        };
    let display = new InputDisplay();
    mockEvaluate(display);
    display.setRule('a');

    display.updateInputs(dbInputs);

    expect(display.inputs).toStrictEqual(expectedInputs);
});

it('updates results for new inputs', () => {
    let dbInputs = {id1: {text: 'x', followsRule: false}, id2: {text: 'y'}},
        expectedUpdates = {'inputs/id2/followsRule': false};
    let display = new InputDisplay(),
        ruleUpdates = {};

    mockEvaluate(display);
    display.setRule('a', ruleUpdates);

    display.updateInputs(dbInputs);

    expect(ruleUpdates).toStrictEqual(expectedUpdates);
});

it('updates results for new guess', () => {
    let dbInputs = {id1: {text: 'a'}, id2: {text: 'b'}},
        expectedInputs = {
            id1: {text: 'a', followsGuess: true, guessOutput: 'output for a'},
            id2: {text: 'b', followsGuess: false, guessOutput: 'output for b'}
        };
    let display = new InputDisplay();
    mockEvaluate(display);
    display.setGuess('a');

    display.updateInputs(dbInputs);

    expect(display.inputs).toStrictEqual(expectedInputs);
});

it('updates results for old guess', () => {
    let dbInputs = {id1: {text: 'a'}, id2: {text: 'b'}},
        expectedUpdates = {
            'inputs/id1/followsGuess': true,
            'inputs/id2/followsGuess': false
        },
        expectedInputs = {
            id1: {text: 'a', followsGuess: true},
            id2: {text: 'b', followsGuess: false}
        };
    let display = new InputDisplay(),
        guessUpdates = {};
    mockEvaluate(display);
    display.setGuess('a', guessUpdates);
    display.updateInputs(dbInputs);

    expect(display.inputs).toStrictEqual(expectedInputs);
    expect(guessUpdates).toStrictEqual(expectedUpdates);
});

it('updates results for changed guess', () => {
    let dbInputs = {id1: {text: 'a'}, id2: {text: 'b'}},
        expectedUpdates = {
            'inputs/id1/followsGuess': false},
        expectedInputs = {
            id1: {text: 'a', followsGuess: false},
            id2: {text: 'b', followsGuess: false}  // Doesn't change: no update.
        };
    let display = new InputDisplay(),
        guessUpdates = {};
    mockEvaluate(display);
    display.setGuess('a');
    display.updateInputs(dbInputs);
    display.updates = {};

    display.setGuess('c', guessUpdates);

    expect(display.inputs).toStrictEqual(expectedInputs);
    expect(guessUpdates).toStrictEqual(expectedUpdates);
});

/*
 * Set user id
 * Update players
 * Update inputs
 * - without any current rule
 * - with secret rule set
 * - with this user's guess submitted
 * - with this user's edited guess selected
 * Update guess
 * Show your guess
 * Show submitted guess
 * Hide guess

  * `inputs/$inputId` records inputs for the rule writer to process. You can
    write a new record, if the author matches your user id.
    * `text` the input text, a single line.
    * `author` the user id of the player who submitted it
    * `isRuleFollowed` true, if the rule writer found that it followed the
      secret rule.

 */