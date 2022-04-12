//get the canvas object from the html
const canvas=document.querySelector('canvas')
const c= canvas.getContext('2d')

//constants used for gameplay
const player_width=50
const player_height=125
const gravity=1
const player_speed=4
const jump_height=-22
const background_floor=480
let timerID
let timer = 60
//define the canvas size
canvas.width = 1024
canvas.height= 576

//fill the canvas with a rectangle at (x,y), to (x,y)
c.fillRect(0,0, canvas.width, canvas.height)

//create the class that will hold the player rendering infomation
class Sprite{
    constructor({position, imageSrc, scale=1, framesMax=1, offset={x:0, y:0}}) {
        this.position = position
        this.width=50
        this.height=150
        this.image = new Image ()
        this.image.src = imageSrc
        this.scale = scale
        this.framesMax = framesMax
        this.framesCurrent=0
        this.framesElapsed=0
        this.framesHold=8
        this.offset=offset
    }

    animateFrames(){
        //add a frame counter for each refresh
        this.framesElapsed++
        //if the frames elapsed has gone forward a set amount them reanimate the sprites. 
        if (this.framesElapsed % this.framesHold==0) {
            if (this.framesCurrent < this.framesMax-1){
                this.framesCurrent++
            } else {
                this.framesCurrent=0
            }
            }
    }

    //draw the player at the given position 
    draw() {
        //use a scale to change the object sizes

        c.drawImage(this.image, 
            //the image crop locations
            this.framesCurrent *(this.image.width / this.framesMax), 0, this.image.width / this.framesMax, this.image.height,
            //where the iamge is drawn
            this.position.x-this.offset.x, this.position.y-this.offset.y, (this.image.width / this.framesMax) * this.scale, this.image.height * this.scale)        
    }

    //change the player or enemy positions
    update(){
        this.draw()
        this.animateFrames()
    }
}


//create the class that will hold the player rectangles
class Fighter extends Sprite{
    constructor({position, velocity, color, offset, imageSrc, scale=1, framesMax=1, sprites, attackBox = {offset:{}, width:undefined, height:undefined}}) {
        //define which init properties you want to be carrieds over from the sprite class
        super({
            position, imageSrc, scale, framesMax, offset
        })
        //init variables
        this.velocity = velocity
        this.height=150
        this.lastkey
        this.attackBox={
            position:{
                x:this.position.x,
                y:this.position.y,
            },
            offset:attackBox.offset,
            width:attackBox.width,
            height:attackBox.height
        }
        this.color = color
        this.isAttacking =false
        this.facingLeft
        this.facingRight
        this.isJumping=false
        this.health=100
        this.framesCurrent=0
        this.framesElapsed=0
        this.framesHold=12
        this.sprites=sprites
        this.dead=false
        //set up each image needed for each different animation and give it a key name
        for (const sprite in this.sprites){
            sprites[sprite].image=new Image()
            sprites[sprite].image.src = sprites[sprite].imageSrc

        }
        //console.log(this.sprites)
    }

    //draw the player at the given position 

    //change the player or enemy positions
    update(){
        this.draw()
        if (this.dead==false){
            this.animateFrames()
        }

        //update the attackbox depending on direction, can be hidden by commenting out the fill rect part
        if (this.facingRight==true){
        this.attackBox.position.x = this.position.x
        this.attackBox.position.y = this.position.y+ this.attackBox.offset.y
        //c.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height)
        } else {
            this.attackBox.position.x = this.position.x - this.attackBox.offset.x
            this.attackBox.position.y = this.position.y + this.attackBox.offset.y
            //c.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height)
        }

        //update player position
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        //conditional to check for the bottom of the screen, gravity function
        if (this.position.y + player_height + this.velocity.y  >= background_floor) {
            this.velocity.y=0
            this.position.y=355
        } else this.velocity.y += gravity
    }

    //turn the isattacking variable to true for 100ms then switch back to false so the players cant spam attacks
    attack(){
        this.isAttacking=true
        this.switchSprites('attack1')
        setTimeout(() => {
            this.isAttacking=false
        }, 800)
    }

