var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// var path = require('path');

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
})

let clients = [];

io.on('connection', function(socket){
    console.log('one user connected ' + socket.id);

    socket.on('req', () => {
        if(client.length%2 === 0) {
            clients.push({
                player1: socket.id,
                player2: ""
            });
            io.emit("waiting", "waiting for another opponent...")
        } else {
            clients[clients.length-1].player2 = socket.id;
            io.emit("connected", "connection success");
            // change to send array of randomed field
            io.to(clients[clients.length-1].player1).emit("start", "start match")
        }
    });

    socket.on('disconnect', function() {
        console.log('one user disconnected ' + socket.id);
    });
});

http.listen(3000, function(){
    console.log('server listening on port 3000');
})