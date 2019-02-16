export default {
    points: [],
    elementsID: {
        graphLine:          "vertical-line",
        graphDot:           "graph-dot",
        graphSelectedArea:  "graph-select-area",
        graphY:             "graph-date-text",
        graphX:             "graph-value-text"
    },
    style:{
        strokeColor: "#397ee4",
        fillColor:   "#397ee448",
        axisColor:   "#a4a4a4"
    },
    graphOrigin: {
        x: 60,
        y: 60
    },
    canvas: {
        name: "",
        position:{
            x: 0,
            y: 0
        },
        size:{
            height: 0,
            width: 0
        }
    },
    dragPosition:{
        x: undefined, 
        y: undefined
    },

    drawCanvas: function (data) {
        
        var cvs = document.getElementById(this.canvas.name);
        var originXPosition = this.graphOrigin.x;
        var originYPosition = this.graphOrigin.y;
        var stepPosition = originXPosition;
        var width = cvs.width;
        var height = cvs.height;
        var stepSize = (width - originXPosition) / (data.length - 1);
        var ctx;
        
        data = this.getPercentage(data, height);

        if (cvs.getContext) {

            ctx = cvs.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            ctx.beginPath();
            ctx.moveTo(stepPosition, height - data[0].positionY);
            
            for(let i = 0; i < data.length; i++){
                ctx.lineTo(stepPosition, height - data[i].positionY);
                /*ctx.fillRect(stepPosition - 1,height - (data[i].positionY) - 1,3,3);*/
                this.points.push({
                    left:    stepPosition,
                    top:     height - data[i].positionY,
                    height:  1,
                    width:   1,
                    value:   data[i].value,
                    date:    data[i].date,
                    rawDate: data[i].rawDate
                });
                stepPosition += stepSize;
            }
            
            ctx.strokeStyle = this.style.strokeColor;
            ctx.stroke();
            
            /*Fill space under graph*/
            ctx.lineTo(stepPosition,    width);
            ctx.lineTo(stepPosition,    height - originYPosition);
            ctx.lineTo(originXPosition, height -originYPosition);
            ctx.fillStyle = this.style.fillColor;
            ctx.fill();
            ctx.closePath();
            
            /*Y axis*/
            ctx.beginPath();
            ctx.moveTo(originXPosition, 0);
            ctx.lineTo(originXPosition, height - originYPosition);
            //ctx.lineTo(width + originXPosition, width + originXPosition);
            ctx.strokeStyle = this.style.axisColor;
            ctx.stroke();
            ctx.closePath();
            
            /*X axis*/
            console.log("fz"+ width);
            ctx.beginPath();
            ctx.moveTo(originXPosition , height - originYPosition);
            ctx.lineTo(width,            height - originYPosition);
            //ctx.lineTo(width + originXPosition, width + originXPosition);
            ctx.strokeStyle = this.style.axisColor;
            ctx.stroke();
            ctx.closePath();
        }
    },

    drawData: function (canvasName, data){
        this.points = [];
        this.setCanvasParameters(canvasName);
        document.getElementById(canvasName).addEventListener("mousemove", (event) => {
            this.handleMousemove(event);
        });

        document.getElementById(canvasName).addEventListener("mousedown", (event) => {
            this.handleMouseDown(event);
        });
        document.getElementById(this.elementsID.graphLine).addEventListener("mousedown", (event) => {
            this.handleMouseDown(event);
        });

        /*document.getElementById("canvas-container").addEventListener("mouseleave", (event) => {
            console.log("out");
        });*/

        document.addEventListener("mouseup", (event) => {

            if(!this.dragPosition.x) return;

            let cvsBounding = document.getElementById(this.canvas.name).getBoundingClientRect();
            let selectedArea = document.getElementById(this.elementsID.graphSelectedArea);
            let selectedAreaBounding = selectedArea.getBoundingClientRect();

            if(event.clientX > (cvsBounding.width + cvsBounding.x) || event.clientY > (cvsBounding.y + cvsBounding.height) || event.clientY < (cvsBounding.y)){
                this.updateGraph(this.dragPosition.x, selectedAreaBounding.width + selectedAreaBounding.x);
            }/*else if(event.clientX < cvsBounding.x){
                console.log("Do nothing");
            }else{
                console.log("Nothing");
            }*/
            
            selectedArea.style.width  = '0px';
            this.dragPosition.x = undefined;
        });

        document.getElementById(canvasName).addEventListener("mouseup", (event) => {
            event.preventDefault();
            event.stopPropagation();
            let selectedArea = document.getElementById(this.elementsID.graphSelectedArea);

            this.updateGraph(this.dragPosition.x, event.clientX);
            selectedArea.style.width  = '0px';
            this.dragPosition.x = undefined;
        });

        document.getElementById(this.elementsID.graphSelectedArea).addEventListener("mousemove", (event) => {
            this.handleMousemove(event);
        });

        this.drawCanvas(data);
    },

    setCanvasParameters: function(canvasName){
        if(canvasName){
            this.canvas.name = canvasName;
        }

        var canvas = document.getElementById(this.canvas.name);

        if(canvas){
            this.canvas.position.x = canvas.offsetLeft;
            this.canvas.position.y = canvas.offsetTop;
            this.canvas.size.height = canvas.height;
            this.canvas.size.width = canvas.width;
        }  
    },

    formatEpochTime : function(date){
        let tmpDate = new Date(date);
        let pointDate = tmpDate.getDate() + '/' + (tmpDate.getMonth() + 1) + '/' + tmpDate.getFullYear();
        pointDate += ' ' + tmpDate.getHours() + ':' + tmpDate.getMinutes();
        
        return pointDate;
    },

    getPercentage: function(data, height){
        
        let values = data.map((d) => {return d.y});
        let maxLimit = Math.max.apply(null, values);
        let minLimit = Math.min.apply(null, values);
        
        //let total = 0;
        //data.forEach((n) => total += n.y);

        /*Space 5% between highest value and canvas top*/

        var changeScale = function(v){
            let max = 1;
            let min = 0;
            let ratio = (((max - min) / (maxLimit - minLimit)) * (v - maxLimit)) + max;
             
            return ratio;
        }

        let offsetTop = (height / 100) * 5;
        let maxValue = height - (offsetTop) - this.graphOrigin.y;
        let offsetY  = this.graphOrigin.y;

        let newData = data.map((n) => {
                return {
                    date:      this.formatEpochTime(n.x),
                    rawDate:   n.x,
                    value:     n.y,
                    positionY: (changeScale(n.y) * maxValue) + offsetY,
                    //percent:   ((n.y) / (maxLimit + offsetTop)),
            };
        });

        return newData;
    },

    handleMouseDown: function(event){
        event.preventDefault();
        event.stopPropagation();
        let selectedArea = document.getElementById(this.elementsID.graphSelectedArea);
        selectedArea.style.height = (this.canvas.size.height - this.graphOrigin.y) + 'px';
        selectedArea.style.top    = (this.canvas.position.y) + 'px';
        selectedArea.style.left   = event.clientX + 'px';
        this.dragPosition.x       = event.clientX;
    },

    handleMouseUp: function(e){
        
        console.log("here");
    },

    handleMousemove(e){
        e.preventDefault();
        e.stopPropagation();
        this.setCanvasParameters();

        var cvs = this.canvas;
        var x = parseInt(e.clientX - cvs.position.x);
       // var found = false;
        let point;
        if(this.dragPosition.x){
            let selectedArea = document.getElementById(this.elementsID.graphSelectedArea);
            let areaWidth = e.clientX - this.dragPosition.x;
            selectedArea.style.width = areaWidth + 'px';
            return;
        }

        if(this.points){
            for(let i = 1; i < this.points.length; i++){
                point = this.points[i];
                //if (x > point.left && x < point.left + point.width) {
                if(this.points[i - 1].left < x && this.points[i].left > x){
                    //var div = document.getElementById('popup');
                    //div.style.left = (e.clientX - 80) +'px';
                    //div.style.top = point.top +'px';
                    //div.innerHTML = point.value; 
                    //found = true;
                    break;
                }
            }
            //div = document.getElementById('popup');
            //div.style.display = found ? "block" : "none";

            var line = document.getElementById(this.elementsID.graphLine);
            line.style.left     = (point.left + cvs.position.x) +'px';
            line.style.top      = (cvs.position.y + point.top) +'px';
            line.style.height   = (cvs.size.height - (point.top)) - this.graphOrigin.y +'px';

            var horizLine = document.getElementById("horizontal-line");
            horizLine.style.left     = cvs.position.x + this.graphOrigin.x +'px';
            horizLine.style.top      = (cvs.position.y + point.top) +'px';
            horizLine.style.width    = (point.left - this.graphOrigin.x)+'px';

            var dot = document.getElementById(this.elementsID.graphDot);
            dot.style.top       = (cvs.position.y + point.top - (dot.clientHeight / 2)) +'px';
            dot.style.left      = (point.left + cvs.position.x) - (dot.clientWidth / 2) +'px';

            document.getElementById(this.elementsID.graphY).innerHTML = point.value;
            document.getElementById(this.elementsID.graphX).innerHTML = point.date;
        }   
        
        
        
       // selectedArea.style.top = (this.canvas.size.height + this.canvas.position.y) + 'px';
      //this.dragPosition.x = (event.clientX - this.canvas.position.x);
    },

    updateGraph: function(startDrag, endDrag){
        if(startDrag > endDrag) return;
        let startDate, endDate;
        startDrag = startDrag - this.canvas.position.x;
        endDrag   = endDrag - this.canvas.position.x;

        for(let i = 1; i < this.points.length; i++){
            if(this.points[i - 1].left < startDrag && this.points[i].left > startDrag){
                startDate = this.points[i - 1].rawDate;
            }
            if(this.points[i - 1].left < endDrag && this.points[i].left > endDrag){
                endDate = this.points[i - 1].rawDate;
            }
            if(startDate && endDate) break;
        }

        window.appComponent.loadGraph(startDate, endDate);
    }
}

Array.prototype.max = function() {
    return Math.max.apply(null, this);
};

Array.prototype.min = function() {
    return Math.min.apply(null, this);
};

            
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