    //function to switch sprites more fluently
    //note that when facing right animation starts right to left in the pngs
    //when facing left the animation starts at the left and needs to be reversed to line up.
    switchSprites(sprite){
        //check if the player is dead, this should override all animations 
        if (this.image == this.sprites.death.image) {
            if (this.framesCurrent == this.sprites.death.framesMax-1){
                this.dead=true
            }
        return
        }

        //check if player is attacking and if so, override animations until attack has finished
        if (this.facingRight==true) {
            if (this.image == this.sprites.attack1_right.image && this.framesCurrent < this.sprites.attack1_right.framesMax-1) 
            return
        } else {
            if (this.image == this.sprites.attack1_left.image && this.framesCurrent < this.sprites.attack1_left.framesMax-1) 
            return
        }

        //check if player is has been hit with an attack and if so, override animations until that has finished
        if (this.facingRight==true) {
            if (this.image == this.sprites.takehit_right.image && this.framesCurrent < this.sprites.takehit_right.framesMax-1) 
            return
        } else {
            if (this.image == this.sprites.takehit_left.image && this.framesCurrent < this.sprites.takehit_left.framesMax-1) 
            return
        }

        switch(sprite){
            //change player animation to idle
            case 'idle':
                //check which way the player is facing to choose the correct sprite direction
                if (this.facingRight==true){
                    if (this.image !== this.sprites.idle_right.image){
                        this.image=this.sprites.idle_right.image
                        this.framesMax=this.sprites.idle_right.framesMax
                        this.framesCurrent=0
                    }
                } else if (this.facingLeft==true){
                    if (this.image !== this.sprites.idle_left.image){
                        this.image=this.sprites.idle_left.image
                        this.framesMax=this.sprites.idle_left.framesMax
                        this.framesCurrent=0
                        }
                    }
                break
            
            //change player animation to running
            case 'run':
                //check which way the player is facing to choose the correct sprite direction 
                if (this.facingRight==true) { 
                    if (this.image !== this.sprites.run_right.image){
                        this.image=this.sprites.run_right.image
                        this.framesMax=this.sprites.run_right.framesMax
                        this.framesCurrent=0
                    }
                } else if (this.facingLeft==true) {
                    if (this.image !== this.sprites.run_left.image){
                        this.image=this.sprites.run_left.image
                        this.framesMax=this.sprites.run_left.framesMax
                        this.framesCurrent=0
                        }
                    }
                break
            
            //change player animation to jumping
            case 'jump':
                //check which way the player is facing to choose the correct sprite direction
                if (this.facingRight==true) {
                    if (this.image !== this.sprites.jump_right.image){
                        this.image=this.sprites.jump_right.image
                        this.framesMax = this.sprites.jump_right.framesMax
                        this.framesCurrent=0
                    }
                } else if (this.facingLeft==true) {
                    if (this.image !== this.sprites.jump_left.image){
                        this.image=this.sprites.jump_left.image
                        this.framesMax = this.sprites.jump_left.framesMax
                        this.framesCurrent=0
                        }
                    }
                break
            
            //change player animation to falling
            case 'fall':
                //check which way the player is facing to choose the correct sprite direction
                if (this.facingRight==true) {
                    if (this.image !== this.sprites.fall_right.image){
                        this.image=this.sprites.fall_right.image
                        this.framesMax = this.sprites.fall_right.framesMax
                        this.framesCurrent=0
                    }
                } else if (this.facingLeft==true) {
                    if (this.image !== this.sprites.fall_left.image){
                        this.image=this.sprites.fall_left.image
                        this.framesMax = this.sprites.fall_left.framesMax
                        this.framesCurrent=0
                        }
                    }
                break
                
            //change player animation to attacking
            case 'attack1':
                //check which way the player is facing to choose the correct sprite direction
                if (this.facingRight==true) {
                    if (this.image !== this.sprites.attack1_right.image){
                        this.image=this.sprites.attack1_right.image
                        this.framesMax = this.sprites.attack1_right.framesMax
                        this.framesCurrent=0
                    }
                } else if (this.facingLeft==true) {
                    if (this.image !== this.sprites.attack1_left.image){
                        this.image=this.sprites.attack1_left.image
                        this.framesMax = this.sprites.attack1_left.framesMax
                        this.framesCurrent=0
                        }
                    }
                break
            
            //take hit animations
            case 'takehit':
                //check which way the player is facing to choose the correct sprite direction
                if (this.facingRight==true) {
                    if (this.image !== this.sprites.takehit_right.image){
                        this.image=this.sprites.takehit_right.image
                        this.framesMax = this.sprites.takehit_right.framesMax
                        this.framesCurrent=0
                    }
                } else if (this.facingLeft==true) {
                    if (this.image !== this.sprites.takehit_left.image){
                        this.image=this.sprites.takehit_left.image
                        this.framesMax = this.sprites.takehit_left.framesMax
                        this.framesCurrent=0
                        }
                    }
                break
            
            //animation to play as player dies 
            case 'death':
                if (this.image !== this.sprites.death.image){
                    this.image=this.sprites.death.image
                    this.framesMax = this.sprites.death.framesMax
                    this.framesCurrent=0
                }
                break
        }
    }
}

