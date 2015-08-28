var util = require("util");
var express = require('express');
var favicon = require('serve-favicon');
var gameloop = require('node-gameloop');
var favicon = require('serve-favicon');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var players = {};
var enemies = [];
var enemy_speeds = [];
var controllers = {};

var gravity = 30;
var player_speed = 100;
var jump_speed = 400;
var zombie_speed = 50;

var zombie_spawn_delta = 0;
var zombie_spawn_target = 0;
var zombie_spawn_max = 6;
var zombie_spawn_min = 4;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(favicon(__dirname + '/favicon.ico'));
app.use('/resources', express.static('resources'));

io.on('connection', function(socket){
  var id = generateID();

  socket.clientID = id;

  players[id] = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    d: 'r'
  };

  controllers[id] = {
    left: false,
    right: false,
    up: false,
    down: false,
    jumping: false,
    double_jumping: false
  };

  socket.emit('r', id);

  socket.on('c', function(msg){
    controllers[socket.clientID].left = msg.l || false;
    controllers[socket.clientID].right = msg.r || false;
    controllers[socket.clientID].down = msg.d || false;
    controllers[socket.clientID].up = msg.u || false;
  });

  socket.on('disconnect', function(){
    delete players[socket.clientID];
    delete controllers[socket.clientID];
  });

});

var port = process.env.port || 3003;
http.listen(port, function(){
  console.log('listening on *:' + port);
});

gameloop.setGameLoop(function(delta) {

  for(var id in players) {
    var player = players[id];
    var controller = controllers[id];

    /* move left or right */
    if(controller.left && !controller.right) {
      if(player.d == 'r') {
        player.d = 'l';
      }
      if(player.vx >= 0) {
        player.vx = -player_speed;
      }
    } else if(controller.right && !controller.left) {
      if(player.d == 'l') {
        player.d = 'r';
      }
      if(player.vx <= 0) {
        player.vx = player_speed;
      }
    } else {
      player.vx = 0;
    }

    /* jump */
    if(controller.up && !controller.jumping) {
      player.vy += jump_speed;
      controller.jumping = true;
    }

    /* apply gravity */
    if(player.y > 0 || player.vy > 0) {
      player.vy -= gravity;
    }

    /* apply velocity */
    player.x += player.vx * delta;
    player.y += player.vy * delta;

    player.x = Math.round(player.x);
    player.y = Math.round(player.y);

    /* ground collision */
    if(player.y < 0) {
      player.y = 0;
      player.vy = 0;
    }

    /* wall collision */
    if(player.x < 0) {
      player.x = 0;
      player.vx = 0;
    }

    /* reset jumping */
    if(player.y == 0 && controller.jumping) {
      controller.jumping = false;
    }
  }

  zombie_spawn_delta += delta;

  if(zombie_spawn_delta > zombie_spawn_target) {
    zombie_spawn_target = Math.floor((Math.random() * zombie_spawn_max) + zombie_spawn_min);
    zombie_spawn_delta = 0;

    enemies.push({
      x: 1000,
      y: 0,
      l: 5
    });
    enemy_speeds.push(Math.floor((Math.random() * 0) + 360));
  }

  for(var i = 0; i < enemies.length; i++) {
    var enemy = enemies[i];

    enemy_speeds[i] = enemy_speeds[i] + delta*4;

    /* apply velocity */
    enemy.x += -zombie_speed * delta * (Math.sin(enemy_speeds[i]) + 0.65);
    enemy.x = Math.round(enemy.x);

    /* wall collision */
    if(enemy.x < 0) {
      enemy.x = 0;

      enemies.splice(i, 1);
      enemy_speeds.splice(i, 1);
    }
  }

  io.emit('u', { p: players, e: enemies });

}, 1000 / 20);

function generateID() {
  return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
}