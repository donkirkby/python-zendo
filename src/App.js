import React, { Component } from 'react';
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
    this.state = {
      rule: `\
input_text = input()
is_rule_followed = len(input_text) <= 4
print(is_rule_followed)
`,
      is_rule_visible: true,
      visibility_button_name: "Hide Rule",
      new_input: "",
      inputs: []  // [{ text: "...", follows_rule: true}]
    };

    if (window.languagePluginLoader === undefined) {
        console.log('Pyodide is not loaded.');
    } else {
        window.languagePluginLoader.then(function() {
            fetch(rule_runner).then(function (response) {
                return response.text();
            }).then(function (rule_runner_source) {
                window.pyodide.runPython(rule_runner_source);
            });
        });
    }
  }

  handleRuleChange = rule_text => {
    this.setState({
      rule: rule_text
    });
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
    let is_rule_followed = window.is_rule_followed(
        this.state.rule,
        this.state.new_input);
    this.setState({
        new_input: "",
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
            fontSize={18}
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            editorProps={{
                $blockScrolling: Infinity,
                visibility: this.state.rule_visibility
            }}
            setOptions={{
                showLineNumbers: true,
                tabSize: 4,
            }}/>}
          <ul>
          {this.state.inputs.map((entry, entry_index) => (
              <li key={"item" + entry_index}>
                <img src={(entry.follows_rule && thumb_up) || thumb_down}/>
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
