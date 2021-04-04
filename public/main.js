(() => {
  const escape = (string) =>
    string.replace(/[&<>"']/g, (chr) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[chr];
    });

  const ws = new WebSocket("ws://" + location.host);

  const $loginForm = document.querySelector("#login-form");
  const $messageForm = document.querySelector("#message-form");
  const $messages = document.querySelector("#messages");

  const createMessage = (data) => {
    const $el = document.createElement("div");
    $el.className = "message";
    $el.innerHTML = `${
      data.user.admin ? "<strong>[admin]</strong> " : ""
    }<strong style="color:${data.user.color}">${escape(
      escape(data.user.nickname)
    )}</strong>: ${
      data.messageRestricted
        ? "<i>Message restricted to administrators.</i>"
        : escape(data.message)
    }`;
    return $el;
  };

  ws.onmessage = (e) => {
    const shouldScroll =
      $messages.scrollTop + $messages.clientHeight === $messages.scrollHeight;
    const data = JSON.parse(e.data);
    $messages.appendChild(createMessage(data));
    if (shouldScroll) {
      $messages.scrollTop = $messages.scrollHeight;
    }
    if ("successfulLogin" in data) {
      $loginForm.hidden = true;
      $messageForm.hidden = false;
    }
  };

  $loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    ws.send(
      JSON.stringify({
        nickname: $loginForm.elements.nickname.value,
        color: $loginForm.elements.color.value,
      })
    );
  });

  $messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    ws.send(
      JSON.stringify({
        message: $messageForm.elements.message.value,
      })
    );
    $messageForm.elements.message.value = "";
  });
})();
