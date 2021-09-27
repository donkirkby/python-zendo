import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import DataSource from "./DataSource";
import App from './App';
import * as serviceWorker from './serviceWorker';

let dataSource = new DataSource();
dataSource.connect()
ReactDOM.render(<App dataSource={dataSource}/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
