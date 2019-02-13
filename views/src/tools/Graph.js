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

    drawCanvas: function (data) {
        console.log(this.canvas.name);
        var cvs = document.getElementById(this.canvas.name);
        var stepPosition = 10;
        var originXPosition = 10;
        var width = cvs.width;
        var height = cvs.height;
        console.log(width);
        var stepSize = (width - originXPosition) / (data.length - 1);
        var ctx;
        
        data = this.getPercentage(data, height);

        if (cvs.getContext) {

            ctx = cvs.getContext('2d');
            ctx.beginPath();
            ctx.moveTo(stepPosition, height - data[0].positionX);
            
            for(let i = 0; i < data.length; i++){
                ctx.lineTo(stepPosition, height - data[i].positionX);
                /*ctx.fillRect(stepPosition - 1,height - (data[i].positionX) - 1,3,3);*/
                this.points.push({
                    left: stepPosition,
                    top: height - data[i].positionX,
                    height: 1,
                    width: 1,
                    value: data[i].value
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

        this.setCanvasParameters(canvasName);
        document.getElementById(canvasName).addEventListener("mousemove", (event) => {
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
        let maxLimit = Math.max.apply(null, data);
        let minLimit = Math.min.apply(null, data);
        
        data.forEach((n) => total += n);

        /*Space 5% between highest value and canvas top*/
        let offsetTop = ((maxLimit - minLimit) / 100) * 5;
        data.forEach((n) => {
                newData.push({
                value:     n,
                positionX: ((n*height) / (maxLimit + offsetTop)),
                percent:   ((n) / (maxLimit + offsetTop)),
            });
        });
        
        return newData;
    },

    handleMousemove(e){
        e.preventDefault();
        e.stopPropagation();
        this.setCanvasParameters();

        var cvs = this.canvas;
        var x = parseInt(e.clientX - cvs.position.x);
        /*var y = parseInt(e.clientY - cvs.position.y);*/
        var found = false;
        let point;

        if(this.points){
            for(let i = 0; i < this.points.length; i++){
                point = this.points[i];
                if (x > point.left && x < point.left + point.width) {
                    var div = document.getElementById('popup');
                    div.style.left = (e.clientX - 80) +'px';
                    div.style.top = point.top +'px';
                    div.innerHTML = point.value; 
                    found = true;
                    break;
                }
            }
            div = document.getElementById('popup');
            div.style.display = found ? "block" : "none";

            var line = document.getElementById('vertical-line');
            line.style.left     = e.clientX +'px';
            line.style.top      = (cvs.position.y + point.top) +'px';
            line.style.height   = (cvs.size.height - (point.top)) +'px';
        }        
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