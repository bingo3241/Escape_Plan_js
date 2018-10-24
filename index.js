var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
// var path = require('path');

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  console.log("one user connected " + socket.id);
  console.log("This is from Tai");

  socket.on("req", message => {
    console.log(socket.id + " " + message);
    if (message === "join") {
      io.emit("status", "waiting for players...");
      // must send random index not
      io.emit("board", {
        warderindex: [2, 3],
        prisonerindex: [4, 1],
        tunnelindex: [4, 0],
        obstacleindex: [[0, 0], [2, 2], [4, 2], [1, 3], [3, 4]]
      });
      io.emit("turn" , "Your turn!")
    }
  });

  socket.on("disconnect", function() {
    console.log("one user disconnected " + socket.id);
  });
});

http.listen(3000, function() {
  console.log("server listening on port 3000");
});
