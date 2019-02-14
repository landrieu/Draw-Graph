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
    currencyStats: [],
    defaultCurrency: "bitcoin"
  } 

  componentDidMount(){
    this.sendRequest({apiPath: "/stats/currencies"});
    this.sendRequest({apiPath: "/stats/global"});
    this.sendRequest({apiPath: "/currencies/" + this.state.defaultCurrency}, this.drawCurrencyGraph);
    window.appComponent = this;
  }

  loadGraph(){
    console.log("UUUU");
    //this.setState({})
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

    var date = new Date(currencyToUSD[currencyToUSD.length - 1][0]);
    console.log(date);

    for(var i = 0; i < currencyToUSD.length; i++){
      dataToDraw.push(currencyToUSD[i]);
    }
    console.log(dataToDraw);

    Graph.drawData("canvas", dataToDraw);
  }

  render() {
    return (
      <div className="App">
        <div className="graph-container">
          <div className="canvas-container">
            <canvas id="canvas" width="700" height="300"></canvas>
            <div id="popup">
            Hello
            </div>
            <div id="vertical-line"></div>
            <div id="graph-dot"></div>
            <div id="graph-select-area"></div>
          </div>
          <div className="info-pane">
            <div className="graph-date-value">
              <div className="graph-date">Date: <span id="graph-date-text"></span></div>
              <div className="graph-value">Value: <span id="graph-value-text"></span></div>
            </div>
          </div>
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
