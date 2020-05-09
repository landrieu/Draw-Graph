import React, { Component } from 'react'

export default class Stats extends Component {
    componentDidMount(){
        console.log(this.props);

    }

    render(){
        return(
            <div className="info-pane">
                <div className="graph-date-value">
                <div className="graph-date">Date: <span id="graph-date-text"></span></div>
                <div className="graph-value">Value: <span id="graph-value-text"></span></div>

                <div className="graph-date">Date from: <span id="graph-from-date-text"></span></div>
                <div className="graph-value">Variation (%): <span id="graph-variation-pct-text"></span></div>
                <div className="graph-value">Variation (pts): <span id="graph-variation-pts-text"></span></div>
                </div>
            </div>
        )
    }
}