Array.prototype.max = function() {
    return Math.max.apply(null, this);
};

Array.prototype.min = function() {
    return Math.min.apply(null, this);
};

var Graph = {
    points: [],
    offsetX: 0,
    offsetY: 0,
    canvasSize:{
        offsetX: 0,
        offsetY: 0,
        width: 0,
        height: 0
    },
    canvasName: "",

    draw: function (data, stepSize) {
        var canvas = document.getElementById('canvas');
        var stepPosition = 10;
        var originXPosition = 10;
        var width = canvas.width;
        var height = canvas.height;
        var stepSize = (width - originXPosition - 2) / (data.length - 1);
        
        data = this.getPercentage(data, height);
        console.log(data);
        if (canvas.getContext) {
            var ctx = canvas.getContext('2d');

            ctx.beginPath();
            ctx.moveTo(stepPosition, height - data[0].positionX);
            
            for(let i = 0; i < data.length; i++){
            ctx.lineTo(stepPosition, height - data[i].positionX);
            //ctx.fillRect(stepPosition - 1,height - (data[i].positionX) - 1,3,3);
            this.points.push({
                left: stepPosition - 3,
                top: height - data[i].positionX - 3,
                height: 6,
                width: 6,
                value: data[i].value
            });
            stepPosition += stepSize;
            }
            
            ctx.strokeStyle = "#397ee4";
            ctx.stroke();
            
            //Fill space under graph
            ctx.lineTo(stepPosition - stepSize, width);
            ctx.lineTo(originXPosition, width);
            ctx.fillStyle = "#397ee448";
            ctx.fill();
            ctx.closePath();
            
            //Y axis
            ctx.beginPath();
            ctx.moveTo(originXPosition, 0);
            ctx.lineTo(originXPosition, height + originXPosition);
            ctx.lineTo(width + originXPosition, width + originXPosition);
            ctx.strokeStyle = "#a4a4a4";
            ctx.stroke();
            ctx.closePath();
            
            //Y axis
            ctx.beginPath();
            ctx.moveTo(originXPosition -5 , height -1 );
            ctx.lineTo(width  , height - 1);
            ctx.lineTo(width + originXPosition, width + originXPosition);
            ctx.strokeStyle = "#a4a4a4";
            ctx.stroke();
            ctx.closePath();
            
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
            
    }
    },

    drawData: function (canvasName, data){

    this.canvas = canvasName;
    var canvas = document.getElementById(canvasName);
    canvas.addEventListener("mousemove", (event) => {
        this.handleMousemove(event, this, canvasName);
    });

    this.getCanvasOffset();
   
    this.draw(data);
    },

    getCanvasOffset: function(canvasName){
        var canvas = document.getElementById(canvasName);
        if(canvas){
            this.canvas = {
                offsetX: canvas.offsetLeft,
                offsetY: canvas.offsetTop,
                width:   canvas.width,
                height:  canvas.height
            }
        }  
    },

    getPercentage: function(data, height){
        let total = 0;
        let newData = [];
        let maxLimit = Math.max.apply(null, data);
        let minLimit = 0;
        
        data.forEach((n) => total += n);

        let offsetTop = ((maxLimit - minLimit) / 100) * 5;
        data.forEach((n) => {
                newData.push({
                value: n,
                positionX: ((n*height) / (maxLimit + offsetTop)),
                percent: ((n) / (maxLimit + offsetTop)),
            });
        });
        
        return newData;
    },

    handleMousemove(e, that, canvasName){
        e.preventDefault();
        e.stopPropagation();
        that.getCanvasOffset(canvasName);
        var canvas = that.canvas;
        var x = parseInt(e.clientX - canvas.offsetX);
        var y = parseInt(e.clientY - canvas.offsetY);
        var found = false;
        let point;

        if(that.points){
            for(let i = 0; i < that.points.length; i++){
                point = that.points[i];
                if (x > point.left && x < point.left + point.width) {
                    var div = document.getElementById('popup');
                    div.style.left = (e.clientX - 80) +'px';
                    div.style.top = point.top +'px';
                    div.innerHTML = point.value; 
                    found = true;
                    break;
                }
            }
            var div = document.getElementById('popup');
            div.style.display = found ? "block" : "none";

            var line = document.getElementById('vertical-line');
            line.style.left = e.clientX +'px';
            line.style.top  = (canvas.offsetY + point.top) +'px';
            line.style.height = (canvas.height - (point.top)) +'px';
        }        
    }
}

export default Graph;