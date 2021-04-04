import Koa from "koa";
import fs from "fs";
import ws from "ws";
import http from "http";

const server = http.createServer();
const app = new Koa();
const wsServer = new ws.Server({ server: server, clientTracking: true });
const index = fs.readFileSync("./index.html").toString();
const flag = fs.readFileSync("./flag.txt").toString();

app.use((ctx) => {
  ctx.body = fs.readFileSync("./index.html").toString();
});

wsServer.on("connection", (client) => {
  client.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      client.send('{"error": "SyntaxError in JSON"}');
      return;
    }

    if ("user" in client) {
      console.log(client.user);
    } else {
      client.user = data;
      console.log(client.user);
    }
    client.send(JSON.stringify(client.user));
  });
});

server.on("request", app.callback());
server.listen(8080);
