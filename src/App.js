import React, {Component} from 'react';
import AceEditor from 'react-ace';
// noinspection ES6CheckImport
import {child, onValue, push, ref, set, update} from "firebase/database";

import './App.css';
import rule_runner from './rule_runner.py';
import thumb_up from './thumb-up-3x.png';
import thumb_down from './thumb-down-3x.png';
import thumb_up_red from './thumb-up-red-3x.png';
import thumb_down_red from './thumb-down-red-3x.png';
import blank from './blank.png';

import 'brace/mode/python';
import 'brace/theme/github';
import InputDisplay from "./InputDisplay";

const RULE_EXAMPLE = `\
input_text = input()
is_rule_followed = True  # Replace this.
print(is_rule_followed)
`;


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
        const inputDisplay = new InputDisplay();
        inputDisplay.setRule(ruleText);
        this.state = {
            dataSource: props.dataSource,
            gameId: '',
            playerName: '',
            isWriter: true,  // This player writes the secret rule.
            isGuessAuthor: false,  // This player wrote the latest rule guess.
            players: [],  // [{ name: name, userId: userId }]
            rule: ruleText,
            ruleState: 'new',  // or 'locked'
            currentGuess: null,  // guess in database
            newGuess: ruleGuess,  // guess being edited
            isRuleVisible: true,
            displayedGuess: null,  // or 'new' or 'current'
            canSubmitGuess: false,
            newInput: "",
            selectedInput: 0,
            canSave: canSave,
            willSave: false,
            dbUnsubscribes: [],
            inputDisplay: inputDisplay
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
        this.state.inputDisplay.setRule(ruleText);
        this.setState({
            rule: ruleText,
            inputs: this.state.inputDisplay.inputs
        })
        this.scheduleSave();
    };

    handleRuleGuessChange = ruleGuess => {
        this.setState({newGuess: ruleGuess});
        if (this.state.displayedGuess === 'new') {
            this.state.inputDisplay.setGuess(ruleGuess);
            this.scheduleSave();
        }
    };

    scheduleSave = () => {
        if (this.state.canSave && !this.state.willSave) {
            window.setTimeout(this.saveBackup, 1000);
            this.setState({willSave: true});
        }
    };

    saveBackup = () => {
        window.localStorage.zendoRule = this.state.rule;
        window.localStorage.zendoRuleGuess = this.state.newGuess;
        this.setState({willSave: false});
    };

    handleInputChange = evt => {
        this.setState({
            newInput: evt.target.value
        });
    };

    handleRuleState = () => {
        if (this.state.ruleState === 'new') {
            this.setState({ruleState: 'locked'});
            this.state.inputDisplay.clearResults();
            this.state.inputDisplay.setRule(this.state.rule, {});
            this.writeUpdates();
        }
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
        const inputIndex = Object.values(this.state.inputDisplay.inputs).length;
        let inputsPath = 'games/' + this.state.gameId + '/inputs';
        let dbInput = push(ref(this.state.dataSource.database, inputsPath));
        set(dbInput, {
            text: this.state.newInput,
            author: this.state.dataSource.userId
        });
        this.setState({
            newInput: "",
            selectedInput: inputIndex
        });
    };

    handleInputSelected = event => {
        this.setState({selectedInput: parseInt(event.target.value)});
    };

    handleNewGame = () => {
        let dbGame = push(ref(this.state.dataSource.database, 'games'));
        this.setState({gameId: dbGame.key, isWriter: true});
        let ownerRef = child(dbGame, 'players/' + this.state.dataSource.userId);
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
        let dbGame = ref(
            this.state.dataSource.database,
            'games/' + this.state.gameId);
        let pendingRef = child(dbGame, 'pending/' + this.state.dataSource.userId);
        set(pendingRef, this.state.playerName);
        let playerRef = child(dbGame, 'players/' + this.state.dataSource.userId);
        set(playerRef, {
            name: this.state.playerName,
            role: 'player'
        }).then(() => {this.registerListeners(this.state.gameId);});
        this.state.inputDisplay.setRule('');
        this.setState({isWriter: false});
    };

    handleNewGuess = () => {
        this.state.inputDisplay.setGuess(this.state.newGuess);
        this.setState({
            displayedGuess: 'new',
            canSubmitGuess: true
        });
    };

    handleCurrentGuess = () => {
        this.state.inputDisplay.setGuess('');
        this.setState({
            displayedGuess: 'current',
            canSubmitGuess: false
        });
    };

    handleSubmitGuess = () => {
        let guessRef = ref(
            this.state.dataSource.database,
            'games/' + this.state.gameId + '/guess');
        set(guessRef,
            {rule: this.state.newGuess, author: this.state.dataSource.userId});
    };

    registerListeners = (gameId) => {
        let dbGame = ref(
            this.state.dataSource.database,
            'games/' + gameId);
        let playersRef = child(dbGame, 'players')
        let inputsRef = child(dbGame, 'inputs');
        let guessRef = child(dbGame, 'guess');
        for (let unsubscribe of this.state.dbUnsubscribes) {
            unsubscribe();
        }
        let dbUnsubscribes = [];
        dbUnsubscribes.push(onValue(inputsRef, this.handleInputsUpdated));
        dbUnsubscribes.push(onValue(playersRef, this.handlePlayersUpdated));
        dbUnsubscribes.push(onValue(guessRef, this.handleGuessUpdated));
        this.setState({dbUnsubscribes: dbUnsubscribes});
    };

    handleGuessUpdated = (snapshot) => {
        let guessInfo = snapshot.val();
        if (guessInfo === null) {
            guessInfo = {rule: null};
        }
        const isGuessAuthor = guessInfo.author === this.state.dataSource.userId;
        if (isGuessAuthor) {
            this.state.inputDisplay.clearResults();
            this.state.inputDisplay.setGuess(guessInfo.rule, {});
            this.writeUpdates();
        }
        else {
            this.state.inputDisplay.setGuess('');
        }
        this.setState({
            currentGuess: guessInfo.rule,
            isGuessAuthor: isGuessAuthor
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
    };

    handleInputsUpdated = (snapshot) => {
        let inputs = snapshot.val();
        if (inputs === null) {
            inputs = {};
        }

        const display = this.state.inputDisplay,
            dbUpdates = {};
        display.setEvaluate(window.check_rule);
        if ( ! this.state.isGuessAuthor) {
            display.updateInputs(inputs);
        } else {
            display.setGuess(this.state.currentGuess, dbUpdates);
            display.clearResults();
            display.updateInputs(inputs);
            if (this.state.displayedGuess === 'new') {
                display.setGuess(this.state.newGuess);
                display.updateInputs(inputs);
            }
        }
        this.writeUpdates(dbUpdates);
        this.setState({inputDisplay: display});
    };

    writeUpdates = (dbUpdates) => {
        const display = this.state.inputDisplay,
            gameRef = ref(
                this.state.dataSource.database,
                'games/' + this.state.gameId);
        if (dbUpdates === undefined) {
            dbUpdates = {};
        }
        Object.assign(dbUpdates, display.collectUpdates());

        update(gameRef, dbUpdates);
    };

    render() {
        const selectedInputIndex = this.state.selectedInput,
            inputs = this.state.inputDisplay.inputs,
            selectedInput = Object.values(inputs)[selectedInputIndex];
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
                {this.state.isWriter && <div>
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
                    value={(selectedInput && selectedInput.ruleOutput) || ''}
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
                    <button
                        type="button"
                        onClick={this.handleRuleState}
                        disabled={this.state.ruleState === 'locked'}
                        className="small"
                    >Lock Rule</button>
                </div>}
                <div className="interactions">
                <div className="inputs">
                {Object.values(inputs).map((entry, entryIndex) => {
                    if (entry.followsRule === undefined && ! this.state.isWriter) {
                        return null;
                    }
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
                                (entry.followsGuess !== undefined &&
                                    entry.followsGuess).toString()}
                                 src={(entry.followsGuess === undefined && blank) ||
                                 ((entry.followsGuess !== entry.followsRule) &&
                                     ((entry.followsGuess && thumb_up_red) || thumb_down_red)) ||
                                 ((entry.followsGuess && thumb_up) || thumb_down)
                                 }/>
                        </label>
                    </div>;
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
                    <ul>
                    {this.state.players.map((entry, entryIndex) => {
                        return <li key={"player_name" + entryIndex}>{entry.name}</li>
                    })}
                    </ul>
                </div>
                </div>
                <p>
                <button
                    type="button"
                    onClick={this.handleNewGuess}
                    disabled={this.state.displayedGuess === 'new'}
                    className="small"
                >New Guess</button>
                <button
                    type="button"
                    disabled={ ! this.state.canSubmitGuess}
                    onClick={this.handleSubmitGuess}
                    className="small"
                >Submit Guess</button>
                <button
                    type="button"
                    disabled={this.state.currentGuess === null ||
                        this.state.displayedGuess === 'current'}
                    onClick={this.handleCurrentGuess}
                    className="small"
                >Current Guess</button>
                </p>
                {this.state.displayedGuess !== null && <div>
                    <p>Guess the rule:</p>
                    <AceEditor
                        value={this.state.displayedGuess === 'new'
                            ? this.state.newGuess
                            : this.state.currentGuess}
                        onChange={this.handleRuleGuessChange}
                        mode="python"
                        readOnly={this.state.displayedGuess !== 'new'}
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
                </div>}
            </div>
        );
    }
}

export default App;
