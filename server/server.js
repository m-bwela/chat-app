const { app, io } = require('./app');
const http = require('http');
const server = http.createServer(app);

const PORT = process.env.PORT;

// Attach Socket.IO to the server
io.attach(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});