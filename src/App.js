import React, {Component} from 'react';
import AceEditor from 'react-ace';
// noinspection ES6CheckImport
import {initializeApp} from "firebase/app";
// noinspection ES6CheckImport
import {getAuth, onAuthStateChanged, signInAnonymously} from "firebase/auth";
// noinspection ES6CheckImport
import {child, getDatabase, onValue, push, ref, set, update} from "firebase/database";

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
            ruleText = canSave ? window.localStorage.zendoRule : '',
            ruleGuess = canSave ? window.localStorage.zendoRuleGuess : '';
        if (ruleText === '' || ruleText === undefined) {
            ruleText = RULE_EXAMPLE;
        }
        if (ruleGuess === '' || ruleGuess === undefined) {
            ruleGuess = RULE_EXAMPLE;
        }
        this.state = {
            gameId: '',
            playerName: '',
            isWriter: true,  // This player writes the secret rule.
            players: [],  // [{ name: name, userId: userId }]
            rule: ruleText,
            ruleGuess: ruleGuess,  // displayed guess
            userGuess: ruleGuess,  // this user's guess
            isRuleVisible: true,
            visibilityButtonName: "Hide Rule",
            isGuessVisible: false,
            guessButtonName: "Show Guess",
            newInput: "",
            selectedInput: 0,
            selectedPlayer: 0,  // index in players
            playerGuesses: [], // [{ text: text, userId: userId }]
            canSave: canSave,
            willSave: false,
            dbUnsubscribes: [],

            // [{ text: "...",
            //    followsRule: bool,
            //    followsGuesses: { userId: bool }}]
            inputs: []
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

    handleRuleChange = ruleText => {
        this.updateRules(ruleText, this.state.ruleGuess);
    };

    handleRuleGuessChange = ruleGuess => {
        this.updateRules(this.state.rule, ruleGuess);
    };

    updateRules = (ruleText, ruleGuess, isGuessVisible) => {
        if (isGuessVisible === undefined) {
            isGuessVisible = this.state.isGuessVisible;
        }
        let updateInput = this.updateInput;
        let newInputs = this.state.inputs.map(function(oldInput) {
            return updateInput(oldInput, ruleText, isGuessVisible && ruleGuess);
        });
        this.setState({
            rule: ruleText,
            ruleGuess: ruleGuess,
            isGuessVisible: isGuessVisible,
            inputs: newInputs
        });
        if (this.isUserGuessSelected()) {
            this.setState({userGuess: ruleGuess})
        }
        if (this.state.canSave && !this.state.willSave) {
            window.setTimeout(this.saveBackup, 1000);
            this.setState({willSave: true});
        }
    };

    isUserGuessSelected = () => {
        return (
            this.state.players.length === 0 ||
            this.state.players[this.state.selectedPlayer].userId === userId);
    };

    updateInput = (oldInput, ruleText, ruleGuess) => {
        let newInput = {text: oldInput.text};
        if (ruleText && ruleText.length > 0) {
            let ruleResults = window.check_rule(ruleText, oldInput.text);
            newInput.followsRule = ruleResults[0];
            newInput.ruleOutput = ruleResults[1];
        }
        if (ruleGuess && ruleGuess.length > 0) {
            let ruleResults = window.check_rule(ruleGuess, oldInput.text);
            newInput.followsRuleGuess = ruleResults[0];
            newInput.guessOutput = ruleResults[1];
            newInput.isMismatch = (
                newInput.followsRule !== newInput.followsRuleGuess);
        }
        return newInput;
    };

    saveBackup = () => {
        window.localStorage.zendoRule = this.state.rule;
        window.localStorage.zendoRuleGuess = this.state.ruleGuess;
        this.setState({willSave: false});
    };

    handleInputChange = evt => {
        this.setState({
            newInput: evt.target.value
        });
    };

    handleVisibilityChange = () => {
        if (this.state.isRuleVisible) {
            this.setState({
                isRuleVisible: false,
                visibilityButtonName: "Show Rule"
            });
        } else {
            this.setState({
                isRuleVisible: true,
                visibilityButtonName: "Hide Rule"
            });
        }

    };

    handleGuessVisibilityChange = () => {
        let isGuessVisible = ! this.state.isGuessVisible;
        this.setState({
            isGuessVisible: isGuessVisible,
            guessButtonName: isGuessVisible ? "Hide Guess" : "Show Guess"
        });
        this.updateRules(this.state.rule, this.state.ruleGuess, isGuessVisible);
    };

    handleInputKeyPress = event => {
        if (event.key === 'Enter') {
            this.handleNewInput();
        }
    };

    handleNewInput = () => {
        if (this.state.newInput === "") {
            return;
        }
        let inputsPath = 'games/' + this.state.gameId + '/inputs';
        let dbInput = push(ref(database, inputsPath));
        set(dbInput, {
            text: this.state.newInput,
            author: userId
        });
        this.setState({newInput: ""});
    };

    handleInputSelected = event => {
        this.setState({selectedInput: parseInt(event.target.value)});
    };

    handlePlayerSelected = event => {
        let selectedPlayerIndex = (event === undefined
                                  ? this.state.selectedPlayer
                                  : parseInt(event.target.value)),
            selectedPlayer = this.state.players[selectedPlayerIndex];
        let guessText = '';
        for (let guess of Object.values(this.state.playerGuesses)) {
            if (guess.userId === selectedPlayer.userId) {
                guessText = guess.text;
                break;
            }
        }
        if (selectedPlayer.userId === userId) {
            guessText = this.state.userGuess;
        }
        this.setState({
            selectedPlayer: selectedPlayerIndex,
            ruleGuess: guessText
        });
    };

    handleNewGame = () => {
        let dbGame = push(ref(database, 'games'));
        this.setState({gameId: dbGame.key, isWriter: true});
        let ownerRef = child(dbGame, 'players/' + userId);
        set(ownerRef, {
            name: this.state.playerName,
            role: 'owner'
        }).then(() => {this.registerListeners(dbGame.key);});
    };

    handlePlayerNameChange = evt => {
        this.setState({
            playerName: evt.target.value
        });
    };

    handleGameIdChange = evt => {
        this.setState({
            gameId: evt.target.value,
            isWriter: false
        });
    };

    handleGameIdKeyPress = event => {
        if (event.key === 'Enter') {
            this.handleJoin();
        }
    };

    handleJoin = () => {
        let dbGame = ref(database, 'games/' + this.state.gameId);
        let pendingRef = child(dbGame, 'pending/' + userId);
        set(pendingRef, this.state.playerName);
        let playerRef = child(dbGame, 'players/' + userId);
        set(playerRef, {
            name: this.state.playerName,
            role: 'player'
        }).then(() => {this.registerListeners(this.state.gameId);});
    };

    handleSubmitGuess = () => {
        let dbGame = ref(database, 'games/' + this.state.gameId);
        let guessRef = child(dbGame, 'guesses/' + userId);
        set(guessRef, this.state.ruleGuess);
    };

    registerListeners = (gameId) => {
        let dbGame = ref(database, 'games/' + gameId);
        let playersRef = child(dbGame, 'players')
        let inputsRef = child(dbGame, 'inputs');
        let guessesRef = child(dbGame, 'guesses');
        for (let unsubscribe of this.state.dbUnsubscribes) {
            unsubscribe();
        }
        let dbUnsubscribes = [];
        dbUnsubscribes.push(onValue(inputsRef, this.handleInputsUpdated));
        dbUnsubscribes.push(onValue(playersRef, this.handlePlayersUpdated));
        dbUnsubscribes.push(onValue(guessesRef, this.handleGuessesUpdated));
        this.setState({dbUnsubscribes: dbUnsubscribes});
    };

    handleGuessesUpdated = (snapshot) => {
        let guessesArray = snapshot.val();
        if (guessesArray === null) {
            guessesArray = [];
        }
        let guessesDisplay = [],
            hasUserGuessed = false;
        for (const [playerId, guess] of Object.entries(guessesArray)) {
            let display = {
                text: guess,
                userId: playerId
            };
            guessesDisplay.push(display);
            if (playerId === userId) {
                hasUserGuessed = true;
            }
        }
        if (!hasUserGuessed && this.state.playerGuesses.length === 0) {
            guessesDisplay.push({ text: this.state.ruleGuess, userId: userId});
        }
        this.setState({
            playerGuesses: guessesDisplay
        });
    };

    handlePlayersUpdated = (snapshot) => {
        let playersArray = snapshot.val();
        if (playersArray === null) {
            playersArray = [];
        }
        let playersDisplay = [];
        for (const [playerId, player] of Object.entries(playersArray)) {
            let display = {
                name: player.name,
                userId: playerId
            };
            playersDisplay.push(display);
        }
        this.setState({
            players: playersDisplay
        });
        this.handlePlayerSelected();
    };

    handleInputsUpdated = (snapshot) => {
        let inputsArray = snapshot.val();
        if (inputsArray === null) {
            inputsArray = [];
        }
        let inputsDisplay = [];
        for (const [key, entry] of Object.entries(inputsArray)) {
            if (entry.isRuleFollowed === undefined && this.state.isWriter) {
                let newInputEntry = this.updateInput(
                    {text: entry.text},
                    this.state.rule,
                    this.state.isGuessVisible && this.state.ruleGuess);
                inputsDisplay.push(newInputEntry);
                let entryRef = child(snapshot.ref, key);

                update(entryRef,
                    {
                        text: entry.text,
                        isRuleFollowed: newInputEntry.followsRule
                    });
            }
            else {
                inputsDisplay.push({
                    text: entry.text,
                    followsRule: entry.isRuleFollowed
                });
            }
        }
        this.setState({
            newInput: "",
            inputs: inputsDisplay,
            selectedInput: inputsDisplay.length - 1
        });
    };

    render() {
        let selectedInputIndex = this.state.selectedInput;
        let selectedInput = this.state.inputs[selectedInputIndex];
        let selectedPlayerIndex = this.state.selectedPlayer,
            selectedPlayer = this.state.players[selectedPlayerIndex],
            selectedUserId = selectedPlayer !== undefined && selectedPlayer.userId;
        let isGuessReadOnly = selectedUserId !== userId;
        return (
            <div className="App" style={{textAlign: "start"}}>
                <div>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={this.state.playerName}
                        onChange={this.handlePlayerNameChange}/>
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
                >{this.state.visibilityButtonName}</button>
                {this.state.isRuleVisible && <div>
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
                    value={selectedInput && selectedInput.ruleOutput}
                    mode="text"
                    readOnly={true}
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
                <div className="interactions">
                <div className="inputs">
                {this.state.inputs.map((entry, entryIndex) => {
                    return <div key={"item" + entryIndex}>
                        <label>
                            <input type="radio"
                                   value={entryIndex}
                                   name="selected_input"
                                   onChange={this.handleInputSelected}
                                   checked={entryIndex === selectedInputIndex}/>
                            <img alt={'' + entry.followsRule}
                                 src={(entry.followsRule && thumb_up) || thumb_down}/>
                            <pre key={"item_text" + entryIndex} style={{display: "inline"}}>{entry.text}</pre>
                            <img alt={
                                (entry.followsRuleGuess !== undefined &&
                                    entry.followsRuleGuess).toString()}
                                 src={(entry.followsRuleGuess === undefined && blank) ||
                                 (entry.isMismatch &&
                                     ((entry.followsRuleGuess && thumb_up_red) || thumb_down_red)) ||
                                 ((entry.followsRuleGuess && thumb_up) || thumb_down)
                                 }/>
                        </label>
                    </div>
                })}
                <input
                    type="text"
                    placeholder="Type input here."
                    value={this.state.newInput}
                    onChange={this.handleInputChange}
                    onKeyPress={this.handleInputKeyPress}/>
                <button type="button" onClick={this.handleNewInput} className="small">Tell</button>
                </div>
                <div className="players">
                    <p>Players:</p>
                    {this.state.players.map((entry, entryIndex) => {
                        return <div key={"player" + entryIndex}>
                            <label>
                                <input type="radio"
                                       value={entryIndex}
                                       name="selected_player"
                                       onChange={this.handlePlayerSelected}
                                       checked={entryIndex === selectedPlayerIndex}/>
                                <span key={"player_name" + entryIndex}>{entry.name}</span>
                            </label>
                        </div>
                    })}
                </div>
                </div>
                <p>
                <button
                    type="button"
                    onClick={this.handleGuessVisibilityChange}
                    className="small"
                >{this.state.guessButtonName}</button>
                </p>
                {this.state.isGuessVisible && <div>
                    <p>Guess the rule:</p>
                    <AceEditor
                        value={this.state.ruleGuess}
                        onChange={this.handleRuleGuessChange}
                        mode="python"
                        readOnly={isGuessReadOnly}
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
                    value={selectedInput && selectedInput.guessOutput}
                    mode="text"
                    readOnly={true}
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
                    <p>
                        <button
                            type="button"
                            onClick={this.handleSubmitGuess}
                            className="small"
                            disabled={isGuessReadOnly}
                        >Submit Guess</button>
                    </p>
                </div>}
            </div>
        );
    }
}

export default App;
