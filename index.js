var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var connectionsLimit = 2;
var roles =[];
// var path = require('path');
function randomRoles() {
  if(Math.random() < 0.5) {
    roles.push({
      player1: "prisoner",
      player2: "warder"
    })
  } else {
    roles.push({
      player1: "warder",
      player2: "prisoner"
    })
  }
};

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  if (io.engine.clientsCount > connectionsLimit) {
    socket.emit('err', { message: 'reach the limit of connections' })
    socket.disconnect()
    console.log(socket.id+ ' has tried to connect but the socket has reach the limit of connections. Disconnected...')
    return
  }
  console.log('one user connected ' + socket.id);
  socket.join('room', () => {
    let rooms = Object.keys(socket.rooms);
    console.log(rooms);
    io.to('room').emit(socket.id+" has joined the room")
    io.of('/').in('room').clients((error, clients) => {
      if (error) throw error;
      if(clients.length === 1) {
        console.log("Client(s) in the room: "+clients);
        io.emit("waiting", "waiting for another opponent...");
      } else if(clients.length === 2) {
        console.log("Client(s) in the room: "+clients);
        io.emit("connected", "connection success");
        randomRoles();
        io.to(clients[0]).emit("char",roles[0].player1);
        console.log("Player1 ("+clients[0]+") is "+roles[0].player1);
        io.to(clients[1]).emit("char",roles[0].player2);
        console.log("Player2 ("+clients[1]+") is "+roles[0].player2);

        
        // change to send array of randomed field
        io.to(clients[clients.length-1].player1).emit("start", "start match");
      }  
    });
        

  // console.log("one user connected " + socket.id);
  // console.log("This is from Tai");

  // socket.on("req", message => {
  //   console.log(socket.id + " " + message);
  //   if (message === "join") {
  //     io.emit("status", "waiting for players...");
  //     // must send random index not
  //     io.emit("board", {
  //       warderindex: [2, 3],
  //       prisonerindex: [4, 1],
  //       tunnelindex: [4, 0],
  //       obstacleindex: [[0, 0], [2, 2], [4, 2], [1, 3], [3, 4]]
  //     });
  //   }
  });

  socket.on("disconnect", function() {
    console.log("one user disconnected " + socket.id);
  });
});

http.listen(3000, function() {
  console.log("server listening on port 3000");
});
