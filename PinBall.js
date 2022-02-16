window.onload = function() {

// SELECT  ELEMENT by Id
const soundElement  = document.getElementById("sound");
const restart = document.getElementById("restart");
const gameover = document.getElementById("gameover");
const youlose = document.getElementById("youlose");
const scoreEl= document.querySelector(".scoreEl");
const ballEl= document.querySelector(".ballEl");
const startgame = document.getElementById("startgame");

//select canvas element
const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");
ctx.clearRect(0, 0, cvs.width, cvs.height);

////////////addEventListener///////////////////////////

//control audio
soundElement.addEventListener("click", audioManager);

//start the game
startgame.addEventListener("click", function(){
    startgame.style.display="none";
})

//reload the page
restart.addEventListener("click", function(){
    location.reload();
})

//to  find the posision of the mouse
cvs.addEventListener("mousemove",mouseAngle);

//CHECK GAME STATUS
let GAME_OVER=false;

//check no balls are moving
let LOAD=true;

//constants
const balls=[];
const bricks=[];
const BALL_RADIUS=10;
const LINE_WIDTH=5;

//player settings
var player = {
    x:cvs.width/2,
    y:cvs.height-BALL_RADIUS,
    angle:0,
    count:1,
    score:1,
    speed:8,
    bar:70
};

//brick settings
var brick={
    columns:8,
    rows:9,
    width:50,
};
var timeId;
///////////class////////////////////////

// info of brick
class Brick{
	constructor(x,y,type,status){
        this.x=x,
        this.y=y,
        this.type=type,
        this.status=status		
	}
}

//info of ball
class Ball{
    constructor(x,y,radius,color,velocity){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
        this.velocity=velocity;
    }
    draw(){
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        ctx.fillStyle=this.color;
        ctx.fill();
    }
    update(){
        this.draw();
        this.x=this.x+this.velocity.x;
        this.y=this.y+this.velocity.y;
    }
}
///////////////////////////////////////////////////

///////////////CONCTROL SOUND/////////////

//LOAD SOUND
const BRICK_HIT=new Audio();
BRICK_HIT.src="sounds/brick.mp3";

const PLUS_HIT=new Audio();
PLUS_HIT.src="sounds/plus.mp3";

const ALL_HIT=new Audio();
ALL_HIT.src="sounds/all.mp3";

const RANDOM_HIT=new Audio();
RANDOM_HIT.src="sounds/random.mp3";

//SOUND MANAGEMENT
function audioManager(){
    // CHANGE IMAGE SOUND_ON/OFF
    let imgSrc = soundElement.getAttribute("src");
    let SOUND_IMG = imgSrc == "img/SOUND_ON.png" ? "img/SOUND_OFF.png" : "img/SOUND_ON.png";
    soundElement.setAttribute("src", SOUND_IMG);
    // MUTE AND UNMUTE SOUNDS
    PLUS_HIT.muted = PLUS_HIT.muted ? false : true;
    RANDOM_HIT.muted = RANDOM_HIT.muted ? false : true;
    BRICK_HIT.muted = BRICK_HIT.muted ? false : true;
    ALL_HIT.muted = ALL_HIT.muted ? false : true;
}

// SHOW YOU LOSE
function showYouLose(){
    gameover.style.display = "block";
    scoreEl.innerHTML=player.score;
}

function startGame(){
	startgame.style.display="none";
}

//animation loop
function animate(){
	//draw background
	ctx.lineWidth=LINE_WIDTH;
    ctx.fillStyle='black';
    ctx.fillRect(0,0,cvs.width,cvs.height);
    //draw essential elements
    drawAngle();
    drawplayer();
    drawBall();
    drawBrickShape();
    checkGameOver();

    // check collision 
    ballBrickCollision();
    ballWallCollision();

    //check gamestate(ball)
    if(LOAD){
    canvas.addEventListener("mousedown", mouseDown);  
    }else{
        canvas.removeEventListener("mousedown", mouseDown);
    }

    //check gamestate(over)
    if(!GAME_OVER){
        requestAnimationFrame(animate);
    }
    else{
        showYouLose();
    }
}

//enumerate new row
function addNewRow(){
    let r =0;
    for(let c=0;c<brick.columns;c++){
        bricks[r][c].type=randType();
        bricks[r][c].status=randStatus(player.score);
    } 
}

//initialize brick array
function init(){
    for(let r=0;r<brick.rows;r++){
    	bricks[r]=[];
    	for(let c=0;c<brick.columns;c++){
        	bricks[r][c]=new Brick(brick.width*c,brick.width*r+brick.width,0,0);
    	}
	}
    addNewRow();
}

//start new round (move row down && add new row)
function newRound(){
    //move row down 
    player.score+=1;
    scoreEl.innerHTML=player.score;
    moveRow();
    //add new row
    addNewRow();  
}
function moveRow(){
    for(let r=0;r<brick.rows-1;r++){
        for(let c=0;c<brick.columns;c++){
            bricks[brick.rows-1-r][c].type=bricks[brick.rows-1-r-1][c].type;
            bricks[brick.rows-1-r][c].status=bricks[brick.rows-1-r-1][c].status;
        }
    }	
}
//check click to shoot balls
function mouseDown(){
//if LOAD==false => can't click
LOAD=false; 
//count how many ball should be shooted
let ballCount=0;
let angle=player.angle;
let intervalId = setInterval(()=>{
        shootBall(angle);
        ballCount+=1;
        if(ballCount===player.count){
            clearInterval(intervalId);
        }
    },100);
var timeCount=0;
timeId = setInterval(()=>{
        timeCount+=1;
        //if it take too much time(greater than 10 sec) then speed up
        if(timeCount>=5){
			balls.forEach((ball)=>{
				ball.velocity.x*=1.1;
				ball.velocity.y*=1.1;
				timeCount==0;
				// clearInterval(timeId);
			});
		} 
    },2000);   
}

//shoot ball
function shootBall(angle){

    let velocity={
        x:Math.cos(angle)*player.speed,
        y:Math.sin(angle)*player.speed
    };
        balls.push(
            new Ball(player.x,player.y-BALL_RADIUS,10,'rgb(255,215,0,1)',velocity))         
}

//////////////////collision////////////////////////////////

//check ball circle collision
function ballCircleCollision(x1,y1,r1,x2,y2,r2){
    const dist = Math.hypot(x1-x2,y1-y2);
    return (dist-r1-r2<1)
}
//check ball square collision
function ballSquareCollision(ballX,ballY,r,sX,sY,l){
	//find vertical and horizontal distance (distX & dist Y)between the ball's center and square's center
	let distX=Math.abs(ballX-(sX+l/2));
	let distY=Math.abs(ballY-(sY+l/2));

	//TEST　SIDE
	//not collision
	//if the distance is greater than ball radius + l/2
	if((distX>(r+l/2))||(distY>(r+l/2))){
		return false;
	}

	//collision
	//if the distance is less than r+l/2
	if((distX<=(r+l/2))||(distY<=(r+l/2))){
		return true;
	}

	//TEST CORNER
	let dx =distX-l/2;
	let dy =distY-l/2;
	if(dx*dx+dy*dy<=r*r){
		return true;
	}
	else{
		return false;
	}
}
//check ball brick collision
function ballBrickCollision(){
    balls.forEach((ball)=>{
        let x=ball.x;
        let y=ball.y;
        for(let r=0;r<brick.columns;r++){
            for(c=0;c<brick.columns;c++){
                let b=bricks[r][c];
                //square
                if(b.type==0){
                  if(b.status!=0){
                  	if(ballSquareCollision(x,y,ball.radius,b.x,b.y,brick.width)){
                  		BRICK_HIT.play();
                  		drawCollidingBrick(b);
                  		if((x+ball.radius-b.x<=brick.width)&&(y+ball.radius>=b.y)&&(y-ball.radius<=b.y+brick.width)){
                  			ball.velocity.x=-Math.abs(ball.velocity.x);
                  		}else if((x-ball.radius<=b.x+brick.width)&&(y+ball.radius>=b.y)&&(y-ball.radius<=b.y+brick.width)){
                  			ball.velocity.x=Math.abs(ball.velocity.x);
                  		}
                  		if(y+ball.radius-b.y<=brick.width){
                  			ball.velocity.y=-Math.abs(ball.velocity.y);
                  		}else if(y-ball.radius<=b.y+brick.width){
                  			ball.velocity.y=Math.abs(ball.velocity.y);
                  		}
                  		b.status-=1;
                  }
               }
                //circle
                }else if(b.type==1){
                    if(b.status!=0){                	
                    	if(ballCircleCollision(x,y,ball.radius,b.x+brick.width/2,b.y+brick.width/2,brick.width/2)){
                            BRICK_HIT.play();
                            drawCollidingBrick(b);
                            b.status-=1;
                            if(y<=b.y+brick.width/2){
                            	// 1 Quadrant
                            	if(x>b.x){
                            		ball.velocity.x=Math.abs(ball.velocity.x);
                            		ball.velocity.y=-Math.abs(ball.velocity.y);
                            	// 2 quadrant 
                            	}else{
                            		ball.velocity.x=-Math.abs(ball.velocity.x);
                            		ball.velocity.y=-Math.abs(ball.velocity.y); 
                            	}
                            }else{
	                            ball.velocity.x*=-1;
	                            ball.velocity.y*=-1;                            	
                            }
                        }                    
                    }
                //plusball
                }else if(b.type==2){
                	if(b.status!=0){
                    	if(ballCircleCollision(x,y,r,b.x+brick.width/2,b.y+brick.width/2,brick.width/4)){
                            b.status=0;
                            PLUS_HIT.play();
                            player.count+=1;
                            ballEl.innerHTML=player.count;
                        }                    
                    }
                //horizontal attack
                }else if(b.type==3){
                	if(b.status!=0){
                    	if(ballCircleCollision(x,y,r,b.x+brick.width/2,b.y+brick.width/2,brick.width/4)){
                            b.status=0;
                            for(let i=0;i<brick.columns;i++){
                                if(bricks[r][i].type==1||bricks[r][i].type==0){
                                    if(bricks[r][i].status!=0){
                                        bricks[r][i].status-=1;
                                        ALL_HIT.play();
                                        drawCollidingBrick(bricks[r][i]);
                                        // break;                                          
                                    }
                                }
                            }
                        }
                    }
                //vertical attack
                }else if(b.type==4){
                	if(b.status!=0){
                    	if(ballCircleCollision(x,y,r,b.x+brick.width/2,b.y+brick.width/2,brick.width/4)){
                            b.status=0;
                            for(let i=0;i<brick.rows;i++){
                                if(bricks[i][c].type==1||bricks[i][c].type==0){
                                    if(bricks[i][c].status!=0){
                                        ALL_HIT.play();
                                        bricks[i][c].status-=1;
                                        drawCollidingBrick(bricks[i][c]);
                                    }
                                }
                                
                            }
                        }                    
                    }
                //random direction
                }else{
                	if(b.status!=0){
                    	if(ballCircleCollision(x,y,r,b.x+brick.width/2,b.y+brick.width/2,brick.width/4)){
                            b.status=0;
                            RANDOM_HIT.play();
                            ballEl.innerHTML=player.count;
                            for(let i=0;i<brick.rows;i++){
                            	for(let j=0;j<brick.columns;j++){
                                    if(bricks[i][j].type==1||bricks[i][j].type==0){
                                    	if(bricks[i][j].status!=0){
                                       	 ALL_HIT.play();
                                        	bricks[i][j].status-=1;
                                        	drawCollidingBrick(bricks[i][j]);
                                    	}
                                	}                        		
                            	}
                            }
                        }                    
                    }
                }    
            }
        }
    })
}

//check ball and wall collision
function ballWallCollision(){
    balls.forEach((ball,index)=>{
        //left wall
        if(ball.x-ball.radius<=0){
            ball.velocity.x=Math.abs(ball.velocity.x);
        //right wall
        }else if(ball.x+ball.radius>=cvs.width){
            ball.velocity.x =-Math.abs(ball.velocity.x);
        }else if (ball.y-ball.radius<=0){
            ball.velocity.y=Math.abs(ball.velocity.y);
        }else if(ball.y>=cvs.height){
            setTimeout(()=>{
                balls.splice(index,1);
            },0);
            if(balls.length==1){
            	clearInterval(timeId);
            	player.x=ball.x;
                newRound();                
                LOAD=true;                
            }
        }
    })
}

//check gameover
function checkGameOver(){
    let r=brick.columns;
    for(let c=0;c<brick.columns;c++){
        b=bricks[r][c];
        if(b.status!=0&&(b.type==0||b.type==1)){
            GAME_OVER=true;
        }
    }
}

/////////////////Caculate////////////////////////////////////

//type of brick
function randType(){
    let n=Math.random()*12;
    if(n<3.5){
        return 0;//square
    }
    else if(7>n&&n>=3.5){
        return 1;//circle
    }
    else if(9>n&&n>=7){
        return 2;//plus ball
    }
    else if(10>n&&n>=9){
        return 3;//horizontal
    }
    else if(11>n&&n>=10){//vertical
        return 4
    }
    else if(12>=n&&n>=11){//all
        return 5
    }
}

//decide put brick or empty
function randStatus(n){
    if(Math.random()>0.5){
        return n;
    }
    else{
        return 0;
    };
}

//convert radians to degree
function radToDeg(angle){
    return angle*(180/Math.PI);
}

//convert degrees to radians
function degToRad(angle){
    return angle*(Math.PI/180);
}

function mouseAngle(e){
    //get mouse position
    var pos = getMousePos(canvas, e);

    //get mouse angle
    var mouseangle=radToDeg(Math.atan2(pos.y-player.y,
        pos.x-player.x));

    //Convert range to 0-360 degrees
    if(mouseangle<0){
        mouseangle=180+(180+mouseangle);
    }

    //restrick angle to 10-170 degrees
    let lbound = 190;
    let rbound = 350;
    if(mouseangle>90 && mouseangle<270){
        //left
        if(mouseangle<lbound){
            mouseangle=lbound;
        }
    }else{
        //right
        if(mouseangle>rbound||mouseangle<=90){
            mouseangle=rbound;
        }
    }
    player.angle=(degToRad(mouseangle));
    // return(degToRad(mouseangle));
}

//Get the mouse position
function getMousePos(canvas,e) {
    var rect = canvas.getBoundingClientRect();
    return{
        x:Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
        y:Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
    }
}


////////////////////Draw///////////////////////////////////////////////////
//draw colliding brick 
function drawCollidingBrick(b){
		ctx.lineWidth=LINE_WIDTH;
		if(b.type==0){
			ctx.strokeStyle='#FFE66F';
            ctx.strokeRect(b.x+2.5*LINE_WIDTH,b.y+2.5*LINE_WIDTH,brick.width-4*LINE_WIDTH,brick.width-4*LINE_WIDTH);
        }else if(b.type==1){           
			drawCircle(b.x+brick.width/2,b.y+brick.width/2,brick.width/2-LINE_WIDTH*2,'#BBFFFF');                        
}
	}
//draw bricknumber
function drawBrickNumber(text,x,y){
    ctx.fillStyle = "#FFF";
    ctx.font = "21px Germania One";
    ctx.fillText(text,x,y);    
}

//draw bricks
function drawBrickShape(){
    for(let r=0;r<brick.rows;r++){
        for(let c=0;c<brick.columns;c++){
            let b=bricks[r][c];
            if(b.status!=0){
                if(b.type==0){
                        ctx.strokeStyle='#FF5809';
                        ctx.strokeRect(b.x+LINE_WIDTH,b.y+LINE_WIDTH,brick.width-LINE_WIDTH,brick.width-LINE_WIDTH);
                        drawBrickNumber(b.status,b.x+brick.width/3,b.y+2*brick.width/3);
                }else if(b.type==1){           
                        drawBrickNumber(b.status,b.x+brick.width/3,b.y+brick.width*2/3);
                        drawCircle(b.x+brick.width/2,b.y+brick.width/2,brick.width/2-LINE_WIDTH,'#0080FF');                        
                }else if(b.type==2){
                        // drawBrickNumber('+',b.x+brick.width/2,b.y+brick.width*2/3);
                        drawBrickNumber('B',b.x+brick.width*2/5,b.y+brick.width*2/3);
                        drawCircle(b.x+brick.width/2,b.y+brick.width/2,brick.width/3-LINE_WIDTH,'#D0D0D0');   
                }else if(b.type==3){
                        drawLine(b.x+brick.width/4,b.y+brick.width/2,b.x+brick.width-brick.width/4,b.y+brick.width/2,'red')
                        drawCircle(b.x+brick.width/2,b.y+brick.width/2,brick.width/3-LINE_WIDTH,'red');   
                }else if(b.type==4){
                        drawLine(b.x+brick.width/2,b.y+brick.width/4,b.x+brick.width/2,b.y+brick.width-brick.width/4,'purple')
                        drawCircle(b.x+brick.width/2,b.y+brick.width/2,brick.width/3-LINE_WIDTH,'purple');   
                }else{
                        drawBrickNumber('S',b.x+brick.width*2/5,b.y+brick.width*2/3);
                        drawCircle(b.x+brick.width/2,b.y+brick.width/2,brick.width/3-LINE_WIDTH,'rgb(255,215,0,1)');  
                }
            }
        }
    }
}
//draw line
function drawLine(x1,y1,x2,y2,color){
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}
//draw circle
function drawCircle(x,y,r,color){
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.closePath();
}
//draw angle
function drawBall(){
    balls.forEach((ball)=>{
        ball.update();
    });
}
function drawAngle(){
    let angle =player.angle;
    // ctx.lineWidth=5;
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(player.x,player.y);
    ctx.lineTo(player.x+Math.cos(angle)*player.bar,player.y+Math.sin(angle)*player.bar);
    ctx.stroke();
}
//draw player
function drawplayer(){
    ctx.beginPath();
    ctx.arc(player.x,player.y,BALL_RADIUS,0,Math.PI*2,false);
        ctx.fillStyle='red';
        ctx.fill(); 
}

init();
animate();  
}
