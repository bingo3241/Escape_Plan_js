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
var rematchPlayer1;
var rematchPlayer2;
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
  board = {
    "wardenindex":[,],
    "prisonerindex":[,],
    "tunnelindex":[,],
    "obstacleindex":[]
  }
  //tunnel
  var tunnelnum = Math.floor(Math.random()*25);
  board.tunnelindex[0] = Math.floor(tunnelnum/5);
  board.tunnelindex[1] = tunnelnum%5;
  
  //warden
  var wardennum = Math.floor(Math.random()*25);
  board.wardenindex[0] = Math.floor(wardennum/5);
  board.wardenindex[1] = wardennum%5;
  while((board.wardenindex[0] >= board.tunnelindex[0]-1 && board.wardenindex[0] <= board.tunnelindex[0]+1 
    && board.wardenindex[1] >= board.tunnelindex[1]-1 && board.wardenindex[1] <= board[1]+1) || wardennum == tunnelnum) {
      wardennum = Math.floor(Math.random()*25);
    board.wardenindex[0] = Math.round(wardennum/5);
    board.wardenindex[1] = wardennum%5;
  }

  //prisoner
  var prisonernum = Math.floor(Math.random()*25);
  board.prisonerindex[0] = Math.floor(prisonernum/5);
  board.prisonerindex[1] = prisonernum%5;
  while((board.prisonerindex[0] >= board.tunnelindex[0]-1 && board.prisonerindex[0] <= board.tunnelindex[0]+1 
    && board.prisonerindex[1] >= board.tunnelindex[1]-1 && board.prisonerindex[1] <= board[1]+1) || 
    (board.prisonerindex[0] >= board.wardenindex[0]-1 && board.prisonerindex[0] <= board.wardenindex[0]+1 && board.prisonerindex[1] >= board.wardenindex[1]-1 && board.prisonerindex[1] <= board.wardenindex[1]+1)|| prisonernum == tunnelnum || prisonernum == wardennum) {
    prisonernum = Math.floor(Math.random()*25);
    board.prisonerindex[0] = Math.floor(prisonernum/5);
    board.prisonerindex[1] = prisonernum%5;
  }
  var obs = [];
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
  obs.push(obs1);

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
  obs.push(obs2);

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
  obs.push(obs3);

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
  obs.push(obs4);

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
  obs.push(obs5);
  board.obstacleindex = obs;
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
          console.log("emit 'full' (158)");
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
                  console.log("emit 'waiting' (169)");
                } else if (roomClients.player2.id === ""){
                  roomClients.player2.id = socket.id;
                  console.log("Client(s) in the room: "+clients);
                  io.emit("waiting", "waiting for another opponent...");
                  console.log("emit 'waiting' (183)");
                }

              } else if (clients.length === 2) {
                if (roomClients.player2.id === "") {
                  roomClients.player2.id = socket.id;
                  console.log("Client(s) in the room: "+clients);
                  io.emit("connected", "connection success");
                  console.log("emit 'connected' (193)");
                  randomRoles();
                  console.log(clients);
                  io.to(clients[0]).emit("char",roomClients.player1.role);
                  console.log("emit 'char' to player1 (197)");
                  io.to(clients[1]).emit("char",roomClients.player2.role);
                  console.log("emit 'char' to player2 (199)");
                  console.log(roomClients);
                  console.log("(197)")
                  randomBoard();
                  io.emit("board", board);
                  console.log(board);
                  console.log("emit 'board' (203)");
                  // change to send array of randomed field
                  io.to(clients[0]).emit("start", "start match");
                  console.log("emit 'start' to player1 (206)");
                  io.to(clients[1]).emit("start", "start match");
                  console.log("emit 'start' to player2 (205)");
                  socket.on("ready", () => {
                    if(roomClients.player1.role == "warden") {
                      io.to(roomClients.player1.id).emit("turn", "warden");
                      console.log("emit 'turn' to player1 (212)");
                    } else if(roomClients.player2.role == "warden") {
                      io.to(roomClients.player2.id).emit("turn", "warden");
                      console.log("emit 'turn' to player2 (215)");
                    }
                  })
                } else {
                  roomClients.player1.id = socket.id;
                  console.log("Client(s) in the room: "+clients);
                  io.emit("connected", "connection success");
                  console.log("emit 'connected' (222)");
                  randomRoles();
                  io.to(clients[0]).emit("char",roomClients.player2.role);
                  console.log("emit 'char' to player1 (225)");
                  io.to(clients[1]).emit("char",roomClients.player1.role);
                  console.log("emit 'char' to player2 (227)");
                  console.log(""+roomClients+"(229)");
                  randomBoard();
                  io.emit("board", board);
                  console.log("emit 'board' (232)");
                  console.log(board);
                  // change to send array of randomed field
                  io.to(clients[0]).emit("start", "start match");
                  console.log("emit 'start' to player1 (235)");
                  io.to(clients[1]).emit("start", "start match");
                  console.log("emit 'start' to player2 (228)");
                  socket.on("ready", () => {
                    if(roomClients.player1.role == "warden") {
                      io.to(roomClients.player1.id).emit("turn", "warden");
                      console.log("emit 'turn' to player1 (2232)");
                    } else if(roomClients.player2.role == "warden") {
                      io.to(roomClients.player2.id).emit("turn", "warden");
                      console.log("emit 'turn' to player2 (235)");
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
        roomClients.player1.point = 0;
        io.to(roomClients.player2.id).emit("clear", "someone leave");
        console.log("emit 'clear' to player2 (269)")
      } else if(roomClients.player2.id === socket.id) {
        roomClients.player2.id = '';
        roomClients.player2.role = '';
        roomClients.player2.point = 0;
        io.to(roomClients.player1.id).emit("clear", "someone leave");
        console.log("emit 'clear' to player1 (267)")
      }
      
      
      console.log(roomClients);
      console.log('(265)')
      io.of('/').in('room').clients((error, clients) => {
        io.to(clients[0]).emit("waiting", "waiting for another opponent...")
        console.log("emit 'waiting' (260)");
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
          || (board.prisonerindex[0] == 4)
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (293)");
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[0]++;
            console.log("prisoner movedown")
            io.emit("board", board);
            console.log("emit 'board' (301)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              winner("prisoner");
              console.log("emit from winner() (311)")
              console.log("prisoner win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (316)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (314)")
            }
          }
        } else if(roomClients.player1.role === "warden") {
          if((board.obstacleindex[0][0] - board.wardenindex[0] == 1 && board.obstacleindex[0][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[1][0] - board.wardenindex[0] == 1 && board.obstacleindex[1][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[2][0] - board.wardenindex[0] == 1 && board.obstacleindex[2][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[3][0] - board.wardenindex[0] == 1 && board.obstacleindex[3][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[4][0] - board.wardenindex[0] == 1 && board.obstacleindex[4][1] - board.wardenindex[1] == 0)
          || (board.tunnelindex[0] - board.wardenindex[0] == 1 && board.tunnelindex[1] - board.wardenindex[1] == 0)
          || (board.wardenindex[0] == 4) 
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move' (326)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[0]++;
            console.log("warden movedown");
            io.emit("board", board);
            console.log("emit 'board' (334)")
            if(isEqual(board.wardenindex,board.prisonerindex)) {
              winner("warden");
              console.log("emit from winner() (344)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (342)")
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
          || (board.prisonerindex[0] == 4)
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (356)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[0]++;
            console.log("prisoner movedown")
            io.emit("board", board);
            console.log("emit 'board' (364)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              winner("prisoner");
              console.log("emit from winner() (374)")
              console.log("prisoner win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (379)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (377)")
            }
          }
        
        } else if(roomClients.player2.role === "warden") {
          if((board.obstacleindex[0][0] - board.wardenindex[0] == 1 && board.obstacleindex[0][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[1][0] - board.wardenindex[0] == 1 && board.obstacleindex[1][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[2][0] - board.wardenindex[0] == 1 && board.obstacleindex[2][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[3][0] - board.wardenindex[0] == 1 && board.obstacleindex[3][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[4][0] - board.wardenindex[0] == 1 && board.obstacleindex[4][1] - board.wardenindex[1] == 0)
          || (board.tunnelindex[0] - board.wardenindex[0] == 1 && board.tunnelindex[1] - board.wardenindex[1] == 0)
          || (board.wardenindex[0] == 4) 
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (390)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[0]++;
            console.log("warden movedown")
            io.emit("board", board);
            console.log("emit 'board' (398)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (408)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (406)")
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
          || (board.prisonerindex[0] == 0)
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (422)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[0]--;
            console.log("prisoner moveup");
            io.emit("board", board);
            console.log("emit 'board' (430)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              winner("prisoner");
              console.log("emit from winner() (440)")
              console.log("prisoner win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (445)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (443)")
            }
          }
        } else if(roomClients.player1.role === "warden") {
          if((board.obstacleindex[0][0] - board.wardenindex[0] == -1 && board.obstacleindex[0][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[1][0] - board.wardenindex[0] == -1 && board.obstacleindex[1][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[2][0] - board.wardenindex[0] == -1 && board.obstacleindex[2][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[3][0] - board.wardenindex[0] == -1 && board.obstacleindex[3][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[4][0] - board.wardenindex[0] == -1 && board.obstacleindex[4][1] - board.wardenindex[1] == 0) 
          || (board.tunnelindex[0] - board.wardenindex[0] == -1 && board.tunnelindex[1] - board.wardenindex[1] == 0)
          || (board.wardenindex[0] == 0) 
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (455)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[0]--;
            console.log("warden moveup")
            io.emit("board", board);
            console.log("emit 'board' (463)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (473)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (471)")
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
          || (board.prisonerindex[0] == 0)
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (484)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[0]--;
            console.log("warden moveup")
            io.emit("board", board);
            console.log("emit 'board' (492)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              winner("prisoner");
              console.log("emit from winner() (503)")
              console.log("prisoner win")
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (507)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
              
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (506)")
            }
          }

        } else if(roomClients.player2.role === "warden") {
          if((board.obstacleindex[0][0] - board.wardenindex[0] == -1 && board.obstacleindex[0][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[1][0] - board.wardenindex[0] == -1 && board.obstacleindex[1][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[2][0] - board.wardenindex[0] == -1 && board.obstacleindex[2][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[3][0] - board.wardenindex[0] == -1 && board.obstacleindex[3][1] - board.wardenindex[1] == 0)
          || (board.obstacleindex[4][0] - board.wardenindex[0] == -1 && board.obstacleindex[4][1] - board.wardenindex[1] == 0) 
          || (board.tunnelindex[0] - board.wardenindex[0] == -1 && board.tunnelindex[1] - board.wardenindex[1] == 0)
          || (board.wardenindex[0] == 0) 
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            // io.emit("board", board);
            // console.log("emit ('err','invalid move')")
            console.log("invalid move");
          } else {
            board.wardenindex[0]--;
            console.log("warden moveup")
            io.emit("board", board);
            console.log("emit 'board' (526)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (536)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (534)")
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
          || (board.prisonerindex[1] == 0) 
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (550)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[1]--;
            console.log("prisoner moveleft");
            io.emit("board", board);
            console.log("emit 'board' (558)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              winner("prisoner");
              console.log("emit from winner() (568)")
              console.log("prisoner win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (573)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (571)")
            }
          }
          
        } else if(roomClients.player1.role === "warden") {
          if((board.obstacleindex[0][1] - board.wardenindex[1] == -1 && board.obstacleindex[0][0] - board.wardenindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.wardenindex[1] == -1 && board.obstacleindex[1][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[2][1] - board.wardenindex[1] == -1 && board.obstacleindex[2][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[3][1] - board.wardenindex[1] == -1 && board.obstacleindex[3][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[4][1] - board.wardenindex[1] == -1 && board.obstacleindex[4][0] - board.wardenindex[0] == 0)
          || (board.tunnelindex[1] - board.wardenindex[1] == -1 && board.tunnelindex[0]-board.wardenindex[0]==0)
          || (board.wardenindex[1] == 0)  
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (584)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[1]--;
            console.log("warden moveleft");
            io.emit("board", board);
            console.log("emit 'board' (592)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (602)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (600)")
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
          || (board.prisonerindex[1] == 0)  
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move' (613)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[1]--;
            console.log("prisoner moveleft");
            io.emit("board", board);
            console.log("emit 'board' (621)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              winner("prisoner");
              console.log("emit from winner() (631)")
              console.log("prisoner win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (636)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (634)")
            }
          }
          
        } else if(roomClients.player2.role === "warden") {
          if((board.obstacleindex[0][1] - board.wardenindex[1] == -1 && board.obstacleindex[0][0] - board.wardenindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.wardenindex[1] == -1 && board.obstacleindex[1][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[2][1] - board.wardenindex[1] == -1 && board.obstacleindex[2][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[3][1] - board.wardenindex[1] == -1 && board.obstacleindex[3][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[4][1] - board.wardenindex[1] == -1 && board.obstacleindex[4][0] - board.wardenindex[0] == 0)
          || (board.tunnelindex[1] - board.wardenindex[1] == -1 && board.tunnelindex[0]-board.wardenindex[0]==0)
          || (board.wardenindex[1] == 0)  
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (647)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[1]--;
            console.log("warden moveleft");
            io.emit("board", board);
            console.log("emit 'board' (655)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (665)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (663)")
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
          || (board.prisonerindex[1] == 4)  
          ){            
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move' (679)")
            // io.emit("board", board)
            // console.log("emit 'board'")
            console.log("invalid move");;
          } else {
            board.prisonerindex[1]++;
            console.log("prisoner moveright");
            io.emit("board", board);
            console.log("emit 'board' (687)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              winner("prisoner");
              console.log("emit from winner() (697)")
              console.log("prisoner win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (702)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (700)")
            }
          }
          
        } else if(roomClients.player1.role === "warden") {
          if((board.obstacleindex[0][1] - board.wardenindex[1] == 1 && board.obstacleindex[0][0] - board.wardenindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.wardenindex[1] == 1 && board.obstacleindex[1][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[2][1] - board.wardenindex[1] == 1 && board.obstacleindex[2][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[3][1] - board.wardenindex[1] == 1 && board.obstacleindex[3][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[4][1] - board.wardenindex[1] == 1 && board.obstacleindex[4][0] - board.wardenindex[0] == 0)
          || (board.tunnelindex[1] - board.wardenindex[1] == 1 && board.tunnelindex[0]-board.wardenindex[0]==0)
          || (board.wardenindex[1] == 4)   
          ){
            io.to(roomClients.player1.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (713")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[1]++;
            console.log("warden moveright");
            io.emit("board", board);
            console.log("emit 'board' (721)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (731)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (729)")
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
          || (board.prisonerindex[1] == 4)   
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move' (742)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.prisonerindex[1]++;
            console.log("prisoner moveright");
            io.emit("board", board);
            console.log("emit 'board' (750)")
            if(isEqual(board.prisonerindex,board.tunnelindex)) {
              winner("prisoner");
              console.log("emit from winner() (760)")
              console.log("prisoner win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (766)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "warden");
              console.log("emit 'turn' (764)")
            }
          }
          
        } else if(roomClients.player2.role === "warden") {
          if((board.obstacleindex[0][1] - board.wardenindex[1] == 1 && board.obstacleindex[0][0] - board.wardenindex[0] == 0) 
          || (board.obstacleindex[1][1] - board.wardenindex[1] == 1 && board.obstacleindex[1][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[2][1] - board.wardenindex[1] == 1 && board.obstacleindex[2][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[3][1] - board.wardenindex[1] == 1 && board.obstacleindex[3][0] - board.wardenindex[0] == 0)
          || (board.obstacleindex[4][1] - board.wardenindex[1] == 1 && board.obstacleindex[4][0] - board.wardenindex[0] == 0)
          || (board.tunnelindex[1] - board.wardenindex[1] == 1 && board.tunnelindex[0]-board.wardenindex[0]==0)
          || (board.wardenindex[1] == 4)  
          ){
            io.to(roomClients.player2.id).emit("err", "Invalid move");
            console.log("emit ('err','invalid move') (776)")
            // io.emit("board", board);
            // console.log("emit 'board'")
            console.log("invalid move");
          } else {
            board.wardenindex[1]++;
            console.log("warden moveright");
            io.emit("board", board);
            console.log("emit 'board' (784)")
            if(isEqual(board.prisonerindex,board.wardenindex)) {
              winner("warden");
              console.log("emit from winner() (794)")
              console.log("warden win");
              console.log("Player1: "+roomClients.player1.point+", Player2 :"+roomClients.player2.point);
            } else {
              io.emit("turn", "prisoner");
              console.log("emit 'turn' (792)")
            }
          }
        }
      }
    } else if(message === "skip") {
      if(roomClients.player1.id === socket.id) {
        if(roomClients.player1.role === "prisoner") {
          console.log("prisoner skip");
          io.emit("board", board);
          console.log("emit 'board' (802)");
          io.emit("turn","warden");
          console.log("emit 'turn' (804)");
        } else if(roomClients.player1.role === "warden") {
          console.log("warden skip");
          io.emit("board", board);
          console.log("emit 'board' (808)");
          io.emit("turn","prisoner");
          console.log("emit 'turn' (810)");
        }
      } else if(roomClients.player2.id === socket.id) {
        if(roomClients.player2.role === "prisoner") {
          console.log("prisoner skip");
          io.emit("board", board);
          console.log("emit 'board' (816)");
          io.emit("turn","warden");
          console.log("emit 'turn' (818)");
        } else if(roomClients.player2.role === "warden") {
          console.log("warden skip");
          io.emit("board", board);
          console.log("emit 'board' (822)");
          io.emit("turn","prisoner");
          console.log("emit 'turn' (824)");
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
    console.log('(848)')
  });

  socket.on("rematch", () => {
    rematchPlayer1 = null;
    rematchPlayer2 = null;
    if(socket.id == roomClients.player1.id) {
      rematchPlayer1 = true;
    }
    if(socket.id == roomClients.player2.id) {
      rematchPlayer2 = true;
    }
    if(rematchPlayer1 == true && rematchPlayer2 == true) {
      io.of('/').in('room').clients((error, clients) => {
        randomRoles();
        console.log(clients);
        io.to(clients[0]).emit("char",roomClients.player1.role);
        console.log("emit 'char' to player1 (197)");
        io.to(clients[1]).emit("char",roomClients.player2.role);
        console.log("emit 'char' to player2 (199)");
        console.log(roomClients);
        console.log("(197)")
        randomBoard();
        io.emit("board", board);
        console.log(board);
        console.log("emit 'board' (203)");
        // change to send array of randomed field
        io.to(clients[0]).emit("start", "start match");
        console.log("emit 'start' to player1 (206)");
        io.to(clients[1]).emit("start", "start match");
        console.log("emit 'start' to player2 (205)");
        socket.on("ready", () => {
          if(roomClients.player1.role == "warden") {
            io.to(roomClients.player1.id).emit("turn", "warden");
            console.log("emit 'turn' to player1 (212)");
          } else if(roomClients.player2.role == "warden") {
            io.to(roomClients.player2.id).emit("turn", "warden");
            console.log("emit 'turn' to player2 (215)");
          }
        })
      })
    }
  });
  
  socket.on("surrender", () => {
    if(socket.id == roomClients.player1.id) {
      rematchPlayer1 = false;
    }
    if(socket.id == roomClients.player2.id) {
      rematchPlayer2 = false;
    }
    if(rematchPlayer1 == false) {
      io.to(roomClients.player2).emit("win"," Opponent give up. You win!")
      console.log("emit 'win' to player2")
  
    } else if(rematchPlayer2 == false) {
      io.to(roomClients.player1).emit("win"," Opponent give up. You win!")
      console.log("emit 'win' to player2")
    }
  });
});



http.listen(3000, function() {
  console.log("server listening on port 3000");
});

function winner(role) {
  var result = {
    "roles":[],
    "points":[],
    "winner":""
  }

  result.winner = role;

  if(roomClients.player1.role == role) {
    roomClients.player1.point = roomClients.player1.point+1;
    if(role == "prisoner") {
      result.roles[0] = role;
      result.roles[1] = "warden"
      result.points[0] = roomClients.player1.point;
      result.points[1] = roomClients.player2.point;
    } else if(role == "warden") {
      result.roles[0] = "prisoner"
      result.roles[1] = role
      result.points[0] = roomClients.player2.point;
      result.points[1] = roomClients.player1.point;
    }
  } else if(roomClients.player2.role == role) {
    roomClients.player2.point = roomClients.player2.point+1;
    if(role == "prisoner") {
      result.roles[0] = role;
      result.roles[1] = "warden"
      result.points[0] = roomClients.player2.point;
      result.points[1] = roomClients.player1.point;
    } else if(role == "warden") {
      result.roles[0] = "prisoner"
      result.roles[1] = role
      result.points[0] = roomClients.player1.point;
      result.points[1] = roomClients.player2.point;
    }
  }
  
  io.emit("winner",result);
  console.log("emit 'winner'");
}