//create the background variable
const background = new Sprite ( {
    position:{
        x:0,
        y:0
    }, 
    imageSrc: './img/background.png', 
})

//create the background variable
const shop = new Sprite ( {
    position:{
        x:625,
        y:160
    }, 
    imageSrc: './img/shop.png', 
    scale: 2.5,
    framesMax: 6,
})


//create the player using the samurai mack sprite pack
const player = new Fighter ({
    position: {
        x:100,
        y:0
    },
    velocity: {
        x:0,
        y:6
    },
    color: 'red', 
    imageSrc: './img/samuraiMack/Idle_right.png',
    scale: 2.5,
    framesMax: 8,
    offset:{
        x:215, 
        y:180
    },
    facingLeft: false,
    facingRight: true,
    sprites: {
        idle_right:{
            imageSrc: './img/samuraiMack/Idle_right.png',
            framesMax: 8,
        },
        idle_left:{
            imageSrc: './img/samuraiMack/Idle_left.png',
            framesMax: 8,
        },
        run_right:{
            imageSrc: './img/samuraiMack/Run_right.png',
            framesMax: 8,
        },
        run_left:{
            imageSrc: './img/samuraiMack/Run_left.png',
            framesMax: 8,
        },
        jump_right:{
            imageSrc: './img/samuraiMack/Jump_right.png',
            framesMax: 2,
        },
        jump_left:{
            imageSrc: './img/samuraiMack/Jump_left.png',
            framesMax: 2,
        },
        fall_right:{
            imageSrc: './img/samuraiMack/Fall_right.png',
            framesMax: 2,
        },
        fall_left:{
            imageSrc: './img/samuraiMack/Fall_left.png',
            framesMax: 2,
        },
        attack1_left:{
            imageSrc: './img/samuraiMack/Attack1_left.png',
            framesMax: 4,
        },
        attack1_right:{
            imageSrc: './img/samuraiMack/Attack1_right.png',
            framesMax: 4,
        },
        takehit_left:{
            imageSrc: './img/samuraiMack/TakeHitWhite_left.png',
            framesMax: 4,
        },
        takehit_right:{
            imageSrc: './img/samuraiMack/TakeHitWhite_right.png',
            framesMax: 4,
        },
        death:{
            imageSrc: './img/samuraiMack/Death_right.png',
            framesMax: 6,
        }
    },
    attackBox: {
        offset:{
            x:185,
            y:50
        }, 
        width:240,
        height:50,
    }
})

//create the enemy using the kenji spite pack
const enemy = new Fighter ({
    position: {
        x:800,
        y:200
    },
    velocity: {
        x:0,
        y:6
    }, 
    color: 'blue', 
    imageSrc: './img/kenji/Idle_left.png',
    scale: 2.5,
    framesMax: 4,
    offset:{
        x:215, 
        y:193
    },
    facingLeft: true,
    facingRight: false,
    sprites: {
        idle_right:{
            imageSrc: './img/kenji/Idle_right.png',
            framesMax: 4,
        },
        idle_left:{
            imageSrc: './img/kenji/Idle_left.png',
            framesMax: 4,
        },
        run_right:{
            imageSrc: './img/kenji/Run_right.png',
            framesMax: 8,
        },
        run_left:{
            imageSrc: './img/kenji/Run_left.png',
            framesMax: 8,
        },
        jump_right:{
            imageSrc: './img/kenji/Jump_right.png',
            framesMax: 2,
        },
        jump_left:{
            imageSrc: './img/kenji/Jump_left.png',
            framesMax: 2,
        },
        fall_right:{
            imageSrc: './img/kenji/Fall_right.png',
            framesMax: 2,
        },
        fall_left:{
            imageSrc: './img/kenji/Fall_left.png',
            framesMax: 2,
        },
        attack1_left:{
            imageSrc: './img/kenji/Attack1_left.png',
            framesMax: 4,
        },
        attack1_right:{
            imageSrc: './img/kenji/Attack1_right.png',
            framesMax: 4,
        },
        takehit_left:{
            imageSrc: './img/kenji/TakeHit_left.png',
            framesMax: 3,
        },
        takehit_right:{
            imageSrc: './img/kenji/TakeHit_right.png',
            framesMax: 3,
        },
        death:{
            imageSrc: './img/kenji/Death_right.png',
            framesMax: 7,
        }
    },
    attackBox: {
        offset:{
            x:180,
            y:50
        }, 
        width:250,
        height:50,
    }
})

