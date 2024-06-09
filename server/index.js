const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Document = require("./Document");

dotenv.config();
const mongodbUri = process.env.MONGODB_CONNECTION;
if (!mongodbUri) {
  throw new Error("Missing MONGODB_CONNECTION environment variable");
}
mongoose.connect(mongodbUri).then(() => {
  console.log("Connected successfully DB");
});

const defaultValue = "";

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);

    socket.join(documentId);

    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });

  console.log("connected");
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}
