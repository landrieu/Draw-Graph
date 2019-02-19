
var defaultParameters = {
    origin: {
        x: 60,
        y: 60
    },
    style:{
        strokeColor: "#397ee4",//"#048202",//"#6e0370",//
        fillColor:   "#397ee448",//"#13951148",//"#970f8d48",//
        axisColor:   "#a4a4a4"
    },
    elementsID: {
        graphVerticalLine:   "vertical-line",
        graphHorizontalLine: "horizontal-line",
        graphDot:            "graph-dot",
        graphSelectedArea:   "graph-select-area",
        graphY:              "graph-date-text",
        graphX:              "graph-value-text",
        popup:               "popup"
    },
    dragPosition:{
        x: undefined, 
        y: undefined
    }
}

var Graph = function(graphName, data = [], origin = {}, style, options = {}) {
    this.name         = graphName;
    this.data         = data;
    this.origin       = origin || defaultParameters.origin;
    this.style        = defaultParameters.style;
    this.dragPosition = defaultParameters.dragPosition;
    this.traceDots    = options.traceDots || false;
    this.showPopup    = options.showPopup || false;
    this.fillGraph    = options.fillGraph || true;
    //this.showHorizLine
    this.elementsID   = options.elementsID || defaultParameters.elementsID;
    this.points       = [];
    this.position     = {};
    this.size         = {};

    if(style){
        for(var k in style){
            this.style[k] = style[k];
        }
    }
}

Graph.prototype.init = function(){
    this.setProperties();

    this.initEvents();

    this.draw();
}

Graph.prototype.formatData = function(){
    let values   = this.data.map((d) => {return d.y});
    let maxLimit = Math.max.apply(null, values);
    let minLimit = Math.min.apply(null, values);
        
    var changeScale = function(v){
        let max = 1;
        let min = 0;
        let ratio = (((max - min) / (maxLimit - minLimit)) * (v - maxLimit)) + max;
            
        return ratio;
    }

    let offsetTop = (this.size.height / 100) * 5;
    let maxValue  = (this.size.height - offsetTop) - this.origin.y;
    let offsetY   = this.origin.y;
    let newData   = this.data.map((n) => {
            return {
                date:      formatEpochTime(n.x),
                rawDate:   n.x,
                value:     n.y,
                positionY: (changeScale(n.y) * maxValue) + offsetY,
        };
    });

    this.data = newData;
}

Graph.prototype.clear = function(){
    let cvs = document.getElementById(this.name);
    let ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);
}

Graph.prototype.draw = function(){
    this.formatData();

    this.traceData();

    this.fillSpaceUnderGraph()

    this.traceAxis();
}

Graph.prototype.fillSpaceUnderGraph = function(){

    var cvs = document.getElementById(this.name);

    if (!cvs.getContext) return;

    var ctx = cvs.getContext('2d');

    if(this.fillGraph){
        /*Fill space under graph*/
        ctx.lineTo(this.origin.x + this.size.width,  this.size.width);
        ctx.lineTo(this.origin.x + this.size.width,  this.size.height - this.origin.y);
        ctx.lineTo(this.origin.x, this.size.height - this.origin.y);
        ctx.fillStyle = this.style.fillColor;
        ctx.fill();
        ctx.closePath();
    }
}

Graph.prototype.traceData = function(){

    var cvs = document.getElementById(this.name);
    var stepPosition = this.origin.x;
    var stepSize = (this.size.width - this.origin.x) / (this.data.length - 1);
    var ctx;

    if (cvs.getContext) {

        ctx = cvs.getContext('2d');
        
        this.clear();

        ctx.beginPath();
        ctx.moveTo(stepPosition, this.size.height - this.data[0].positionY);
        
        for(let i = 0; i < this.data.length; i++){
            ctx.lineTo(stepPosition, this.size.height - this.data[i].positionY);

            if(this.traceDots){
                ctx.fillRect(stepPosition - 1, this.size.height - (this.data[i].positionY) - 1,3,3);
            }
            
            this.points.push({
                ...this.data[i],
                left:    stepPosition,
                top:     this.size.height - this.data[i].positionY,
                height:  1,
                width:   1,
            });
            stepPosition += stepSize;
        }
        
        ctx.strokeStyle = this.style.strokeColor;
        ctx.stroke();
    }
}