//dictionary object that will check if a key has been pressed and can check for if a player is jumping or moving in a certain direction
const keys = {
    a:{
        pressed: false
    },
    d:{
        pressed: false
    },
    w:{
        pressed: false
    },
    ArrowUp:{
        pressed: false
    },
    ArrowRight:{
        pressed: false
    },
    ArrowLeft:{
        pressed: false
    }
}

//create a function that checks for rectangular collision
function rectangularCollision({rectangle1, rectangle2}){
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x 
        && rectangle1.attackBox.position.x <= rectangle2.position.x + player_width
        && rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y 
        && rectangle1.attackBox.position.y <= rectangle2.position.y + player_height
    )
}

//create function that will decrease the timer
function decreaseTimer(){
    if (timer>0){
        //loop through evcery 1000 miliseconds
        timerID=setTimeout(decreaseTimer, 1000)
        timer -= 1
        //update the html to the timer
        document.querySelector('#timer').innerHTML =timer
    }
}

//start the timer countdown
decreaseTimer()

//animate the canvas
function animate() {
    window.requestAnimationFrame(animate)
    //clear the rectangles and redraw the background before drawing on the rectangles
    background.update()
    shop.update()

    //add in an opaque layer before the players so they stand out and contrast from the background a little 
    c.fillStyle='rgba(255,255,255,0.18)'
    c.fillRect(0,0, canvas.width, canvas.height)

    //update the positions of each player
    player.update()
    enemy.update()
    
    //------------------PLAYER MOVEMENT---------------
    //reset players movement to 0 so they dont keep moving 
    player.velocity.x=0
    //check for input clicks and move the player accordingly
    if  (keys.a.pressed && player.lastkey == 'a' && player.position.x > 0) {
        //move left
        player.velocity.x=-player_speed
        //change player animation to run
        player.switchSprites('run')
    }   else if (keys.d.pressed && player.lastkey=='d' && player.position.x+player_width < canvas.width) {
            //move right
            player.velocity.x=player_speed
            //change player animation to run
            player.switchSprites('run')
    }   else {
            //reset player to idle
            player.switchSprites('idle')
    }
    //logic for player jumping, including what happens at the top of the screen
    if (keys.w.pressed && player.isJumping==true 
        && player.position.y + player_height > background_floor-(player_height/5)){
        //jump
        player.velocity.y = jump_height
        player.isJumping =false
    }
    //check if player is jumping with the velocity and animate the correct frames for that
    if (player.velocity.y <0 ) {
        player.switchSprites('jump')
    } else if (player.velocity.y >0){
        player.switchSprites('fall')
        }
    
    //--------------------ENEMY MOVEMENT---------------------
    //reset enemy movement to 0 so they dont keep moving 
    enemy.velocity.x=0
    //check for input clicks and move the enemy accordingly
    if  (keys.ArrowLeft.pressed && enemy.lastkey == 'ArrowLeft' && enemy.position.x > 0) {
        //move left
        enemy.velocity.x=-player_speed
        //change enemy animation to run
        enemy.switchSprites('run')
    }   else if (keys.ArrowRight.pressed && enemy.lastkey=='ArrowRight' && enemy.position.x+player_width < canvas.width) {
            //move right
            enemy.velocity.x=player_speed
            //change enemy animation to run
            enemy.switchSprites('run')
    }   else {
            //reset enemy to idle
            enemy.switchSprites('idle')
    }
    //logic for player jumping, including what happens at the top of the screen
    if (keys.ArrowUp.pressed && enemy.isJumping==true &&
         enemy.position.y + player_height > background_floor-(player_height/5)){
        //jump
        enemy.velocity.y = jump_height
        enemy.isJumping =false
    }
    //check if enemy is jumping with the velocity and animate the correct frames for that
    if (enemy.velocity.y < 0 ) {
        enemy.switchSprites('jump')
    }else if (enemy.velocity.y >0 ){
        enemy.switchSprites('fall')
        }
    
    //------------LOGIC TO DETECT FOR ENEMY AND PLAYER ATTACKS HITTING ------------
    //detect for player attack box collisions with enemy and perform an attack
    if (rectangularCollision({rectangle1: player, rectangle2: enemy})==true && player.isAttacking==true
                            && player.framesCurrent==2){
            //change stright back to false attacking so that multiple hits arent registered
            player.isAttacking=false
            //subtract the health from the player hit
            enemy.health -= 10
            //check player health if less than 0 then you can play death animation
            if (enemy.health <=0){
                enemy.switchSprites('death')
            } else {
                enemy.switchSprites('takehit')
            }
            //update the div html to display the correct health
            gsap.to('#enemyHealth',{width: enemy.health+"%"})
    }

    //detect for player attack box collisions with enemy and perform an attack
    if (rectangularCollision({rectangle1: enemy, rectangle2: player})==true && enemy.isAttacking==true
                            && enemy.framesCurrent==2){
            //change stright back to false attacking so that multiple hits arent registered
            enemy.isAttacking=false
            //subtract the health from the enemy hit
            player.health -= 10
            //check player health if less than 0 then you can play death animation
            if (player.health <=0){
                player.switchSprites('death')
            } else {
                player.switchSprites('takehit')
            }
            //update the div html to display the correct health
            gsap.to('#playerHealth',{width: player.health+"%"})
    }

    //---------------------WIN CONDITONS HERE----------------
    //check for a player hitting 0 health and ending the game
    if (player.health <=0 || enemy.health <=0) {
        //stop the timer from continuing
        clearTimeout(timerID)
        //check for each player state
        if (player.health==enemy.health){
            c.fillStyle='black'
            c.font = "45px Arial"
            c.fillText("Draw", canvas.width/2-55, canvas.height/2-20)
            console.log('Draw')
        }
        else if (player.health > enemy.health){
            c.fillStyle='black'
            c.font = "45px Arial"
            c.fillText("Player 1 Wins", canvas.width/2-155, canvas.height/2-20)
        }
        else {
            c.fillStyle='black'
            c.font = "45px Arial"
            c.fillText("Player 2 Wins", canvas.width/2-155, canvas.height/2-20)
        }
    }

    //check which person has one the match once the timer hits 0s if there were no prior winner
    if (timer ==0) {
        //stop the timer from continuing
        clearTimeout(timerID)
        //check for each player state
        if (player.health==enemy.health){
            c.fillStyle='black'
            c.font = "45px Arial"
            c.fillText("Draw", canvas.width/2-55, canvas.height/2-20)
            //console.log('Draw')
        }
        else if (player.health > enemy.health){
            c.fillStyle='black'
            c.font = "45px Arial"
            c.fillText("Player 1 Wins", canvas.width/2-155, canvas.height/2-20)
            //console.log('Player 1 wins')
        }
        else {
            c.fillStyle='black'
            c.font = "45px Arial"
            c.fillText("Player 2 Wins", canvas.width/2-155, canvas.height/2-20)
            //console.log('Player 2 wins')
        }
    }

}
//begin the animation loop
animate()


