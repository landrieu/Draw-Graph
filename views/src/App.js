import React, { Component } from 'react';
import Parameters from './services/Parameters';
import Graph from './tools/Graph';
import './App.css';
import Stats from './components/Stats/Stats';
import Select from './components/Select/Select';
import Graphic from './components/Graph/Graph';
import axios from 'axios';

class App extends Component {
  state = {
    globalStats:      {},
    currenciesList:   [],
    currencyStats:    [],
    defaultCurrency:  "BTC",
    defaultDates:     {startTime: "2016-01-01", endTime: "2020-02-01"},
    currentCurrency:  {},
    loadingGraph:     true,
    previousGraph:    []
  } 

  getDefaultParamDates(){
    let defaultDates = this.state.defaultDates;
    let param = "startTime=" + defaultDates.startTime + "&endTime=" + defaultDates.endTime;

    return param;
  }

  componentDidMount(){
    let additionalURL = this.getDefaultParamDates();

    this.sendRequest({apiPath: "/stats/global"});
    this.sendRequest({apiPath: "/currencies/" + this.state.defaultCurrency, param: additionalURL}, this.drawCurrencyGraph);

    this.initEvents();
    this.initWebSocket();

    this.setState({previousGraph: [this.state.defaultDates]});

    window.appComponent = this;
  }

  initWebSocket(){
    var url = "ws://localhost:8082/ws";
    var ws = new WebSocket(url);
      
    var send = function(data){
      console.log(data);
      ws.send(data)
    }

    ws.onmessage = function(msg){
      var d = msg.data;
      console.log(JSON.parse(d));
    }

    ws.onopen = function(){
      setInterval( 
        function(){ send("ping") }
      , 5000 )
    }
  }

  initEvents(){
    window.onload = function(){
      window.addEventListener("mouseup", (evt) => {
      var selectElmt    = document.getElementById('currency-select');
      let list          = document.getElementById("currencies-list")
      let targetElement = evt.target;  

        do {
            if (targetElement === selectElmt || targetElement === list){
                return;
            }
            targetElement = targetElement.parentNode;
        } while (targetElement);
        list.style.display = "none";
      });
    };
  }

  loadGraph(startTime, endTime){
    if(startTime && endTime && !this.state.loadingGraph){
      let additionalURL = 'startTime=' + startTime + '&endTime=' + endTime;
      this.sendRequest({apiPath: "/currencies/" + this.state.defaultCurrency,param: additionalURL}, this.drawCurrencyGraph);
      this.setState(
        {
          loadingGraph: true, 
          previousGraph: [...this.state.previousGraph, {startTime: startTime, endTime: endTime}]
        });
    }
  }

  sendRequest(req, callback){
    let url = Parameters.API_PATH + 'api';
    url += req.apiPath || "";
    url += req.param ? "?" + req.param : "";

    axios.get(url)
      .then(res => {
        if(callback) callback(res.data);
      });
  }

  updateCurrenciesList(currenciesList){
      this.setState({currenciesList: currenciesList});
  }

  updateCurrentCurrency(currency){
    this.setState({currentCurrency: currency});
  }

  updateGraph(){
    this.setState({loadingGraph: true, previousGraph: []});
  }

  formatData = (data) => {
    return data.map((d) => {
      return {
        x: d[0],
        y: d[1]
      }
    });
  }

  drawCurrencyGraph = (data) => {
    let array = [];

    for(let k in data.results){
      array.push([new Date(k), data.results[k]["USD"][0]]);
    }

    this.setState({loadingGraph: false});

    let formattedData = this.formatData(array);
    let graphOrigin   = {x: 30, y: 40};
    let graphstyle    = {fillColor: "#397ee448"};
    let graphCurrency = new Graph("canvas", formattedData, graphOrigin, graphstyle);
    graphCurrency.init();
  }

  displayPreviousGraph = (e) => {
    e.preventDefault();
    if(!this.state.loadingGraph && this.state.previousGraph.length > 1){
      let previous = this.state.previousGraph[this.state.previousGraph.length - 2];

      this.setState({previousGraph: this.state.previousGraph.slice(this.state.previousGraph.length - 1)});
      this.loadGraph(previous.startTime, previous.endTime);
    }
  }
  
  render() {  
    return (  
      <div className="App">
        <div id="select-currency-back-button">
          <Select 
            currentCurrency={this.state.currentCurrency}
            currenciesList={this.state.currenciesList}
            updateCurrenciesList={this.updateCurrenciesList.bind(this)}
            updateCurrentCurrency={this.updateCurrentCurrency.bind(this)}
            updateGraph={this.updateGraph.bind(this)}
            sendRequest={this.sendRequest.bind(this)}
            drawCurrencyGraph={this.drawCurrencyGraph.bind(this)}
            defaultCurrency={this.state.defaultCurrency}
            getDefaultParamDates={this.getDefaultParamDates.bind(this)}
          />
          <div id="back-previous">
            <button type="button" onClick={this.displayPreviousGraph.bind()}>Previous</button>
          </div>
        </div>
        <div className="graph-container">
          <Graphic 
            loadingGraph={this.state.loadingGraph}
          />
          <Stats />
        </div>
      </div>
    );
  }
}

export default App;
