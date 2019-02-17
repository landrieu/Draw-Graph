import React, { Component } from 'react';
import Parameters from './services/Parameters';
import Graph from './tools/Graph';
//import logo from './logo.svg';
import loading from './loading.svg';
import './App.css';
import axios from 'axios';

class App extends Component {
  state = {
    globalStats: {},
    currenciesList: [],
    currencyStats: [],
    defaultCurrency: "bitcoin",
    currentCurrency: {},
    loadingGraph: true 
  } 

  componentDidMount(){
    this.sendRequest({apiPath: "/stats/currencies"}, this.initSelectCurrency);
    this.sendRequest({apiPath: "/stats/global"});
    this.sendRequest({apiPath: "/currencies/" + this.state.defaultCurrency}, this.drawCurrencyGraph);

    this.initEvents();
    this.initWebSocket();

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
    let tmpElement, tmpImageNode, tmpValueNode, tmpImageContainer, tmpValueContainer;
    let currenciesListDiv = document.getElementById("currencies-list");
    let that = this;

    for(let i = 0; i < nbCurrencyToDisplay; i++){
      tmpElement = document.createElement("div");
      tmpElement.setAttribute("class", "currency-element");
      tmpElement.setAttribute("value", currenciesList[i].slug);
      //tmpElement.setAttribute("onclick", "selectCurrency(" + currenciesList[i].slug + ")");
      tmpImageContainer = document.createElement("div");
      tmpImageContainer.setAttribute("class", "currency-image-container");
      tmpValueContainer = document.createElement("div");
      tmpValueContainer.setAttribute("class", "currency-value-container");
      tmpImageNode = document.createElement("img");
      tmpImageNode.setAttribute("class", "currency-image");
      tmpImageNode.setAttribute("src", "https://s2.coinmarketcap.com/static/img/coins/32x32/" + currenciesList[i].id + ".png");
      tmpValueNode = document.createElement("span");
      tmpValueNode.innerHTML = currenciesList[i].name;
      tmpImageContainer.appendChild(tmpImageNode);
      tmpElement.appendChild(tmpImageContainer);
      tmpValueContainer.appendChild(tmpValueNode);
      tmpElement.appendChild(tmpValueContainer);
      currenciesListDiv.appendChild(tmpElement);

      if(this.state.defaultCurrency === currenciesList[i].slug){
        this.setState({currentCurrency: currenciesList[i]});
      }
    }

    let currencyElementArray = document.getElementsByClassName("currency-element");

    Array.from(currencyElementArray).forEach(function(element) {
      element.addEventListener('click', (event) => {
        let currencySelected = event.currentTarget.getAttribute("value");
        that.selectCurrency(currencySelected);
      });
    });

    this.setState({currenciesList: currenciesList});
  }

  formatData = (data) => {
    return data.map((d) => {
      return {
        x: d[0],
        y: d[1]
      }
    });
  }

  selectCurrency = (currencySelected) => {
    console.log("bui");
    let list = document.getElementById("currencies-list");
    if(list){
      list.style.display = "none";
      let currenciesList = this.state.currenciesList;
      let newCurrency = {};
      
      for(let i = 0; i < 50; i++){
        if(currencySelected === currenciesList[i].slug){
          newCurrency = currenciesList[i];
          this.setState({currentCurrency: newCurrency});
          break;
        }
      }
      this.sendRequest({apiPath: "/currencies/" + newCurrency.slug}, this.drawCurrencyGraph);
      this.setState({loadingGraph: true});
    }
  }
 
  drawCurrencyGraph = (data) => {
    let currencyToUSD = data.results.Price_usd;
    //let dataToDraw = [];
    /*let sampling = function(d){
      if(d.length < 400) return d;
      
    };*/

    /*for(var i = 0; i < currencyToUSD.length; i++){
      dataToDraw.push(currencyToUSD[i]);
    }*/

    this.setState({loadingGraph: false});

    let formattedData = this.formatData(currencyToUSD);
    let graphOrigin   = {x: 30, y: 40};
    let graphstyle    = {fillColor: "#397ee448"};
    let graphCurrency = new Graph("canvas", formattedData, graphOrigin, graphstyle);
    graphCurrency.init();
  }

  getCurrencyImage = (imageID) => {
    let imagePath;
    if(imageID){
      imagePath = "https://s2.coinmarketcap.com/static/img/coins/32x32/" + imageID + ".png";
    }

    return imagePath;
  }

  clickArrow = () => {
    let list = document.getElementById("currencies-list");
    if(list){
      list.style.display = "block";
    }
    
  }

  renderSelectCurrency() {
    return(
      <div id="select-container">
        <div id="currency-select">
          <div className="currency-image-container">
            <img className="currency-image" alt={"Currency's image " + this.state.currentCurrency.id} src={this.getCurrencyImage(this.state.currentCurrency.id)}/>
          </div>
          <div className="currency-value-container">
            <span>{this.state.currentCurrency.name}</span>
          </div>
          <div className="down-arrow-container" onClick={this.clickArrow.bind()}>
            <div></div>
          </div>
        </div>
        <div id="currencies-list"></div>
      </div>
    )
  }

  renderGraph() {
    console.log(this.state.loadingGraph);
    if(this.state.loadingGraph){
      return(
        <div className="loading-container">
          <img src={loading} className="App-logo" alt="logo" />
        </div>
      )
    }else{
      return(
      <div id="canvas-container">
        <canvas id="canvas" width="800" height="500"></canvas>
        <div id="popup"></div>
        <div id="vertical-line"></div>
        <div id="horizontal-line"></div>
        <div id="graph-dot"></div>
        <div id="graph-select-area"></div>
      </div>
      )
    }
  }
  //<select id="select-currency-display" onChange={this.selectCurrency.bind(this)}></select>
  render() {  
    return (  
      <div className="App">
        <div className="select-currency">
          {this.renderSelectCurrency()}
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
      </div>
    );
  }
}

export default App;
