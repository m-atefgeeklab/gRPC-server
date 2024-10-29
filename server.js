const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const mongoose = require("mongoose");
const User = require("./src/models/user");
const Post = require("./src/models/post");

const PROTO_PATH = "./src/proto/social.proto";
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const socialProto = grpc.loadPackageDefinition(packageDefinition).social;

// MongoDB setup
mongoose
  .connect("mongodb://127.0.0.1:27017/social_media")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// gRPC service implementation
const createUser = async (call, callback) => {
  const { name, email } = call.request;
  const user = new User({ name, email });

  try {
    const savedUser = await user.save();
    callback(null, {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const getUser = async (call, callback) => {
  const user = await User.findById(call.request.id);
  if (user) {
    callback(null, { id: user._id, name: user.name, email: user.email });
  } else {
    callback({ code: grpc.status.NOT_FOUND, details: "User not found" });
  }
};

const createPost = async (call, callback) => {
  const { user, content } = call.request;
  const post = new Post({ user, content });

  try {
    const savedPost = await post.save();
    callback(null, {
      id: savedPost._id,
      user: savedPost.user,
      content: savedPost.content,
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const getPost = async (call, callback) => {
  const post = await Post.findById(call.request.id).populate("user");
  
  if (post) {
    callback(null, {
      id: post._id,
      user: post.user,
      content: post.content,
    });
  } else {
    callback({ code: grpc.status.NOT_FOUND, details: "Post not found" });
  }
};

// Start gRPC server
const server = new grpc.Server();
server.addService(socialProto.SocialService.service, {
  createUser,
  getUser,
  createPost,
  getPost,
});

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("gRPC server running on port 50051");
  }
);
