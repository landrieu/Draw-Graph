export default {
    points: [],
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
        var stepPosition = 10;
        var originXPosition = 10;
        var width = cvs.width;
        var height = cvs.height;
        var stepSize = (width - originXPosition) / (data.length - 1);
        var ctx;
        
        data = this.getPercentage(data, height);

        if (cvs.getContext) {

            ctx = cvs.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            ctx.beginPath();
            ctx.moveTo(stepPosition, height - data[0].positionX);
            
            for(let i = 0; i < data.length; i++){
                ctx.lineTo(stepPosition, height - data[i].positionX);
                /*ctx.fillRect(stepPosition - 1,height - (data[i].positionX) - 1,3,3);*/
                this.points.push({
                    left:    stepPosition,
                    top:     height - data[i].positionX,
                    height:  1,
                    width:   1,
                    value:   data[i].value,
                    date:    data[i].date,
                    rawDate: data[i].rawDate
                });
                stepPosition += stepSize;
            }
            
            ctx.strokeStyle = "#397ee4";
            ctx.stroke();
            
            /*Fill space under graph*/
            ctx.lineTo(stepPosition - stepSize, width);
            ctx.lineTo(originXPosition, width);
            ctx.fillStyle = "#397ee448";
            ctx.fill();
            ctx.closePath();
            
            /*Y axis*/
            ctx.beginPath();
            ctx.moveTo(originXPosition, 0);
            ctx.lineTo(originXPosition, height + originXPosition);
            ctx.lineTo(width + originXPosition, width + originXPosition);
            ctx.strokeStyle = "#a4a4a4";
            ctx.stroke();
            ctx.closePath();
            
            /*X axis*/
            ctx.beginPath();
            ctx.moveTo(originXPosition -5 , height -1 );
            ctx.lineTo(width  , height - 1);
            ctx.lineTo(width + originXPosition, width + originXPosition);
            ctx.strokeStyle = "#a4a4a4";
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
        document.getElementById("vertical-line").addEventListener("mousedown", (event) => {
            this.handleMouseDown(event);
        });

        document.getElementById(canvasName).addEventListener("mouseup", (event) => {
            event.preventDefault();
            event.stopPropagation();
            let selectedArea = document.getElementById("graph-select-area");
            selectedArea.style.width  = '0px';
            this.updateGraph(this.dragPosition.x, event.clientX);
            this.dragPosition.x = undefined;
        });

        document.getElementById("graph-select-area").addEventListener("mousemove", (event) => {
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

    getPercentage: function(data, height){
        let total = 0;
        let newData = [];

        let values = data.map((d) => {return d[1]});
        let maxLimit = Math.max.apply(null, values);
        let minLimit = Math.min.apply(null, values);
        let pointDate, tmpDate;

        data.forEach((n) => total += n[1]);

        /*Space 5% between highest value and canvas top*/
        let offsetTop = ((maxLimit - minLimit) / 100) * 5;
        data.forEach((n) => {
                tmpDate = new Date(n[0]);
                pointDate = tmpDate.getDate() + '/' + (tmpDate.getMonth() + 1) + '/' + tmpDate.getFullYear();
                pointDate += ' ' + tmpDate.getHours() + ':' + tmpDate.getMinutes();
            
                newData.push({
                value:     n[1],
                date:      pointDate,
                rawDate:   n[0],
                positionX: ((n[1]*height) / (maxLimit + offsetTop)),
                percent:   ((n[1]) / (maxLimit + offsetTop)),
            });
        });
        
        return newData;
    },

    handleMouseDown: function(event){
        event.preventDefault();
        event.stopPropagation();
        let selectedArea = document.getElementById("graph-select-area");
        selectedArea.style.height = this.canvas.size.height + 'px';
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
            let selectedArea = document.getElementById("graph-select-area");
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

            var line = document.getElementById('vertical-line');
            line.style.left     = e.clientX +'px';
            line.style.top      = (cvs.position.y + point.top) +'px';
            line.style.height   = (cvs.size.height - (point.top)) +'px';

            var dot = document.getElementById('graph-dot');
            dot.style.top       = (cvs.position.y + point.top - (dot.clientHeight / 2)) +'px';
            dot.style.left      = e.clientX - (dot.clientWidth / 2) +'px';

            document.getElementById("graph-value-text").innerHTML = point.value;
            document.getElementById("graph-date-text").innerHTML  = point.date;
        }   
        
        
        
       // selectedArea.style.top = (this.canvas.size.height + this.canvas.position.y) + 'px';
      //this.dragPosition.x = (event.clientX - this.canvas.position.x);
    },

    updateGraph: function(startDrag, endDrag){
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