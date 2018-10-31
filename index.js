var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var roomLimit = 2;
var roomClients = {
  "player1": {
    "name":"",
    "id":"",
    "role":"",
    "point":0
  },
  "player2": {
    "name":"",
    "id":"",
    "role":"",
    "point":0
  }
};

var board = {
  "wardenindex":[,],
  "prisonerindex":[,],
  "tunnelindex":[,],
  "obstacleindex":[]
}
// var path = require('path');
function randomRoles() {
  if(Math.random() < 0.5) {
    roomClients.player1.role = "prisoner";
    roomClients.player2.role = "warden";
  } else {
    roomClients.player2.role = "prisoner";
    roomClients.player1.role = "warden";
  }
};

function isEqual(array1,array2) {
  if (array1.length != array2.length) {
    return false
  }
  for(var i = 0; i < array1.length; i++) {
    if(array1[i] != array2[i]) {
      return false;
    }
  }
  return true;
}

function randomBoard() {
  //tunnel
  var tunnelnum = Math.floor(Math.random()*25);
  board.tunnelindex[0] = Math.floor(tunnelnum/5);
  board.tunnelindex[1] = tunnelnum%5;
  
  //warden
  var wardennum = Math.floor(Math.random()*25);
  board.wardenindex[0] = Math.floor(wardennum/5);
  board.wardenindex[1] = wardennum%5;
  while(board.wardenindex[0] >= board.tunnelindex[0]-1 && board.wardenindex[0] <= board.tunnelindex[0]+1 
    && board.wardenindex[1] >= board.tunnelindex[1]-1 && board.wardenindex[1] <= board[1]+1) {
    board.wardenindex[0] = Math.round(wardennum/5);
    board.wardenindex[1] = wardennum%5;
  }

  //prisoner
  var prisonernum = Math.floor(Math.random()*25);
  board.prisonerindex[0] = Math.floor(prisonernum/5);
  board.prisonerindex[1] = prisonernum%5;
  while((board.prisonerindex[0] >= board.tunnelindex[0]-1 && board.prisonerindex[0] <= board.tunnelindex[0]+1 
    && board.prisonerindex[1] >= board.tunnelindex[1]-1 && board.prisonerindex[1] <= board[1]+1) || 
    (board.prisonerindex[0] >= board.wardenindex[0]-1 && board.prisonerindex[0] <= board.wardenindex[0]+1 && board.prisonerindex[1] >= board.wardenindex[1]-1 && board.prisonerindex[1] <= board.wardenindex[1]+1)) {
    board.prisonerindex[0] = Math.floor(prisonernum/5);
    board.prisonerindex[1] = prisonernum%5;
  }

  //obstacle1
  var obs1 = [,];
  var obs1num = Math.floor(Math.random()*25);
  obs1[0] = Math.floor(obs1num/5);
  obs1[1] = obs1num%5;
  while(obs1num == tunnelnum || obs1num == wardennum || obs1num == prisonernum) {
    obs1num = Math.floor(Math.random()*25);
    obs1[0] = Math.floor(obs1num/5);
    obs1[1] = obs1num%5;
  }
  board.obstacleindex.push(obs1);

  //obstacle2
  var obs2 = [,];
  var obs2num = Math.floor(Math.random()*24);
  obs2[0] = Math.floor(obs2num/5);
  obs2[1] = obs2num%5;
  while(obs2num == tunnelnum || obs2num == wardennum || obs2num == prisonernum || obs2num == obs1num) {obs1num = Math.round(Math.random()*25);
    obs2num = Math.floor(Math.random()*24);
    obs2[0] = Math.floor(obs2num/5);
    obs2[1] = obs2num%5;
  }
  board.obstacleindex.push(obs2);

  //obstacle3
  var obs3 = [,];
  var obs3num = Math.floor(Math.random()*25);
  obs3[0] = Math.floor(obs3num/5);
  obs3[1] = obs3num%5;
  while(obs3num == tunnelnum || obs3num == wardennum || obs3num == prisonernum || obs3num == obs1num || obs3num == obs2num){
    obs3num = Math.floor(Math.random()*25);
    obs3[0] = Math.floor(obs3num/5);
    obs3[1] = obs3num%5;
  }
  board.obstacleindex.push(obs3);

  //obstacle4
  var obs4 = [,];
  var obs4num = Math.floor(Math.random()*25);
  obs4[0] = Math.floor(obs4num/5);
  obs4[1] = obs4num%5;
  while(obs4num == tunnelnum || obs4num == wardennum || obs4num == prisonernum || obs4num == obs1num || obs4num == obs2num || obs4num == obs3num){
    obs4num = Math.floor(Math.random()*25);
    obs4[0] = Math.floor(obs4num/5);
    obs4[1] = obs4num%5;
  }
  board.obstacleindex.push(obs4);

  //obstacle5
  var obs5 = [,];
  var obs5num = Math.floor(Math.random()*25);
  obs5[0] = Math.floor(obs5num/5);
  obs5[1] = obs5num%5;
  while(obs5num == tunnelnum || obs5num == wardennum || obs5num == prisonernum || obs5num == obs1num || obs5num == obs2num || obs5num == obs3num || obs5num == obs4num){
    obs5num = Math.floor(Math.random()*25);
    obs5[0] = Math.floor(obs5num/5);
    obs5[1] = obs5num%5;
  }
  board.obstacleindex.push(obs5);
}



