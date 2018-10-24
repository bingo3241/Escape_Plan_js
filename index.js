var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var connectionsLimit = 2;
var clients = [];
// var path = require('path');

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
socket.join('room 1', () => {
    let rooms = Object.keys(socket.rooms);
    console.log(rooms);
    io.to('room 1').emit(socket.id+" has joined the room")
    if(io.engine.clientsCount === 1) {
        clients.push({
            player1: socket.id,
            player2: ""
        });
        io.emit("waiting", "waiting for another opponent...");
    } else {
        clients[clients.length-1].player2 = socket.id;
        io.emit("connected", "connection success");
        // change to send array of randomed field
        io.to(clients[clients.length-1].player1).emit("start", "start match");
    }
        console.log(clients);

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
