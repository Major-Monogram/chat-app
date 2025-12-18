let socket;
let username;

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const joinBtn = document.getElementById("joinBtn");
const sendBtn = document.getElementById("sendBtn");

const usernameInput = document.getElementById("usernameInput");
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chat-box");

joinBtn.onclick = () => {
  username = usernameInput.value.trim();
  if (!username) return alert("Enter a username");

  loginScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");

  connectWebSocket();
};

function connectWebSocket() {
  // CHANGE THIS later to your backend WebSocket URL
  socket = new WebSocket("ws://localhost:8080");

  socket.onopen = () => {
    socket.send(JSON.stringify({
      type: "join",
      username: username
    }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    addMessage(data.username, data.message);
  };

  socket.onclose = () => {
    addMessage("SYSTEM", "Disconnected from server");
  };
}

sendBtn.onclick = sendMessage;
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;

  socket.send(JSON.stringify({
    type: "message",
    message: msg
  }));

  messageInput.value = "";
}

function addMessage(user, msg) {
  const div = document.createElement("div");
  div.classList.add("message");

  div.innerHTML = `<span class="username">${user}:</span> ${escapeHTML(msg)}`;
  chatBox.appendChild(div);

  chatBox.scrollTop = chatBox.scrollHeight;
}

// basic XSS protection
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[m]);
}
