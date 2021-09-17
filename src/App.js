import React, {Component} from 'react';
import AceEditor from 'react-ace';
// noinspection ES6CheckImport
import { initializeApp } from "firebase/app";
// noinspection ES6CheckImport
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
// noinspection ES6CheckImport
import { getDatabase, ref, child, push, set } from "firebase/database";

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
const firebaseConfig = {
    apiKey: "AIzaSyBzRnMig_BoFRALB0Aro-Zk3xPTTLT4DXI",
    authDomain: "python-zendo.firebaseapp.com",
    databaseURL: "https://python-zendo-default-rtdb.firebaseio.com",
    projectId: "python-zendo",
    storageBucket: "python-zendo.appspot.com",
    messagingSenderId: "1078959710744",
    appId: "1:1078959710744:web:f87097149476e5a148196d",
    measurementId: "G-SVNXNWKY35"
};

// Initialize Firebase
initializeApp(firebaseConfig);
const database = getDatabase();
const auth = getAuth();
signInAnonymously(auth);
let userId = undefined;
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        userId = user.uid;
    } else {
        // User is signed out
    }
});

class App extends Component {
    constructor(props) {
        super(props);
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
            gameId: '',
            rule: rule_text,
            rule_guess: rule_guess,
            is_rule_visible: true,
            visibility_button_name: "Hide Rule",
            is_guess_visible: false,
            guess_button_name: "Show Guess",
            new_input: "",
            inputs: [],  // [{ text: "...", follows_rule: true}]
            selected_input: 0,
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
            this.state.is_guess_visible && this.state.rule_guess),
            inputs = this.state.inputs.concat([new_input_entry]),
            selected_input = inputs.length - 1;
        let inputsPath = 'games/' + this.state.gameId + '/inputs';
        let dbInput = push(ref(database, inputsPath));
        set(dbInput, {
            text: this.state.new_input,
            author: userId
        });
        this.setState({
            new_input: "",
            inputs: inputs,
            selected_input: selected_input
        });
    };

    handleInputSelected = event => {
        this.setState({selected_input: parseInt(event.target.value)});
    };

    handleNewGame = () => {
        let dbGame = push(ref(database, 'games'));
        this.setState({gameId: dbGame.key});
        let ownerPath = child(dbGame, 'players/' + userId);
        set(ownerPath, 'owner');
    };

    handleGameIdChange = evt => {
        this.setState({
            gameId: evt.target.value
        });
    };

    handleGameIdKeyPress = event => {
        if (event.key === 'Enter') {
            this.handleJoin();
        }
    };

    handleJoin = () => {
        let dbGame = ref(database, 'games/' + this.state.gameId);
        let ownerPath = child(dbGame, 'pending/' + userId);
        set(ownerPath, true);
    };

    render() {
        let selected_input_index = this.state.selected_input;
        let selected_input = this.state.inputs[selected_input_index];
        return (
            <div className="App" style={{textAlign: "start"}}>
                <div>
                <button
                    type="button"
                    onClick={this.handleNewGame}
                    className="small">Start</button>
                <input
                    type="text"
                    placeholder="Type game id here."
                    value={this.state.gameId}
                    onChange={this.handleGameIdChange}
                    onKeyPress={this.handleGameIdKeyPress}/>
                <button type="button" onClick={this.handleJoin} className="small">Join</button>
                </div>
                <button
                    type="button"
                    onClick={this.handleVisibilityChange}
                    className="small"
                >{this.state.visibility_button_name}</button>
                {this.state.is_rule_visible && <div>
                <AceEditor
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
                    }}/>
                <p>Output:</p>
                <AceEditor
                    value={selected_input && selected_input.rule_output}
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
                    }}/>
                </div>}
                {this.state.inputs.map((entry, entry_index) => {
                    return <div key={"item" + entry_index}>
                        <label>
                            <input type="radio"
                                   value={entry_index}
                                   name="selected_input"
                                   onChange={this.handleInputSelected}
                                   checked={entry_index === selected_input_index}/>
                            <img alt={entry.follows_rule.toString()}
                                 src={(entry.follows_rule && thumb_up) || thumb_down}/>
                            <pre key={"item_text" + entry_index} style={{display: "inline"}}>{entry.text}</pre>
                            <img alt={
                                (entry.follows_rule_guess !== undefined &&
                                    entry.follows_rule_guess).toString()}
                                 src={(entry.follows_rule_guess === undefined && blank) ||
                                 (entry.is_mismatch &&
                                     ((entry.follows_rule_guess && thumb_up_red) || thumb_down_red)) ||
                                 ((entry.follows_rule_guess && thumb_up) || thumb_down)
                                 }/>
                        </label>
                    </div>
                })}
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
                <p>Output:</p>
                <AceEditor
                    value={selected_input && selected_input.guess_output}
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
                    }}/>
                </div>}
            </div>
        );
    }
}

export default App;
