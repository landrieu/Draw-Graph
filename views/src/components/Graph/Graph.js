import React, { Component } from 'react';
//import logo from './logo.svg';
import loading from '../../loading.svg';

export default class Graph extends Component {
    componentDidMount(){

    }

    renderGraph() {
        if(this.props.loadingGraph){
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
    render(){
        return(
            <div>
                {this.renderGraph()}
            </div>
        )
    }
}