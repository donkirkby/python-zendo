import React, { Component } from 'react';
import AceEditor from 'react-ace';
import './App.css';

import 'brace/mode/python';
import 'brace/theme/github';

class App extends Component {
  constructor() {
    super();
    this.state = {
      rule: "",
      is_rule_visible: true,
      visibility_button_name: "Hide Rule",
      inputs: []  // [{ text: "...", follows_rule: true}]
    };
  }

  handleRuleChange = rule_text => {
    this.setState({
      rule: rule_text
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

  render() {
    return (
      <div className="App">
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
      </div>
    );
  }
}

export default App;
