import React, {Component} from 'react';
import AceEditor from 'react-ace';
import './App.css';
import rule_runner from './rule_runner.py';
import thumb_up from './thumb-up-3x.png';
import thumb_down from './thumb-down-3x.png';

import 'brace/mode/python';
import 'brace/theme/github';

class App extends Component {
    constructor() {
        super();
        let canSave = this.localStorageAvailable(),
            rule_text = canSave ? window.localStorage.text : '';
        if (rule_text === '' || rule_text === undefined) {
            rule_text = `\
input_text = input().strip()
is_rule_followed = len(input_text) <= 4
print(is_rule_followed)
`;
        }
        this.state = {
            rule: rule_text,
            stdout: "",
            is_rule_visible: true,
            visibility_button_name: "Hide Rule",
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
        this.setState({
            rule: rule_text
        });
        if (this.state.can_save && !this.state.will_save) {
            window.setTimeout(this.saveBackup, 1000);
            this.setState({will_save: true});
        }
    };

    saveBackup = () => {
        window.localStorage.text = this.state.rule;
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

    handleNewInput = () => {
        if (this.state.new_input === "") {
            return;
        }
        let rule_results = window.check_rule(
            this.state.rule,
            this.state.new_input);
        let is_rule_followed = rule_results[0],
            output_text = rule_results[1];
        this.setState({
            new_input: "",
            stdout: output_text,
            inputs: this.state.inputs.concat([{
                text: this.state.new_input,
                follows_rule: is_rule_followed
            }])
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
                        $blockScrolling: Infinity,
                        visibility: this.state.rule_visibility
                    }}
                    setOptions={{
                        showLineNumbers: false,
                        tabSize: 4,
                    }}/>}
                <p>Output:</p>
                {this.state.is_rule_visible && <AceEditor
                    value={this.state.stdout}
                    theme="github"
                    width="100%"
                    height="10em"
                    fontSize={18}
                    showPrintMargin={true}
                    showGutter={false}
                    highlightActiveLine={true}
                    editorProps={{
                        $blockScrolling: Infinity,
                        visibility: this.state.rule_visibility
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
                        </li>
                    ))}
                </ul>
                <input
                    type="text"
                    placeholder="Type input here."
                    value={this.state.new_input}
                    onChange={this.handleInputChange}/>
                <button type="button" onClick={this.handleNewInput} className="small">Tell</button>
            </div>
        );
    }
}

export default App;
