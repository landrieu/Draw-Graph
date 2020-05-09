import React, { Component } from 'react'

export default class Select extends Component {
    componentDidMount(){
        console.log(this.props);
        this.props.sendRequest({apiPath: "/stats/currencies"}, this.initSelectCurrency);
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
          tmpElement.setAttribute("value", currenciesList[i].symbol);
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
    
          if(this.props.defaultCurrency === currenciesList[i].symbol){
            this.props.updateCurrentCurrency(currenciesList[i]);
          }
        }
    
        let currencyElementArray = document.getElementsByClassName("currency-element");
    
        Array.from(currencyElementArray).forEach(function(element) {
          element.addEventListener('click', (event) => {
            let currencySelected = event.currentTarget.getAttribute("value");
            that.selectCurrency(currencySelected);
          });
        });
    
        this.props.updateCurrenciesList(currenciesList);
    }

    selectCurrency = (currencySelected) => {
        let list = document.getElementById("currencies-list");
        console.log("fz",currencySelected);
        if(list){
          list.style.display = "none";
          let currenciesList = this.props.currenciesList;
          let newCurrency = {};
          
          for(let i = 0; i < 50; i++){
            if(currencySelected === currenciesList[i].symbol){
              newCurrency = currenciesList[i];
              this.props.updateCurrentCurrency(newCurrency);
              break;
            }
          }
    
          let additionalURL = this.props.getDefaultParamDates();
          this.props.sendRequest({apiPath: "/currencies/" + newCurrency.symbol, param: additionalURL}, this.props.drawCurrencyGraph);
          this.props.updateGraph();
        }
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
                <img className="currency-image" alt={"Currency's image " + this.props.currentCurrency.id} src={this.getCurrencyImage(this.props.currentCurrency.id)}/>
                </div>
                <div className="currency-value-container">
                <span>{this.props.currentCurrency.name}</span> 
                </div>
                <div className="down-arrow-container" onClick={this.clickArrow.bind()}>
                <div></div>
                </div>
            </div>
            <div id="currencies-list"></div>
            </div>
        )
    }

    render(){
        return(
            <div className="select-currency">
                {this.renderSelectCurrency()}
            </div>
        )
    }
}