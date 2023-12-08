const http = require('http');
// const WebSocket = require('ws');

// console.log('here 1');
// console.log('here 2');
// console.log('here 3');
// console.log('here 4');

// Create an HTTP server that responds to a request to the root path
const httpServer = http.createServer((req, res) => {
  if (req.url === '/') {
    console.log(`New request with headers: ${JSON.stringify(req.headers)}`);
    res.statusCode = 200;
    res.write('healthy');
    res.end();
  }
});

httpServer.listen(8080, () => {
  console.log('HTTP server listening on port 8080 1');
  console.log('HTTP server listening on port 8080 2');
});

// // Create a WebSocket server that listens on the same port as the HTTP server
// const webSocketServer = new WebSocket.Server({ server: httpServer });

// webSocketServer.on('connection', (socket, request) => {
//   console.log(`New client connected with headers: ${JSON.stringify(request.headers)}`);

//   socket.on('message', (data) => {
//     console.log(`Received message: ${data}`);

//     // Echo the message back to the client
//     socket.send(`You said: ${data}`);
//   });

//   socket.on('close', () => {
//     console.log('Client disconnected1');
//   });
// });
// let port = 8081;

let IO = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

IO.use((socket, next) => {
  if (socket.handshake.query) {
    let callerId = socket.handshake.query.callerId;
    socket.user = callerId;
    next();
  }
});

IO.on("connection", (socket) => {
  console.log(socket.user, "Connected");
  socket.join(socket.user);

  socket.on("makeCall", (data) => {
    let calleeId = data.calleeId;
    let sdpOffer = data.sdpOffer;

    socket.to(calleeId).emit("newCall", {
      callerId: socket.user,
      sdpOffer: sdpOffer,
    });
  });

  socket.on("answerCall", (data) => {
    let callerId = data.callerId;
    let sdpAnswer = data.sdpAnswer;

    socket.to(callerId).emit("callAnswered", {
      callee: socket.user,
      sdpAnswer: sdpAnswer,
    });
  });

  socket.on("IceCandidate", (data) => {
    let calleeId = data.calleeId;
    let iceCandidate = data.iceCandidate;

    socket.to(calleeId).emit("IceCandidate", {
      sender: socket.user,
      iceCandidate: iceCandidate,
    });
  });
});

