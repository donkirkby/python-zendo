class InputDisplay {
    constructor() {
        this.rule = '';
        this.guess = '';
        this.ruleUpdates = undefined;  // {gameChildPath: data}
        this.guessUpdates = undefined;  // {gameChildPath: data}

        // {inputId: {text: text, followsRule: bool, followsGuess: bool}}
        this.inputs = {};
    }

    /* Set a callback evaluate(rule, input) => [isFollowed, output]. */
    setEvaluate = (evaluate) => {
        this.evaluate = evaluate;
    }

    /* Set the rule text, if this player wrote the rule.
     *
     * @param rule: rule source code
     * @param updates: an object to hold database updates, or undefined if rule
     *  and input results should not be updated in the database.
     */
    setRule = (rule, updates) => {
        this.rule = rule;
        this.ruleUpdates = updates;
        const evaluateAll = true;
        this.checkInputs(this.inputs, 'Rule', evaluateAll);
    }

    /* Set the guessed rule text, if this player wrote the guess.
     *
     * @param guess: guess source code
     * @param updates: an object to hold database updates, or undefined if guess
     *  and input results should not be updated in the database.
     */
    setGuess = (guess, updates) => {
        this.guess = guess;
        this.guessUpdates = updates;
        const evaluateAll = true
        this.checkInputs(this.inputs, 'Guess', evaluateAll);
    }

    /* Update inputs from database, and fill out rule results. */
    updateInputs = (inputs) => {
        this.checkInputs(inputs, 'Rule');
        this.checkInputs(inputs, 'Guess');
        this.inputs = inputs;
    }
    checkInputs = (inputs, ruleName, evaluateAll) => {
        const rule = this[ruleName.toLowerCase()],
            updates = this[ruleName.toLowerCase() + 'Updates'],
            evaluate = rule !== '' && this.evaluate,
            targetName = 'follows' + ruleName,
            outputName = ruleName.toLowerCase() + 'Output';
        for (const [inputId, input] of Object.entries(inputs)) {
            const isNeeded = input[targetName] === undefined || evaluateAll;
            if (isNeeded && evaluate) {
                // noinspection JSValidateTypes
                let [followsRule, output] = evaluate(rule, input.text);
                if (updates === undefined) {
                    // We display output before publishing rule or guess.
                    input[outputName] = output;
                }
                else {
                    delete input[outputName];
                    if (followsRule !== input[targetName]) {
                        const updatePath = 'inputs/' + inputId + '/' + targetName;
                        updates[updatePath] = followsRule;
                    }
                }
                input[targetName] = followsRule;
            }
        }
    };

    collectUpdates = () => {
        const updates = {};
        transferUpdates(this.ruleUpdates, updates);
        transferUpdates(this.guessUpdates, updates);
        return updates;
    };
}

function transferUpdates(source, target) {
    if (source === undefined) {
        return;
    }
    for (const [key, value] of Object.entries(source)) {
        target[key] = value;
        delete source[key];
    }
}

export default InputDisplay;
