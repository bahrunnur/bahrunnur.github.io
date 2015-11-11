// Copyright © 2015 Bahrunnur
// Licensed under the terms of the MIT License

var GameState = function (game) {
};

// Load images and sounds
GameState.prototype.preload = function() {
    this.game.load.spritesheet('ship', 'assets/gfx/ship.png', 32, 32);
    this.game.load.spritesheet('explosion', 'assets/gfx/explosion.png', 128, 128);
    // this.game.load.image('ground', 'assets/gfx/ground.png');

    var ctx;

    // create spike
    var spike = this.game.add.bitmapData(16, this.game.height);
    ctx = spike.context;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 16, this.game.height);
    this.game.cache.addBitmapData('spike', spike);

    // create ground
    var ground = this.game.add.bitmapData(this.game.width, 16)
    ctx = ground.context;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, this.game.width, 16);
    this.game.cache.addBitmapData('ground', ground);

    // create ship's exhaust
    // var exhaust = this.game.add.bitmapData(4, 4);
    // ctx = exhaust.context;
    // ctx.fillStyle = "#ffffff";
    // ctx.fillRect(0, 0, 4, 4);
    // this.game.cache.addBitmapData('ground', exhaust);
};

// Setup the example
GameState.prototype.create = function() {
    // Set stage background color
    this.game.stage.backgroundColor = 0x232323;

    // Define motion constants
    this.ROTATION_SPEED = 210; // degrees/second
    this.ACCELERATION = 200; // pixels/second/second
    this.MAX_SPEED = 300; // pixels/second
    this.DRAG = -5; // pixels/second
    this.GRAVITY = 0; // pixels/second/second
    this.SPIKE_DELAY = 5000; // milisecond

    // Add the ship to the stage
    this.ship = this.game.add.sprite(0, 0, 'ship');

    this.ship.anchor.setTo(0.5, 0.5);
    this.ship.angle = -90; // Point the ship up

    // Ship's rotation knob
    this.knob = true;

    // Enable physics on the ship
    this.game.physics.enable(this.ship, Phaser.Physics.ARCADE);

    // Set maximum velocity
    this.ship.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED); // x, y

    // Add drag to the ship that slows it down when it is not accelerating
    this.ship.body.drag.setTo(this.DRAG, this.DRAG); // x, y

    // Turn on gravity
    this.game.physics.arcade.gravity.y = this.GRAVITY;

    // Make ship bounce a little
    this.ship.body.bounce.setTo(0.25, 0.25);

    // Create spikes
    this.spikes = this.game.add.group();
    // Insert spikes in timely manner
    this.game.time.events.loop(this.SPIKE_DELAY, function() {
        var spike = new Spike(this.game);
        this.game.add.existing(spike);
        this.spikes.add(spike);
    }, this); 

    // Create some ground for the ship to land on
    this.grounds = this.game.add.group();
    var bmd = this.game.cache.getBitmapData('ground');

    var ground = this.game.add.sprite(0, this.game.height - 16, bmd);
    this.game.physics.enable(ground, Phaser.Physics.ARCADE);
    ground.body.immovable = true;
    ground.body.allowGravity = false;
    this.grounds.add(ground);

    var ceiling = this.game.add.sprite(0, 0, bmd);
    this.game.physics.enable(ceiling, Phaser.Physics.ARCADE);
    ceiling.body.immovable = true;
    ceiling.body.allowGravity = false;
    this.grounds.add(ceiling);

    // Create a group for explosions
    this.explosionGroup = this.game.add.group();

    // Flash of explosion
    this.flash = this.game.add.graphics(0, 0);
    this.flash.beginFill(0xffffff, 1);
    this.flash.drawRect(0, 0, this.game.width, this.game.height);
    this.flash.endFill();
    this.flash.alpha = 0;

    // create exhaust particle
    // this.exhaust = this.game.add.emitter(0, 0, 10);
    // this.exhaust.gravity = 0;

    // Capture certain keys to prevent their default actions in the browser.
    // This is only necessary because this is an HTML5 game. Games on other
    // platforms may not need code like this.
    this.game.input.keyboard.addKeyCapture([
        Phaser.Keyboard.LEFT,
        Phaser.Keyboard.RIGHT,
        Phaser.Keyboard.UP,
        Phaser.Keyboard.DOWN
    ]);

    // Choose a random starting angle and velocity for the ship
    this.resetGame();
};

// Try to get a used explosion from the explosionGroup.
// If an explosion isn't available, create a new one and add it to the group.
// Setup new explosions so that they animate and kill themselves when the
// animation is complete.
GameState.prototype.getExplosion = function (x, y) {
    // Get the first dead explosion from the explosionGroup
    var explosion = this.explosionGroup.getFirstDead();

    // If there aren't any available, create a new one
    if (explosion === null) {
        explosion = this.game.add.sprite(0, 0, 'explosion');
        explosion.anchor.setTo(0.5, 0.5);

        // Add an animation for the explosion that kills the sprite when the
        // animation is complete
        var animation = explosion.animations.add('boom', [0,1,2,3], 60, false);
        animation.killOnComplete = true;

        // Add the explosion sprite to the group
        this.explosionGroup.add(explosion);
    }

    // Revive the explosion (set it's alive property to true)
    // You can also define a onRevived event handler in your explosion objects
    // to do stuff when they are revived.
    explosion.revive();

    // Move the explosion to the given coordinates
    explosion.x = x;
    explosion.y = y;

    // Set rotation of the explosion at random for a little variety
    explosion.angle = this.game.rnd.integerInRange(0, 360);

    // Play the animation
    explosion.animations.play('boom');

    // Return the explosion itself in case we want to do anything else with it
    return explosion;
};

