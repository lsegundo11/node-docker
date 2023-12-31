const express = require("express");
const mongoose = require("mongoose");
//redis requriements
let RedisStore = require("connect-redis").default;
const session = require("express-session");
const redis = require("redis");

const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  REDIS_PORT,
  SESSION_SECRET,
} = require("./config/config");

//Initialized redis client
let redisClient = redis.createClient({
  url: `redis://${REDIS_URL}:${REDIS_PORT}`,
});
redisClient.connect().catch(console.error);

//initialize redis store
let redisStore = new RedisStore({
  client: redisClient,
});

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

const connectWithRetry = () => {
  mongoose
    .connect(mongoURL)
    .then(() => console.log("successfully connected to database"))
    .catch((e) => {
      console.log(e);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();
app.use(express.json());
//app.set("trust proxy");
app.use(
  session({
    store: redisStore,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 30000,
    },
  })
);

app.get("/", (req, res) => {
  res.send("<h2>Hi there</h2>");
});

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`listening on port ${port}`));
