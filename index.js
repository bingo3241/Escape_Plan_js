var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var connectionsLimit = 2;
var roomClients = {
  "player1": {
    "id":"",
    "role":"",
    "index":[]
  },
  "player2": {
    "id":"",
    "role":"",
    "index":[]
  }
};
var board = {
  "warderindex":[],
  "prisonerindex":[],
  "tunnelindex":[],
  "obstacleindex":[]
}
// var path = require('path');
function randomRoles() {
  if(Math.random() < 0.5) {
    roomClients.player1.role = "prisoner";
    roomClients.player2.role = "warder";
  } else {
    roomClients.player2.role = "prisoner";
    roomClients.player1.role = "warder";
  }
};

function randomBoard() {

}

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
  socket.on("req", (message) => {
    if(message === "join") {
      socket.join('room', () => {
        let rooms = Object.keys(socket.rooms);
        console.log(rooms);
        io.of('/').in('room').clients((error, clients) => {
          if (error) throw error;
          if(clients.length === 1) {
            if(roomClients.player1.id === "") {
              roomClients.player1.id = socket.id;
              console.log("Client(s) in the room: "+clients);
              io.emit("waiting", "waiting for another opponent...");
            } else {
              roomClients.player2.id = socket.id;
              console.log("Client(s) in the room: "+clients);
              io.emit("waiting", "waiting for another opponent...");
            }
            
          } else if (clients.length === 2) {
            if (roomClients.player2.id === "") {
              roomClients.player2.id = socket.id;
              console.log("Client(s) in the room: "+clients);
              io.emit("connected", "connection success");
              randomRoles();
              io.to(clients[0]).emit("char",roomClients.player1.role);
              io.to(clients[1]).emit("char",roomClients.player2.role);
              console.log(roomClients);
              randomBoard();
              io.emit("board", board);
              // change to send array of randomed field
              io.to(roomClients.player1).emit("start", "start match");
            } else {
              roomClients.player1.id = socket.id;
              console.log("Client(s) in the room: "+clients);
              io.emit("connected", "connection success");
              randomRoles();
              io.to(clients[0]).emit("char",roomClients.player2.role);
              io.to(clients[1]).emit("char",roomClients.player1.role);
              console.log(roomClients);
              randomBoard();
              io.emit("board", board);
              // change to send array of randomed field
              io.to(roomClients.player1).emit("start", "start match");
            }
            
          }  
        });
      });
    } else if (message === "leave") {
      socket.leave('room');
      if(roomClients.player1.id === socket.id) {
        roomClients.player1.id == "";
        roomClients.player1.role == "";
        roomClients.player1.index == ""
      } else if(roomClients.player2.id === socket.id) {
        roomClients.player2.id == "";
        roomClients.player2.role == "";
        roomClients.player2.index == ""
      }
      console.log(roomClients);
      io.of('/').in('room').clients((error, clients) => {
        io.to(clients[0]).emit("waiting", "waiting for another opponent...")
      });
    }
  })
  

  // socket.on("req", message => {
  //   console.log(socket.id + " " + message);
  //   if (message === "join") {
  //     io.emit("status", "waiting for players...");
  //     // must send random index not
  //     io.emit("board", {
  //       warderindex = [2, 3],
  //       prisonerindex =[4, 1],
  //       tunnelindex = [4, 0],
  //       obstacleindex = [[0, 0], [2, 2], [4, 2], [1, 3], [3, 4]]
  //     });
  //     io.emit("turn" , "Your turn!")
  //   }
  // });

  // socket.on("move", message => {
  //   switch (message) {
  //     case "up":
  //       if(roomClients.player1.id === socket.id) {
  //         if() {
  //           roomClients.player1.index[1]++;
  //           io.emit("board", board);
  //         }
  //       } else if(roomClients.player2.id === socket.id) {
  //         roomClients.player2.index[1]++;
  //         io.emit("board", board);
  //       }
  //       break;
      
  //     case "down":
  //       if(roomClients.player1.id === socket.id) {
  //         roomClients.player1.index[1]--;
  //       } else if(roomClients.player2.id === socket.id) {
  //         roomClients.player2.index[1]--;
  //       }
  //       break;
      
  //     case "left":
  //       if(roomClients.player1.id === socket.id) {
  //         roomClients.player1.index[0]++;
  //       } else if(roomClients.player2.id === socket.id) {
  //         roomClients.player2.index[0]++;
  //       }
  //       break;

  //     case "right":

  //       break;
      
  //     case "skip":

  //       break;
        
  //     default:
  //       break;
  //   }
  // });
        

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
  

  socket.on("disconnect", function() {
    console.log("one user disconnected " + socket.id);
    console.log(roomClients);
    
  });
});

http.listen(3000, function() {
  console.log("server listening on port 3000");
});