//set up an event listening object that will react to a a keydown event (key pressed) 
window.addEventListener('keydown', (Event)=>{
    console.log(Event.key)
    if (player.dead==false){
        switch (Event.key){
            case 'd':
                keys.d.pressed=true
                player.lastkey='d'
                player.facingLeft=false
                player.facingRight=true
                break
            case 'a':
                keys.a.pressed=true
                player.lastkey='a'
                player.facingLeft=true
                player.facingRight=false
                break
            case 'w':
                keys.w.pressed=true
                player.isJumping=true
                break
            case ' ':
                player.attack()
                break
        }
    }
    if (enemy.dead==false) {
        switch (Event.key){
            //enemy player movement
            case 'ArrowRight':
                keys.ArrowRight.pressed=true
                enemy.lastkey='ArrowRight'
                enemy.facingLeft=false
                enemy.facingRight=true
                break
            case 'ArrowLeft':
                keys.ArrowLeft.pressed=true
                enemy.lastkey='ArrowLeft'
                enemy.facingLeft=true
                enemy.facingRight=false
                break
            case 'ArrowUp':
                keys.ArrowUp.pressed=true
                enemy.isJumping=true
                break
            case '+':
                enemy.attack()
                break
        }
    }
})

//set up an event listening object that will react to a a keydown event (key pressed) 
window.addEventListener('keyup', (Event)=>{
    //console.log(Event.key)
    switch (Event.key){
        case 'd':
            keys.d.pressed=false
            break
        case 'a':
            keys.a.pressed=false
            break
        case 'w':
            keys.w.pressed=false
            break
        
        //enemy keys up
        case 'ArrowRight':
            keys.ArrowRight.pressed=false
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed=false
            break
        case 'ArrowUp':
            keys.ArrowUp.pressed=false
            break
    }
})

//set up an event listening object that will react to a left mouse click
window.addEventListener('click', (Event)=>{
    //you can use the event.property to get a certain property from the object of the event
    x=Event.clientX
    y=Event.clientY
    console.log('x: ', x, 'y: ', y)
})