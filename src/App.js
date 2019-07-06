import React, {Component} from 'react';
import AceEditor from 'react-ace';
import './App.css';
import rule_runner from './rule_runner.py';
import thumb_up from './thumb-up-3x.png';
import thumb_down from './thumb-down-3x.png';
import thumb_up_red from './thumb-up-red-3x.png';
import thumb_down_red from './thumb-down-red-3x.png';
import blank from './blank.png';

import 'brace/mode/python';
import 'brace/theme/github';

const RULE_EXAMPLE = `\
input_text = input()
is_rule_followed = True  # Replace this.
print(is_rule_followed)
`;

class App extends Component {
    constructor() {
        super();
        let canSave = this.localStorageAvailable(),
            rule_text = canSave ? window.localStorage.zendoRule : '',
            rule_guess = canSave ? window.localStorage.zendoRuleGuess : '';
        if (rule_text === '' || rule_text === undefined) {
            rule_text = RULE_EXAMPLE;
        }
        if (rule_guess === '' || rule_guess === undefined) {
            rule_guess = RULE_EXAMPLE;
        }
        this.state = {
            rule: rule_text,
            rule_guess: rule_guess,
            stdout: "",
            is_rule_visible: true,
            visibility_button_name: "Hide Rule",
            is_guess_visible: false,
            guess_button_name: "Show Guess",
            new_input: "",
            inputs: [],  // [{ text: "...", follows_rule: true}]
            can_save: canSave,
            will_save: false
        };

        if (window.languagePluginLoader === undefined) {
            console.log('Pyodide is not loaded.');
        } else {
            window.languagePluginLoader.then(function () {
                fetch(rule_runner).then(function (response) {
                    return response.text();
                }).then(function (rule_runner_source) {
                    window.pyodide.runPython(rule_runner_source);
                });
            });
        }
    }

    localStorageAvailable = () => {
        try {
            let storage = window.localStorage,
                x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return false;
        }
    };

    handleRuleChange = rule_text => {
        this.updateRules(rule_text, this.state.rule_guess);
    };

    handleRuleGuessChange = rule_guess => {
        this.updateRules(this.state.rule, rule_guess);
    };

    updateRules = (rule_text, rule_guess, is_guess_visible) => {
        if (is_guess_visible === undefined) {
            is_guess_visible = this.state.is_guess_visible;
        }
        let updateInput = this.updateInput;
        let new_inputs = this.state.inputs.map(function(old_input) {
            return updateInput(old_input, rule_text, is_guess_visible && rule_guess);
        });
        this.setState({
            rule: rule_text,
            rule_guess: rule_guess,
            is_guess_visible: is_guess_visible,
            inputs: new_inputs
        });
        if (this.state.can_save && !this.state.will_save) {
            window.setTimeout(this.saveBackup, 1000);
            this.setState({will_save: true});
        }
    };

    updateInput = (old_input, rule_text, rule_guess) => {
        let new_input = {text: old_input.text};
        if (rule_text && rule_text.length > 0) {
            let rule_results = window.check_rule(rule_text, old_input.text);
            new_input.follows_rule = rule_results[0];
            new_input.rule_output = rule_results[1];
        }
        if (rule_guess && rule_guess.length > 0) {
            let rule_results = window.check_rule(rule_guess, old_input.text);
            new_input.follows_rule_guess = rule_results[0];
            new_input.guess_output = rule_results[1];
            new_input.is_mismatch = (
                new_input.follows_rule !== new_input.follows_rule_guess);
        }
        return new_input;
    };

    saveBackup = () => {
        window.localStorage.zendoRule = this.state.rule;
        window.localStorage.zendoRuleGuess = this.state.rule_guess;
        this.setState({will_save: false});
    };

    handleInputChange = evt => {
        this.setState({
            new_input: evt.target.value
        });
    };

    handleVisibilityChange = () => {
        if (this.state.is_rule_visible) {
            this.setState({
                is_rule_visible: false,
                visibility_button_name: "Show Rule"
            });
        } else {
            this.setState({
                is_rule_visible: true,
                visibility_button_name: "Hide Rule"
            });
        }

    };