GameState.prototype.resetGame = function() {
    // Move the ship back to the top of the stage
    this.ship.x = this.game.width/2 - this.ship.width/2;
    this.ship.y = this.game.height/2 - this.ship.height/2;
    this.ship.body.acceleration.setTo(0, 0);
    this.ship.body.velocity.setTo(0, 0);

    window.apa = this.spikes;
    this.spikes.destroy(true, true);
};

// The update() method is called every frame
GameState.prototype.update = function() {
    // Collide the ship with the ground
    this.game.physics.arcade.collide(this.ship, this.grounds);
    this.game.physics.arcade.collide(this.ship, this.spikes);

    // Keep the ship on the screen
    if (this.ship.x > this.game.width) this.ship.x = 0;
    if (this.ship.x < 0) this.ship.x = this.game.width;

    // Auto-rotate system
    if (this.knob) {
        this.ship.body.angularVelocity = this.ROTATION_SPEED;
    } else {
        this.ship.body.angularVelocity = -this.ROTATION_SPEED;
    }

    // Set a variable that is true when the ship is touching the ground
    var shipCollide = this.ship.body.touching.down 
                        || this.ship.body.touching.up
                        || this.ship.body.touching.right
                        || this.ship.body.touching.left;

    if (shipCollide) {
        if (Math.abs(this.ship.body.velocity.y) > 20 || Math.abs(this.ship.body.velocity.x) > 30) {
            // The ship hit the ground too hard.
            // Blow it up and start the game over.
            this.getExplosion(this.ship.x, this.ship.y);
            this.flash.alpha = 1;
            this.game.add.tween(this.flash)
                .to({ alpha: 0 }, 50, Phaser.Easing.Cubic.In)
                .start();
            this.resetGame();
        } else {
            // We've landed!
            // Stop rotating and moving and aim the ship up.
            this.ship.body.angularVelocity = 0;
            this.ship.body.velocity.setTo(0, 0);
            this.ship.angle = -90;
        }

    }

    if (this.upInputIsActive()) {
        // If the UP key is down, thrust
        // Calculate acceleration vector based on this.angle and this.ACCELERATION
        this.ship.body.acceleration.x = Math.cos(this.ship.rotation) * this.ACCELERATION;
        this.ship.body.acceleration.y = Math.sin(this.ship.rotation) * this.ACCELERATION;

        // revoke rotation
        this.ship.body.angularVelocity = 0;
        this.knob = !this.knob;

        // Show the frame from the spritesheet with the engine on
        this.ship.frame = 1;
    } else {
        // Otherwise, stop thrusting
        this.ship.body.acceleration.setTo(0, 0);

        // Show the frame from the spritesheet with the engine off
        this.ship.frame = 0;
    }
};

// This function should return true when the player activates the "jump" control
// In this case, either holding the up arrow or tapping or clicking on the center
// part of the screen.
GameState.prototype.upInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.UP);
    isActive |= (this.game.input.activePointer.isDown &&
        this.game.input.activePointer.x > this.game.width/4 &&
        this.game.input.activePointer.x < this.game.width/2 + this.game.width/4);

    return isActive;
};

// Spikes class
var Spike = function (game) {
    var position = game.rnd.between(0, 1);
    Phaser.Sprite.call(this, game, game.width, game.height*position, game.cache.getBitmapData('spike'));
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.anchor.set(0.5);
};

Spike.prototype = Object.create(Phaser.Sprite.prototype);
Spike.prototype.constructor = Spike;

Spike.prototype.update = function() {
    this.body.velocity.x = -200;
    if (this.x < game.width) {
        this.destroy();
    }
};

// Exhaust particle class
// ExhaustParticle = function (game, x, y) {
//     Phaser.Particle.call(this, game, x, y, game.cache.getBitmapData('exhaust'));
// };

// ExhaustParticle.prototype = Object.create(Phaser.Particle.prototype);
// ExhaustParticle.prototype.constructor = ExhaustParticle;

// ExhaustParticle.prototype.onEmit = function() {
//     var a = Math.max(Math.abs(G.player.body.acceleration.x), Math.abs(G.player.body.acceleration.y));
//     this.x = G.player.x - G.player.radius * G.player.body.acceleration.x/a;
//     this.y = G.player.y - G.player.radius * G.player.body.acceleration.y/a;
//     this.body.velocity.x = -G.player.body.acceleration.x*1.5 + G.player.body.velocity.x + this.game.rnd.integerInRange(-G.player.THRUST/10, G.player.THRUST/10);
//     this.body.velocity.y = -G.player.body.acceleration.y*1.5 + G.player.body.velocity.y + this.game.rnd.integerInRange(-G.player.THRUST/10, G.player.THRUST/10);
// };

window.onload = function() {
    var height  = window.innerHeight,
        width   = window.innerWidth;
    var game = new Phaser.Game(width, height, Phaser.AUTO, 'game');
    game.state.add('game', GameState, true);
};