Graph.prototype.traceAxis = function(){

    var cvs = document.getElementById(this.name);

    if (!cvs.getContext) return;

    var ctx = cvs.getContext('2d');

    /*Y axis*/
    ctx.beginPath();
    ctx.moveTo(this.origin.x, 0);
    ctx.lineTo(this.origin.x, this.size.height - this.origin.y);
    ctx.strokeStyle = this.style.axisColor;
    ctx.stroke();
    ctx.closePath();
    
    /*X axis*/
    ctx.beginPath();
    ctx.moveTo(this.origin.x ,  this.size.height - this.origin.y);
    ctx.lineTo(this.size.width, this.size.height - this.origin.y);
    ctx.strokeStyle = this.style.axisColor;
    ctx.stroke();
    ctx.closePath();
}

Graph.prototype.setProperties = function(){
    var canvas = document.getElementById(this.name);

    if(canvas){
        this.position.x = canvas.offsetLeft;
        this.position.y = canvas.offsetTop;
        this.size.height = canvas.height;
        this.size.width = canvas.width;
    }  
}

Graph.prototype.initEvents = function(){

    let canvas = document.getElementById(this.name);
    canvas.addEventListener("mousemove", (event) => {
        this.handleMousemove(event);
    })
    canvas.addEventListener("mousedown", (event) => {
        this.handleMouseDown(event);
    })
    canvas.addEventListener("mousemove", (event) => {
        this.handleMousemove(event);
    });
    canvas.addEventListener("mouseup", (event) => {
        this.handleMouseUp(event);
    });

    let verticalLine = document.getElementById(this.elementsID.graphVerticalLine);
    verticalLine.addEventListener("mousedown", (event) => {
        this.handleMouseDown(event);
    });
    verticalLine.addEventListener("mouseup", (event) => {
        this.handleMouseUp(event);
    });

    document.addEventListener("mouseup", (event) => {
        this.handleMouseUp(event, true);
    });
}

Graph.prototype.updateGraph = function(startDrag, endDrag){
    if(startDrag > endDrag) return;
    let startDate, endDate;
    startDrag = startDrag - this.position.x;
    endDrag   = endDrag - this.position.x;

    for(let i = 1; i < this.points.length; i++){
        if(this.points[i - 1].left < startDrag && this.points[i].left > startDrag){
            startDate = this.points[i - 1].rawDate;
        }
        if(this.points[i - 1].left < endDrag && this.points[i].left > endDrag){
            endDate = this.points[i - 1].rawDate;
        }
        if(startDate && endDate) break;
    }

    let deltaDate  = endDate - startDate;
    let dayInEpoch = 86400000;
    if(deltaDate < dayInEpoch) return;

    window.appComponent.loadGraph(startDate, endDate);
}

Graph.prototype.handleMouseUp = function(event, fromDocument){
    event.preventDefault();
    event.stopPropagation();
    let selectedArea = document.getElementById(this.elementsID.graphSelectedArea);

    if(fromDocument){
        if(!this.dragPosition.x) return;

        let cvsBounding = document.getElementById(this.name).getBoundingClientRect();
        let selectedAreaBounding = selectedArea.getBoundingClientRect();

        if(event.clientX > (cvsBounding.width + cvsBounding.x) || event.clientY > (cvsBounding.y + cvsBounding.height) || event.clientY < (cvsBounding.y)){
            this.updateGraph(this.dragPosition.x, selectedAreaBounding.width + selectedAreaBounding.x);
        }
    }else{
        this.updateGraph(this.dragPosition.x, event.clientX);
    }
    
    selectedArea.style.width  = '0px';
    this.dragPosition.x = undefined;
}

Graph.prototype.handleMouseDown = function(event){
    event.preventDefault();
    event.stopPropagation();
    let selectedArea = document.getElementById(this.elementsID.graphSelectedArea);
    selectedArea.style.height = (this.size.height - this.origin.y) + 'px';
    selectedArea.style.top    = (this.position.y) + 'px';
    selectedArea.style.left   = event.clientX + 'px';
    this.dragPosition.x       = event.clientX;
}

