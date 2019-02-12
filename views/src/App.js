import React, { Component } from 'react';
import Parameters from './services/Parameters';
import Graph from './tools/Graph';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

class App extends Component {
  state = {
    globalStats: {},
    currenciesList: [],
    currencyStats: []
  } 

  componentDidMount(){
    this.sendRequest({apiPath: "/stats/currencies"});
    this.sendRequest({apiPath: "/stats/global"});
    this.sendRequest({apiPath: "/currencies/bitcoin"}, this.drawCurrencyGraph);
  }

  sendRequest(req, callback){
    let url = Parameters.API_PATH + 'api';
    url += req.apiPath || "";
    url += req.param ? "/" + req.param : "";

    axios.get(url)
      .then(res => {
        //console.log(res.data);
        if(callback) callback(res.data);
      });
  }

  drawCurrencyGraph(data){
    let currencyToUSD = data.results.Price_usd;
    let dataToDraw = [];
    let sampling = function(d){
      if(d.length < 400) return d;
      
    }

    for(let i = 0; i < 800; i++){
      dataToDraw.push(currencyToUSD[i][1]);
    }
    console.log(dataToDraw);

    Graph.drawData("canvas", dataToDraw);
  }

  render() {
    return (
      <div className="App">
        <div className="canvas-container">
          <canvas id="canvas" width="700" height="300"></canvas>
          <div id="popup">
          Hello
          </div>
          <div id="vertical-line"></div>
        </div>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