app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  // if (io.engine.clientsCount > connectionsLimit) {
  //   socket.emit('err', { message: 'reach the limit of connections' })
  //   socket.disconnect()
  //   console.log(socket.id+ ' has tried to connect but the socket has reach the limit of connections. Disconnected...')
  //   return
  // }
  console.log('one user connected ' + socket.id);
  socket.on("req", (message) => {
    if(message === "join") {
      io.of('/').in('room').clients((error, clients) => {
        if (error) throw error;
        if(clients.length === roomLimit) {
          socket.emit('full', "The room is currently full");
          console.log("emit 'full' (156)");
        } else {
          socket.join('room', () => {
            console.log(socket.id+" joined the room");
            io.of('/').in('room').clients((error, clients) => {
              if (error) throw error;
              if(clients.length === 1) {
                if(roomClients.player1.id === "") {
                  roomClients.player1.id = socket.id;
                  console.log("Client(s) in the room: "+clients);
                  io.emit("waiting", "waiting for another opponent...");
                  console.log("emit 'waiting' (167)");
                } else if (roomClients.player2.id === ""){
                  roomClients.player2.id = socket.id;
                  console.log("Client(s) in the room: "+clients);
                  io.emit("waiting", "waiting for another opponent...");
                  console.log("emit 'waiting' (172)");
                }
                console.log(roomClients);
                
              } else if (clients.length === 2) {
                if (roomClients.player2.id === "") {
                  roomClients.player2.id = socket.id;
                  console.log("Client(s) in the room: "+clients);
                  io.emit("connected", "connection success");
                  console.log("emit 'connected' (181)");
                  randomRoles();
                  console.log(clients);
                  io.to(clients[0]).emit("char",roomClients.player1.role);
                  console.log("emit 'char' to player1 (185)");
                  io.to(clients[1]).emit("char",roomClients.player2.role);
                  console.log("emit 'char' to player2 (187)");
                  console.log(roomClients);
                  randomBoard();
                  io.emit("board", board);
                  console.log("emit 'board' (191)");
                  // change to send array of randomed field
                  io.to(clients[0]).emit("start", "start match");
                  console.log("emit 'start' to player1 (194)");
                  io.to(clients[1]).emit("start", "start match");
                  console.log("emit 'start' to player2 (196)");
                  socket.on("ready", () => {
                    if(roomClients.player1.role == "warden") {
                      io.to(roomClients.player1.id).emit("turn", "warden");
                      console.log("emit 'turn' to player1 (200)");
                    } else if(roomClients.player2.role == "warden") {
                      io.to(roomClients.player2.id).emit("turn", "warden");
                      console.log("emit 'turn' to player2 (203)");
                    }
                  })
                } else {
                  roomClients.player1.id = socket.id;
                  console.log("Client(s) in the room: "+clients);
                  io.emit("connected", "connection success");
                  console.log("emit 'connected' (210)");
                  randomRoles();
                  io.to(clients[0]).emit("char",roomClients.player2.role);
                  console.log("emit 'char' to player1 (213)");
                  io.to(clients[1]).emit("char",roomClients.player1.role);
                  console.log("emit 'char' to player2 (215)");
                  console.log(roomClients);
                  randomBoard();
                  console.log(board);
                  io.emit("board", board);
                  console.log("emit 'board' (220)");
                  // change to send array of randomed field
                  io.to(clients[0]).emit("start", "start match");
                  console.log("emit 'start' to player1 (223)");
                  io.to(clients[1]).emit("start", "start match");
                  console.log("emit 'start' to player2 (225)");
                  socket.on("ready", () => {
                    if(roomClients.player1.role == "warden") {
                      io.to(roomClients.player1.id).emit("turn", "warden");
                      console.log("emit 'turn' to player1 (229)");
                    } else if(roomClients.player2.role == "warden") {
                      io.to(roomClients.player2.id).emit("turn", "warden");
                      console.log("emit 'turn' to player2 (233)");
                    }
                  })
                }  
              };
            })
          });
        }
        
      })
      
    }
    if (message === "leave") {
      console.log(socket.id+" left the room");
      socket.leave('room');
      if(roomClients.player1.id === socket.id) {
        roomClients.player1.id = '';
        roomClients.player1.role = '';
      } else if(roomClients.player2.id === socket.id) {
        roomClients.player2.id = '';
        roomClients.player2.role = '';
      }
      console.log(roomClients);
      io.of('/').in('room').clients((error, clients) => {
        io.to(clients[0]).emit("waiting", "waiting for another opponent...")
        console.log("emit 'waiting' (257)");
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

  socket.on("move", message => {
    //move up
    if(message == "movedown") {
      if(roomClients.player1.id === socket.id) {
        if(roomClients.player1.role == "prisoner") {
          if((board.obstacleindex[0][0] - board.prisonerindex[0] == 1 && board.obstacleindex[0][1] - board.prisonerindex[1] == 0) 
          || (board.obstacleindex[1][0] - board.prisonerindex[0] == 1 && board.obstacleindex[1][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[2][0] - board.prisonerindex[0] == 1 && board.obstacleindex[2][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[3][0] - board.prisonerindex[0] == 1 && board.obstacleindex[3][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[4][0] - board.prisonerindex[0] == 1 && board.obstacleindex[4][1] - board.prisonerindex[1] == 0)
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (290)");
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[0]++;
            console.log("prisoner movedown")
            io.emit("board", board);
            console.log("emit 'board' (298)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              io.emit("winner","prisoner");
              console.log("emit 'winner' (301)")
              console.log("prisoner win");
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (305)")
              console.log("warden win");
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (309)")
            }
          }
        } else if(roomClients.player1.role === "warden") {
          if((board.obstacleindex[0][0] - board.wardenindex[0] == 1 && board.obstacleindex[0][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[1][0] - board.wardenindex[0] == 1 && board.obstacleindex[1][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[2][0] - board.wardenindex[0] == 1 && board.obstacleindex[2][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[3][0] - board.wardenindex[0] == 1 && board.obstacleindex[3][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[4][0] - board.wardenindex[0] == 1 && board.obstacleindex[4][1] - board.wardenindex[1] == 0)
          || (board.tunnelindex[0] - board.wardenindex[0] == 1 && board.tunnelindex[1] - board.wardenindex[1] == 0) 
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move' (321)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[0]++;
            console.log("warden movedown");
            io.emit("board", board);
            console.log("emit 'board' (329)")
            if(isEqual(board.wardenindex,board.prisonerindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (332)")
              console.log("warden win");
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (336)")
            }
          }
        }
      
      } else if(roomClients.player2.id === socket.id) {
        if(roomClients.player2.role === "prisoner") {
          if((board.obstacleindex[0][0] - board.prisonerindex[0] == 1 && board.obstacleindex[0][1] - board.prisonerindex[1] == 0) 
          || (board.obstacleindex[1][0] - board.prisonerindex[0] == 1 && board.obstacleindex[1][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[2][0] - board.prisonerindex[0] == 1 && board.obstacleindex[2][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[3][0] - board.prisonerindex[0] == 1 && board.obstacleindex[3][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[4][0] - board.prisonerindex[0] == 1 && board.obstacleindex[4][1] - board.prisonerindex[1] == 0)
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (350)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[0]++;
            console.log("prisoner movedown")
            io.emit("board", board);
            console.log("emit 'board' (358)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              io.emit("winner","prisoner");
              console.log("emit 'winner' (361)")
              console.log("prisoner win");
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (365)")
              console.log("warden win");
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (369)")
            }
          }
        
        } else if(roomClients.player2.role === "warden") {
          if((board.obstacleindex[0][0] - board.wardenindex[0] == 1 && board.obstacleindex[0][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[1][0] - board.wardenindex[0] == 1 && board.obstacleindex[1][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[2][0] - board.wardenindex[0] == 1 && board.obstacleindex[2][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[3][0] - board.wardenindex[0] == 1 && board.obstacleindex[3][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[4][0] - board.wardenindex[0] == 1 && board.obstacleindex[4][1] - board.wardenindex[1] == 0)
          || (board.tunnelindex[0] - board.wardenindex[0] == 1 && board.tunnelindex[1] - board.wardenindex[1] == 0) 
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (382)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[0]++;
            console.log("warden movedown")
            io.emit("board", board);
            console.log("emit 'board' (390)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (393)")
              console.log("warden win");
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (397)")
            }
          }
        }
      }
    //move down
    } else if(message === "moveup") {
      if(roomClients.player1.id === socket.id) {
        if(roomClients.player1.role === "prisoner") {
          if((board.obstacleindex[0][0] - board.prisonerindex[0] == -1 && board.obstacleindex[0][1] - board.prisonerindex[1] == 0) 
          || (board.obstacleindex[1][0] - board.prisonerindex[0] == -1 && board.obstacleindex[1][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[2][0] - board.prisonerindex[0] == -1 && board.obstacleindex[2][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[3][0] - board.prisonerindex[0] == -1 && board.obstacleindex[3][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[4][0] - board.prisonerindex[0] == -1 && board.obstacleindex[4][1] - board.prisonerindex[1] == 0)
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (413)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[0]--;
            console.log("prisoner moveup");
            io.emit("board", board);
            console.log("emit 'board' (421)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              io.emit("winner","prisoner");
              console.log("emit 'winner' (424)")
              console.log("prisoner win");
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (428)")
              console.log("warden win");
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (432)")
            }
          }
        } else if(roomClients.player1.role === "warden") {
          if((board.obstacleindex[0][0] - board.wardenindex[0] == -1 && board.obstacleindex[0][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[1][0] - board.wardenindex[0] == -1 && board.obstacleindex[1][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[2][0] - board.wardenindex[0] == -1 && board.obstacleindex[2][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[3][0] - board.wardenindex[0] == -1 && board.obstacleindex[3][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[4][0] - board.wardenindex[0] == -1 && board.obstacleindex[4][1] - board.wardenindex[1] == 0) 
          || (board.tunnelindex[0] - board.wardenindex[0] == -1 && board.tunnelindex[1] - board.wardenindex[1] == 0) 
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (444)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[0]--;
            console.log("warden moveup")
            io.emit("board", board);
            console.log("emit 'board' (452)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (456)")
              console.log("warden win");
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (459)")
            }
          }
        }
      } else if(roomClients.player2.id === socket.id) {
        if(roomClients.player2.role === "prisoner") {
          if((board.obstacleindex[0][0] - board.prisonerindex[0] == -1 && board.obstacleindex[0][1] - board.prisonerindex[1] == 0) 
          || (board.obstacleindex[1][0] - board.prisonerindex[0] == -1 && board.obstacleindex[1][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[2][0] - board.prisonerindex[0] == -1 && board.obstacleindex[2][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[3][0] - board.prisonerindex[0] == -1 && board.obstacleindex[3][1] - board.prisonerindex[1] == 0)
          || (board.obstacleindex[4][0] - board.prisonerindex[0] == -1 && board.obstacleindex[4][1] - board.prisonerindex[1] == 0)
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (472)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[0]--;
            console.log("warden moveup")
            io.emit("board", board);
            console.log("emit 'board' (480)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              io.emit("winner","prisoner");
              console.log("emit 'winner' (483)")
              console.log("prisoner win")
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (487)")
              console.log("warden win");
              
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (492)")
            }
          }

        } else if(roomClients.player2.role === "warden") {
          if((board.obstacleindex[0][0] - board.wardenindex[0] == -1 && board.obstacleindex[0][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[1][0] - board.wardenindex[0] == -1 && board.obstacleindex[1][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[2][0] - board.wardenindex[0] == -1 && board.obstacleindex[2][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[3][0] - board.wardenindex[0] == -1 && board.obstacleindex[3][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[4][0] - board.wardenindex[0] == -1 && board.obstacleindex[4][1] - board.wardenindex[1] == 0) 
          || (board.tunnelindex[0] - board.wardenindex[0] == -1 && board.tunnelindex[1] - board.wardenindex[1] == 0) 
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            // io.emit("board", board);
            // console.log("emit ('err','invalid move')")
            console.log("invalid move");
          } else {
            board.wardenindex[0]--;
            console.log("warden moveup")
            io.emit("board", board);
            console.log("emit 'board' (512)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (515)")
              console.log("warden win");
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (519)")
            }
          }
        }
      }
    //move left
    } else if(message === "moveleft") {
      if(roomClients.player1.id === socket.id) {
        if(roomClients.player1.role === "prisoner") {
          if((board.obstacleindex[0][1] - board.prisonerindex[1] == -1 && board.obstacleindex[0][0] - board.prisonerindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.prisonerindex[1] == -1 && board.obstacleindex[1][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[2][1] - board.prisonerindex[1] == -1 && board.obstacleindex[2][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[3][1] - board.prisonerindex[1] == -1 && board.obstacleindex[3][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[4][1] - board.prisonerindex[1] == -1 && board.obstacleindex[4][0] - board.prisonerindex[0] == 0) 
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (535)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[1]--;
            console.log("prisoner moveleft");
            io.emit("board", board);
            console.log("emit 'board' (543)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              io.emit("winner","prisoner");
              console.log("emit 'winner' (546)")
              console.log("prisoner win");
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (550)")
              console.log("warden win");
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (554)")
            }
          }
          
        } else if(roomClients.player1.role === "warden") {
          if((board.obstacleindex[0][1] - board.wardenindex[1] == -1 && board.obstacleindex[0][0] - board.wardenindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.wardenindex[1] == -1 && board.obstacleindex[1][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[2][1] - board.wardenindex[1] == -1 && board.obstacleindex[2][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[3][1] - board.wardenindex[1] == -1 && board.obstacleindex[3][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[4][1] - board.wardenindex[1] == -1 && board.obstacleindex[4][0] - board.wardenindex[0] == 0)
          || (board.tunnelindex[1] - board.wardenindex[1] == -1 && board.tunnelindex[0]-board.wardenindex[0]==0) 
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (567)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[1]--;
            console.log("warden moveleft");
            io.emit("board", board);
            console.log("emit 'board' (575)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (578)")
              console.log("warden win");
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (582)")
            }
          }
        }
      } else if(roomClients.player2.id === socket.id) {
        if(roomClients.player2.role === "prisoner") {
          if((board.obstacleindex[0][1] - board.prisonerindex[1] == -1 && board.obstacleindex[0][0] - board.prisonerindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.prisonerindex[1] == -1 && board.obstacleindex[1][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[2][1] - board.prisonerindex[1] == -1 && board.obstacleindex[2][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[3][1] - board.prisonerindex[1] == -1 && board.obstacleindex[3][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[4][1] - board.prisonerindex[1] == -1 && board.obstacleindex[4][0] - board.prisonerindex[0] == 0) 
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move' (595)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[1]--;
            console.log("prisoner moveleft");
            io.emit("board", board);
            console.log("emit 'board' (603)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              io.emit("winner","prisoner");
              console.log("emit 'winner' (606)")
              console.log("prisoner win");
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (610)")
              console.log("warden win");
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (614)")
            }
          }
          
        } else if(roomClients.player2.role === "warden") {
          if((board.obstacleindex[0][1] - board.wardenindex[1] == -1 && board.obstacleindex[0][0] - board.wardenindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.wardenindex[1] == -1 && board.obstacleindex[1][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[2][1] - board.wardenindex[1] == -1 && board.obstacleindex[2][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[3][1] - board.wardenindex[1] == -1 && board.obstacleindex[3][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[4][1] - board.wardenindex[1] == -1 && board.obstacleindex[4][0] - board.wardenindex[0] == 0)
          || (board.tunnelindex[1] - board.wardenindex[1] == -1 && board.tunnelindex[0]-board.wardenindex[0]==0) 
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (627)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[1]--;
            console.log("warden moveleft");
            io.emit("board", board);
            console.log("emit 'board' (635)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (638)")
              console.log("warden win");
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (642)")
            }
          }
        }
      }
    //move right
    } else if(message === "moveright") {
      if(roomClients.player1.id === socket.id) {
        if(roomClients.player1.role === "prisoner") {
          if((board.obstacleindex[0][1] - board.prisonerindex[1] == 1 && board.obstacleindex[0][0] - board.prisonerindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.prisonerindex[1] == 1 && board.obstacleindex[1][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[2][1] - board.prisonerindex[1] == 1 && board.obstacleindex[2][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[3][1] - board.prisonerindex[1] == 1 && board.obstacleindex[3][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[4][1] - board.prisonerindex[1] == 1 && board.obstacleindex[4][0] - board.prisonerindex[0] == 0) 
          ){            
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move' (658)")
            // io.emit("board", board)
            // console.log("emit 'board'")
            console.log("invalid move");;
          } else {
            board.prisonerindex[1]++;
            console.log("prisoner moveright");
            io.emit("board", board);
            console.log("emit 'board' (666)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              io.emit("winner","prisoner");
              console.log("emit 'winner' (669)")
              console.log("prisoner win");
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (673)")
              console.log("warden win");
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (677)")
            }
          }
          
        } else if(roomClients.player1.role === "warden") {
          if((board.obstacleindex[0][1] - board.wardenindex[1] == 1 && board.obstacleindex[0][0] - board.wardenindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.wardenindex[1] == 1 && board.obstacleindex[1][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[2][1] - board.wardenindex[1] == 1 && board.obstacleindex[2][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[3][1] - board.wardenindex[1] == 1 && board.obstacleindex[3][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[4][1] - board.wardenindex[1] == 1 && board.obstacleindex[4][0] - board.wardenindex[0] == 0)
          || (board.tunnelindex[1] - board.wardenindex[1] == 1 && board.tunnelindex[0]-board.wardenindex[0]==0) 
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (691")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[1]++;
            console.log("warden moveright");
            io.emit("board", board);
            console.log("emit 'board' (698)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (701)")
              console.log("warden win");
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (705)")
            }
          }
        }
      } else if(roomClients.player2.id === socket.id) {
        if(roomClients.player2.role === "prisoner") {
          if((board.obstacleindex[0][1] - board.prisonerindex[1] == 1 && board.obstacleindex[0][0] - board.prisonerindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.prisonerindex[1] == 1 && board.obstacleindex[1][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[2][1] - board.prisonerindex[1] == 1 && board.obstacleindex[2][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[3][1] - board.prisonerindex[1] == 1 && board.obstacleindex[3][0] - board.prisonerindex[0] == 0)
          || (board.obstacleindex[4][1] - board.prisonerindex[1] == 1 && board.obstacleindex[4][0] - board.prisonerindex[0] == 0) 
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move' (718)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[1]++;
            console.log("prisoner moveright");
            io.emit("board", board);
            console.log("emit 'board' (726)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              io.emit("winner","prisoner");
              console.log("emit 'winner' (729)")
              console.log("prisoner win");
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (733)")
              console.log("warden win");
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (737)")
            }
          }
          
        } else if(roomClients.player2.role === "warden") {
          if((board.obstacleindex[0][1] - board.wardenindex[1] == 1 && board.obstacleindex[0][0] - board.wardenindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.wardenindex[1] == 1 && board.obstacleindex[1][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[2][1] - board.wardenindex[1] == 1 && board.obstacleindex[2][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[3][1] - board.wardenindex[1] == 1 && board.obstacleindex[3][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[4][1] - board.wardenindex[1] == 1 && board.obstacleindex[4][0] - board.wardenindex[0] == 0)
          || (board.tunnelindex[1] - board.wardenindex[1] == 1 && board.tunnelindex[0]-board.wardenindex[0]==0)){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (749)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[1]++;
            console.log("warden moveright");
            io.emit("board", board);
            console.log("emit 'board' (757)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              io.emit("winner","warden");
              console.log("emit 'winner' (760)")
              console.log("warden win");
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (764)")
            }
          }
        }
      }
    } else if(message === "skip") {
      if(roomClients.player1.id === socket.id) {
        if(roomClients.player1.role === "prisoner") {
          console.log("prisoner skip");
          io.emit("board", board);
          console.log("emit 'board' (774)");
          io.emit("turn","warden");
          console.log("emit 'turn' (776)");
        } else if(roomClients.player1.role === "warden") {
          console.log("warden skip");
          io.emit("board", board);
          console.log("emit 'board' (780)");
          io.emit("turn","prisoner");
          console.log("emit 'turn' (782)");
        }
      } else if(roomClients.player2.id === socket.id) {
        if(roomClients.player2.role === "prisoner") {
          console.log("prisoner skip");
          io.emit("board", board);
          console.log("emit 'board' (788)");
          io.emit("turn","warden");
          console.log("emit 'turn' (790)");
        } else if(roomClients.player2.role === "warden") {
          console.log("warden skip");
          io.emit("board", board);
          console.log("emit 'board' (794)");
          io.emit("turn","prisoner");
          console.log("emit 'turn' (796)");
        }
      }
    }
  });
        
  socket.on("disconnect", function() {

    console.log("one user disconnected " + socket.id);
    if(roomClients.player1.id === socket.id) {
      roomClients.player1.id = '';
      roomClients.player1.role = '';
    } else if(roomClients.player2.id === socket.id) {
      roomClients.player2.id = '';
      roomClients.player2.role = '';
    }
    console.log(roomClients);
    
  });
});

http.listen(3000, function() {
  console.log("server listening on port 3000");
});