Graph.prototype.handleMousemove = function(e){
    e.preventDefault();
    e.stopPropagation();

    this.setProperties();

    var x = parseInt(e.clientX - this.position.x);
    var found = false;
    let point;
    if(this.dragPosition.x){
        let selectedArea = document.getElementById(this.elementsID.graphSelectedArea);
        let areaWidth = e.clientX - this.dragPosition.x;
        selectedArea.style.width = areaWidth + 'px';
        //return;
    }

    if(this.points){
        for(let i = 1; i < this.points.length; i++){
            point = this.points[i];

            if(this.points[i - 1].left < x && this.points[i].left > x){
                found = true;
                break;
            }
        }

        if(!found) return;
        
        this.traceGraphElemets(point, e, found);
    }   
}

Graph.prototype.traceGraphElemets = function(point, e, found){

    //Display popup
    if(this.showPopup){
        let div = document.getElementById(this.elementsID.popup);
        div.style.left = (e.clientX - 80) + 'px';
        div.style.top  = (this.position.y + point.top) -30 + 'px';
        div.innerHTML  = point.value; 
        div.style.display = found ? "block" : "none";
    }

    //Trace vertical line
    var line = document.getElementById(this.elementsID.graphVerticalLine);
    line.style.left     = (point.left + this.position.x) +'px';
    line.style.top      = (this.position.y + point.top) +'px';
    line.style.height   = (this.size.height - (point.top)) - this.origin.y +'px';

    //Trace Horizontal line
    var horizLine = document.getElementById(this.elementsID.graphHorizontalLine);
    horizLine.style.left     = this.position.x + this.origin.x + 'px';
    horizLine.style.top      = (this.position.y + point.top)   + 'px';
    horizLine.style.width    = (point.left - this.origin.x)    + 'px';

    //Trace dot
    var dot = document.getElementById(this.elementsID.graphDot);
    dot.style.top       = (this.position.y + point.top   - (dot.clientHeight / 2)) +'px';
    dot.style.left      = (point.left + this.position.x) - (dot.clientWidth / 2)   +'px';

    //Display info on the left pane
    document.getElementById(this.elementsID.graphY).innerHTML = point.value;
    document.getElementById(this.elementsID.graphX).innerHTML = point.date;

}

function formatEpochTime(date){
    var normalize = (a) => {
        if(Number(a) < 10){
            a = "0" + a;
        }
        return a;
    }
    let tmpDate = new Date(date);
    let pointDate = normalize(tmpDate.getDate()) + '/' + normalize((tmpDate.getMonth() + 1)) + '/' + tmpDate.getFullYear();
    pointDate += ' ' + normalize(tmpDate.getHours()) + ':' + normalize(tmpDate.getMinutes());
    
    return pointDate;
}

export default Graph;
            
        /* ctx.beginPath();
            ctx.moveTo(0, 50);
            ctx.lineTo(width + originXPosition, 50);
            ctx.strokeStyle = "#a4a4a4c7";
            ctx.stroke();
            ctx.fillStyle = "#121212";
            ctx.fillText('50', 0, 50);
            ctx.closePath();
            
            ctx.beginPath();
            ctx.moveTo(0, 25);
            ctx.lineTo(width + originXPosition, 25);
            ctx.strokeStyle = "#a4a4a4c7";
            ctx.stroke();
            ctx.fillStyle = "#121212";
            ctx.fillText('75', 0, 25);
            ctx.closePath();
            
            ctx.beginPath();
            ctx.moveTo(0, 75);
            ctx.lineTo(width + originXPosition, 75);
            ctx.strokeStyle = "#a4a4a4c7";
            ctx.stroke();
            ctx.fillStyle = "#121212";
            ctx.fillText('25', 0, 75);
            ctx.closePath();*/
            
            /*ctx.beginPath();
            ctx.moveTo(100, 0);
            ctx.lineTo(width + originXPosition, height);
            ctx.strokeStyle = "#a4a4a4c7";
            ctx.stroke();
            ctx.fillStyle = "#121212";
            ctx.fillText('0', 0, 100);
            ctx.closePath();*/