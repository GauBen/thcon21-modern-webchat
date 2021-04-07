import Koa from "koa";
import fs from "fs";
import ws from "ws";
import http from "http";
import koaStatic from "koa-static";

const server = http.createServer();
const app = new Koa();
const wsServer = new ws.Server({ server: server, clientTracking: true });
const flag = fs.readFileSync("./flag.txt").toString().trim();

/** Send the flag to all administrators. */
const sendFlag = () => {
  wsServer.clients.forEach((client) => {
    if (client.readyState !== client.OPEN) {
      handleLogout(client);
      return;
    }
    if ("user" in client && "admin" in client.user && client.user.admin) {
      client.send(
        JSON.stringify({
          user: { nickname: "LePireBot", color: "#ECA400", admin: true },
          message: `Well done! Here is the flag: ${flag}`,
        })
      );
    } else {
      client.send(
        JSON.stringify({
          user: { nickname: "LePireBot", color: "#ECA400", admin: true },
          messageRestricted: true,
        })
      );
    }
  });
};
setInterval(sendFlag, 60000);

/** Send an error message to a client. */
const sendError = (client, message) => {
  client.send(
    JSON.stringify({
      user: { nickname: "Error", color: "#ff0000" },
      message: message,
    })
  );
};

/** Handle a data object sent to the server. */
const handleData = (client, data) => {
  if (!(data instanceof Object) || data.constructor !== Object) {
    sendError(client, "Unexpected object received.");
    return;
  }
  if ("user" in client) {
    handleMessage(client, data);
  } else {
    handleLogin(client, data);
  }
};

/** Handle a data object sent when the user is known. */
const handleMessage = (client, data) => {
  if (!("message" in data)) {
    sendError(client, "Message not found.");
    return;
  }
  const message = data.message.toString().substring(0, 280);
  wsServer.clients.forEach((socket) => {
    socket.send(
      JSON.stringify({
        user: client.user,
        message: message,
      })
    );
  });
};

/** Handle a login form. */
const handleLogin = (client, user) => {
  if (!("nickname" in user) || !/^[a-zA-Z0-9_.-]{3,20}$/.test(user.nickname)) {
    sendError(client, "Nickname does not match the regular expression.");
    return;
  }
  user.nickname = user.nickname.toString();
  if (!("color" in user) || !/^#[0-9a-fA-F]{6}$/.test(user.color)) {
    sendError(client, "Color does not match the regular expression.");
    return;
  }
  user.color = user.color.toString();
  if (nicknameInUse(user.nickname.toLowerCase())) {
    sendError(client, "Nickname already in use.");
    return;
  }
  if ("admin" in user) {
    // Prevent hacking!
    delete user.admin;
  }
  client.user = {};
  Object.assign(client.user, user);
  wsServer.clients.forEach((socket) => {
    socket.send(
      JSON.stringify({
        ...{
          user: { nickname: "Info", color: "#0088ff" },
          message: `${user.nickname} joined the chat room! ${wsServer.clients.size} people connected.`,
        },
        ...(socket === client ? { successfulLogin: true } : {}),
      })
    );
  });
};

/** Disconnect a socket. */
const nicknameInUse = (nickname) =>
  new Set(["lepirebot", "info", "admin", "error"]).has(nickname) ||
  [...wsServer.clients].some(
    (socket) =>
      "user" in socket && socket.user.nickname.toLowerCase() === nickname
  );

wsServer.on("connection", (client) => {
  client.send(
    '{"user":{"nickname":"Info","color":"#0088ff"},"message":"Connected to the chat room."}'
  );

  client.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      sendError(client, "SyntaxError in JSON object sent.");
      return;
    }
    handleData(client, data);
  });
});

app.use(koaStatic("./public"));
server.on("request", app.callback());
server.listen(8080);
