'use strict';
const session = require('express-session');
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const uuid = require('uuid');
const ws = require('ws');
const app = express();
const map = new Map();
const port = process.env.PORT || 8000;

// Need to have the same instance of session parser in express and WebSocket server.
const sessionParser = session({
    saveUninitialized: false,
    secret: '$HelloWorld',
    resave: false
});

app.get('/css/bulma.css', (req, res) => {
    res.sendFile(__dirname + '/node_modules/bulma/css/bulma.css');
});

app.use(express.static('public')); // contains client side code
app.use(bodyParser.json()); // allow use to read the body section of a request
app.use(sessionParser);

// Assign user an unique id when the click the login button
app.post('/login', (req, res) => {
    const id = uuid.v4();
    req.session.userId = id;
    map.set(id, { username: req.body.username });
    res.send({ result: 'ok' });
});

// Create HTTP Server
const server = http.createServer(app);
const wss = new ws.Server({ noServer: true });

// when a websocket request is made, handle the upgrade and pass the unique id along
server.on('upgrade', (request, socket, head) => {
    console.log('Parsing session from request...');
    sessionParser(request, {}, () => {
        if (!request.session.userId) {
            socket.destroy();
            return;
        }
        console.log('Session is parsed!');
        wss.handleUpgrade(request, socket, head, function (ws) {
            console.log('upgrade connection to websockets');
            wss.emit('connection', ws, request);
        });
    });
});

wss.on('connection', function (ws, req) {
    const userId = req.session.userId;
    let { username } = map.get(userId);
    map.set(userId, { username, 'websocket': ws });
    console.log(`User ${username} connected with id: ${userId}`);

    ws.on('message', function(msg) {
        console.log(`User ${username} (${userId}) Sent: ${msg}`);
        map.forEach(item => {
            let client = item['websocket'];
            client.send(JSON.stringify({'user': username, 'msg':msg}));
        })
    });

    ws.on('close', function() {
        console.log(`Connection to ${username} (${userId}) closed`);
        map.delete(userId);
    });

    ws.on('error', function(error) {
        console.log(`Error: ${error}`);
    });
});

server.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