    handleGuessVisibilityChange = () => {
        let is_guess_visible = ! this.state.is_guess_visible;
        this.setState({
            is_guess_visible: is_guess_visible,
            guess_button_name: is_guess_visible ? "Hide Guess" : "Show Guess"
        });
        this.updateRules(this.state.rule, this.state.rule_guess, is_guess_visible);
    };

    handleInputKeyPress = event => {
        if (event.key === 'Enter') {
            this.handleNewInput();
        }
    };

    handleNewInput = () => {
        if (this.state.new_input === "") {
            return;
        }
        let new_input_entry = this.updateInput(
            {text: this.state.new_input},
            this.state.rule,
            this.state.is_guess_visible && this.state.rule_guess);
        this.setState({
            new_input: "",
            stdout: new_input_entry.rule_output,
            inputs: this.state.inputs.concat([new_input_entry])
        });
    };

    render() {
        return (
            <div className="App" style={{textAlign: "start"}}>
                <button
                    type="button"
                    onClick={this.handleVisibilityChange}
                    className="small"
                >{this.state.visibility_button_name}</button>
                {this.state.is_rule_visible && <AceEditor
                    value={this.state.rule}
                    onChange={this.handleRuleChange}
                    mode="python"
                    theme="github"
                    width="100%"
                    fontSize={18}
                    showPrintMargin={true}
                    showGutter={false}
                    highlightActiveLine={true}
                    editorProps={{
                        $blockScrolling: Infinity
                    }}
                    setOptions={{
                        showLineNumbers: false,
                        tabSize: 4,
                    }}/>}
                <p>Output:</p>
                {this.state.is_rule_visible && <AceEditor
                    value={this.state.stdout}
                    mode="text"
                    theme="github"
                    width="100%"
                    height="10em"
                    fontSize={18}
                    showPrintMargin={true}
                    showGutter={false}
                    highlightActiveLine={true}
                    editorProps={{
                        $blockScrolling: Infinity
                    }}
                    setOptions={{
                        showLineNumbers: false,
                        tabSize: 4,
                    }}/>}
                <ul>

                    {this.state.inputs.map((entry, entry_index) => (
                        <li key={"item" + entry_index}>
                            <img alt={entry.follows_rule} src={(entry.follows_rule && thumb_up) || thumb_down}/>
                            <pre key={"item_text" + entry_index} style={{display: "inline"}}>{entry.text}</pre>
                            <img alt={entry.follows_rule_guess}
                                 src={(entry.follows_rule_guess === undefined && blank) ||
                                 (entry.is_mismatch &&
                                     ((entry.follows_rule_guess && thumb_up_red) || thumb_down_red)) ||
                                     ((entry.follows_rule_guess && thumb_up) || thumb_down)
                                 }/>
                        </li>
                    ))}
                </ul>
                <input
                    type="text"
                    placeholder="Type input here."
                    value={this.state.new_input}
                    onChange={this.handleInputChange}
                    onKeyPress={this.handleInputKeyPress}/>
                <button type="button" onClick={this.handleNewInput} className="small">Tell</button>
                <p>
                <button
                    type="button"
                    onClick={this.handleGuessVisibilityChange}
                    className="small"
                >{this.state.guess_button_name}</button>
                </p>
                {this.state.is_guess_visible && <div>
                    <p>Guess the rule:</p>
                    <AceEditor
                        value={this.state.rule_guess}
                        onChange={this.handleRuleGuessChange}
                        mode="python"
                        theme="github"
                        width="100%"
                        fontSize={18}
                        showPrintMargin={true}
                        showGutter={false}
                        highlightActiveLine={true}
                        editorProps={{
                            $blockScrolling: Infinity
                        }}
                        setOptions={{
                            showLineNumbers: false,
                            tabSize: 4,
                        }}/>
                </div>}
            </div>
        );
    }
}

export default App;
