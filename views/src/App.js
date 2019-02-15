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
    defaultCurrency: "dash",
    loadingGraph: true 
  } 

  componentDidMount(){
    this.sendRequest({apiPath: "/stats/currencies"}, this.initSelectCurrency);
    this.sendRequest({apiPath: "/stats/global"});
    this.sendRequest({apiPath: "/currencies/" + this.state.defaultCurrency}, this.drawCurrencyGraph);
    window.appComponent = this;
  }

  loadGraph(startTime, endTime){

    console.log("UUUU: " + startTime, endTime);
    if(startTime && endTime){
      let additionalURL = 'startTime=' + startTime + '&endTime=' + endTime;
      this.sendRequest({apiPath: "/currencies/" + this.state.defaultCurrency,param: additionalURL}, this.drawCurrencyGraph);
      this.setState({loadingGraph: true});
    }
  }

  sendRequest(req, callback){
    let url = Parameters.API_PATH + 'api';
    url += req.apiPath || "";
    url += req.param ? "?" + req.param : "";

    axios.get(url)
      .then(res => {
        //console.log(res.data);
        if(callback) callback(res.data);
      });
  }

  initSelectCurrency = (data) => {
    
    let currenciesList = data.results;
    let nbCurrencyToDisplay = 50;
    let selectCurrencyComponent = document.getElementById("select-currency-display");
    let tmpElement, tmpTextNode;

    for(let i = 0; i < nbCurrencyToDisplay; i++){
      tmpElement = document.createElement("option");
      tmpElement.setAttribute("value", currenciesList[i].slug);
      tmpTextNode = document.createTextNode(currenciesList[i].name);
      tmpElement.appendChild(tmpTextNode);
      selectCurrencyComponent.appendChild(tmpElement);
    }
  }

  selectCurrency = (c) => {
    console.log(c);
  }
 
  drawCurrencyGraph = (data) => {
    let currencyToUSD = data.results.Price_usd;
    let dataToDraw = [];
    let sampling = function(d){
      if(d.length < 400) return d;
      
    };

    //var date = new Date(currencyToUSD[currencyToUSD.length - 1][0]);

    for(var i = 0; i < currencyToUSD.length; i++){
      dataToDraw.push(currencyToUSD[i]);
    }

    this.setState({loadingGraph: false});
    let startTime = new Date();
    Graph.drawData("canvas", dataToDraw);

    let endTime = new Date();
    let timeDiff = endTime - startTime; //in ms
    var seconds = Math.round(timeDiff);
    console.log(seconds + " mseconds");   
  }

  renderGraph() {
    console.log(this.state.loadingGraph);
    if(this.state.loadingGraph){
      return(
        <img src={logo} className="App-logo" alt="logo" />
      )
    }else{
      return(
        <div className="canvas-container">
        <canvas id="canvas" width="700" height="300"></canvas>
        <div id="popup">
        Hello
        </div>
        <div id="vertical-line"></div>
        <div id="graph-dot"></div>
        <div id="graph-select-area"></div>
      </div>
      )
    }
  }
 
  render() {  
    return (  
      <div className="App">
        <div className="select-currency">
          <select id="select-currency-display" onChange={this.selectCurrency.bind(this.value)}></select>
        </div>
        <div className="graph-container">
          {this.renderGraph()}
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
