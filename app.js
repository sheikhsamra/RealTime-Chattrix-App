// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAZFSIi5JHBAHbFZd81D435PKP0ak_mbgg",
  authDomain: "realtime-database-f11e5.firebaseapp.com",
  projectId: "realtime-database-f11e5",
  storageBucket: "realtime-database-f11e5.firebasestorage.app",
  messagingSenderId: "694081174199",
  appId: "1:694081174199:web:b6c838bf96954a932ceb32",
  measurementId: "G-PP9P7L0LW8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// 🔹 SignUp
document.getElementById("signup")?.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Signup successful!");
      window.location.href = "user.html";
    })
    .catch((error) => alert(error.message));
});

// 🔹 Login
document.getElementById("login")?.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login successful!");
      window.location.href = "user.html";
    })
    .catch((error) => alert(error.message));
});

// 🔹 Google SignIn
document.getElementById("google-btn")?.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then(() => {
      alert("Google Sign-In successful!");
      window.location.href = "user.html";
    })
    .catch((error) => alert(error.message));
});

// 🔹 Logout
document.getElementById("logout")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Logged out successfully!");
      localStorage.removeItem("userName");
      window.location.href = "index.html";
    })
    .catch((error) => alert(error.message));
});

// 🔹 Save Username and Go to Chat
document.getElementById("user-btn")?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Please enter your username!");
  localStorage.setItem("userName", username);
  window.location.href = "chat.html";
});

const currentUser = localStorage.getItem("userName");

// 🔹 Send Message
document.getElementById("sendBtn")?.addEventListener("click", () => {
  const message = document.getElementById("message").value.trim();
  if (!message) return;

  push(ref(db, "messages"), {
    name: currentUser,
    text: message,
    time: Date.now(),
  });

  document.getElementById("message").value = "";
});

// 🔹 Display Messages
onChildAdded(ref(db, "messages"), (snapshot) => {
  const data = snapshot.val();
  const key = snapshot.key;
  const messageBox = document.getElementById("messageBox");

  const msgWrapper = document.createElement("div");
  msgWrapper.classList.add("msg-wrapper");
  msgWrapper.classList.add(data.name === currentUser ? "sent" : "received");

  const colorHash = [...data.name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = colorHash % 360;
  const firstLetter = data.name.charAt(0).toUpperCase();

  if (data.name !== currentUser) {
    msgWrapper.innerHTML = `
      <div class="avatar" style="background-color:hsl(${hue},70%,60%)">${firstLetter}</div>
      <div class="msg-info">
        <span class="username">${data.name}</span>
        <div class="message-bubble">${data.text}</div>
      </div>
    `;
  } else {
    msgWrapper.innerHTML = `
      <div class="msg-info">
        <div class="message-bubble">${data.text}</div>
        <div class="msg-actions">
          <button class="edit-btn" data-id="${key}">✏️</button>
          <button class="del-btn" data-id="${key}">🗑️</button>
        </div>
      </div>
    `;
  }

  messageBox.appendChild(msgWrapper);
  messageBox.scrollTop = messageBox.scrollHeight;

  // 🔹 Edit Message
  msgWrapper.querySelector(".edit-btn")?.addEventListener("click", async () => {
    const newText = prompt("Edit your message:", data.text);
    if (newText && newText.trim()) {
      await update(ref(db, "messages/" + key), { text: newText });
      msgWrapper.querySelector(".message-bubble").textContent = newText;
    }
  });

  // 🔹 Delete Message
  msgWrapper.querySelector(".del-btn")?.addEventListener("click", async () => {
    if (confirm("Delete this message?")) {
      await remove(ref(db, "messages/" + key));
      msgWrapper.remove();
    }
  });
});

const body = document.body;
body.classList.add('dark'); // Default mode dark

const themeToggle = document.getElementById('themeToggle');
themeToggle?.addEventListener('click', () => {
  if (body.classList.contains('dark')) {
    body.classList.replace('dark', 'light');
    themeToggle.textContent = '🌙';
  } else {
    body.classList.replace('light', 'dark');
    themeToggle.textContent = '🌞';
  }
});

// 🔹 Logout Shortcut
document.getElementById("logout")?.addEventListener("click", () => {
  localStorage.removeItem("userName");
  location.reload();
});

