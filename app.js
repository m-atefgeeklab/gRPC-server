const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const app = express();
const PORT = 3000;
app.use(express.json());

// Load protobuf
const PROTO_PATH = './src/proto/social.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const socialProto = grpc.loadPackageDefinition(packageDefinition).social;

// Create gRPC client
const client = new socialProto.SocialService('localhost:50051', grpc.credentials.createInsecure());

// API endpoints
app.post('/users', (req, res) => {
  client.createUser(req.body, (error, response) => {
    if (error) return res.status(500).send(error);
    res.status(201).send(response);
  });
});

app.get('/users/:id', (req, res) => {
  client.getUser({ id: req.params.id }, (error, response) => {
    if (error) return res.status(404).send(error);
    res.send(response);
  });
});

app.post('/posts', (req, res) => {
  client.createPost(req.body, (error, response) => {
    if (error) return res.status(500).send(error);
    res.status(201).send(response);
  });
});

app.get('/posts/:id', (req, res) => {
  client.getPost({ id: req.params.id }, (error, response) => {
    if (error) return res.status(404).send(error);
    res.send(response);
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
