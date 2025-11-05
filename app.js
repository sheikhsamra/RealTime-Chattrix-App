// -------------------- FIREBASE SETUP --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

import { EmojiButton } from "https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.2/dist/index.min.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAZFSIi5JHBAHbFZd81D435PKP0ak_mbgg",
  authDomain: "realtime-database-f11e5.firebaseapp.com",
  projectId: "realtime-database-f11e5",
  storageBucket: "realtime-database-f11e5.appspot.com",
  messagingSenderId: "694081174199",
  appId: "1:694081174199:web:b6c838bf96954a932ceb32",
  measurementId: "G-PP9P7L0LW8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// -------------------- AUTH --------------------
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

document.getElementById("google-btn")?.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then(() => {
      alert("Google Sign-In successful!");
      window.location.href = "user.html";
    })
    .catch((error) => alert(error.message));
});

document.getElementById("logout")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Logged out successfully!");
      localStorage.removeItem("userName");
      window.location.href = "index.html";
    })
    .catch((error) => alert(error.message));
});

// -------------------- USERNAME SET --------------------
document.getElementById("user-btn")?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Please enter your username!");
  localStorage.setItem("userName", username);
  alert(`Welcome, ${username}!`);
  window.location.href = "chat.html";
});

const currentUser = localStorage.getItem("userName");

// -------------------- SEND MESSAGE --------------------
document.getElementById("sendBtn")?.addEventListener("click", () => {
  const message = document.getElementById("message").value.trim();
  if (!message || !currentUser) return;

  push(ref(db, "messages"), {
    name: currentUser,
    text: message,
    type: "text",
    time: Date.now(),
  });

  document.getElementById("message").value = "";
});

// -------------------- DISPLAY MESSAGES --------------------
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

  if (data.type === "audio") {
    msgWrapper.innerHTML = `
      <div class="msg-info">
        <span class="username">${data.name}</span>
        <audio controls src="${data.url}" style="width:200px;"></audio>
      </div>
    `;
  } else if (data.name !== currentUser) {
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

  // Edit
  msgWrapper.querySelector(".edit-btn")?.addEventListener("click", async () => {
    const newText = prompt("Edit your message:", data.text);
    if (newText && newText.trim()) {
      await update(ref(db, "messages/" + key), { text: newText });
      msgWrapper.querySelector(".message-bubble").textContent = newText;
    }
  });

  // Delete
  msgWrapper.querySelector(".del-btn")?.addEventListener("click", async () => {
    if (confirm("Delete this message?")) {
      await remove(ref(db, "messages/" + key));
      msgWrapper.remove();
    }
  });
});

// -------------------- THEME TOGGLE --------------------
const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme") || "light";
body.classList.add(savedTheme);
if (themeToggle) themeToggle.textContent = savedTheme === "light" ? "🌙" : "☀️";

themeToggle?.addEventListener("click", () => {
  if (body.classList.contains("light")) {
    body.classList.replace("light", "dark");
    themeToggle.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.replace("dark", "light");
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

// -------------------- WALLPAPER CHANGE --------------------
// 🌸 Wallpaper Customization System
const wallpaperPanel = document.getElementById("wallpaperPanel");
const wallpaperSelectBtn = document.getElementById("wallpaperSelect");
const chatBox = document.querySelector(".chat-container");

// toggle panel on dropdown click
wallpaperSelectBtn?.addEventListener("click", () => {
  wallpaperPanel.style.display =
    wallpaperPanel.style.display === "none" || !wallpaperPanel.style.display
      ? "block"
      : "none";
});

// prebuilt wallpaper select
document.querySelectorAll(".wall-option").forEach((img) => {
  img.addEventListener("click", () => {
    const imgUrl = `url(${img.src})`;
    chatBox.style.backgroundImage = imgUrl;
    chatBox.style.backgroundSize = "cover";
    chatBox.style.backgroundRepeat = "no-repeat";
    chatBox.style.backgroundPosition = "center";
    localStorage.setItem("wallpaper", imgUrl);
    wallpaperPanel.style.display = "none";
  });
});

// upload from gallery
document.getElementById("uploadWallpaper")?.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imgUrl = `url(${reader.result})`;
      chatBox.style.backgroundImage = imgUrl;
      chatBox.style.backgroundSize = "cover";
      chatBox.style.backgroundRepeat = "no-repeat";
      chatBox.style.backgroundPosition = "center";
      localStorage.setItem("wallpaper", imgUrl);
    };
    reader.readAsDataURL(file);
    wallpaperPanel.style.display = "none";
  };
});

// load saved wallpaper on refresh
const savedBg = localStorage.getItem("wallpaper");
if (savedBg) {
  chatBox.style.backgroundImage = savedBg;
  chatBox.style.backgroundSize = "cover";
  chatBox.style.backgroundRepeat = "no-repeat";
  chatBox.style.backgroundPosition = "center";
}






// -------------------- EMOJI PICKER --------------------
const emojiBtn = document.getElementById("emojiBtn");
const messageInput = document.getElementById("message");

// Create emoji picker
const picker = new EmojiButton({
  position: "top-end",
  theme: "auto", // auto adjust for dark/light
  emojiVersion: "14.0",
  zIndex: 9999,
});

emojiBtn.addEventListener("click", () => {
  picker.togglePicker(emojiBtn);
});

picker.on("emoji", (selection) => {
  messageInput.value += selection.emoji;
});





// -------------------- VOICE MESSAGE --------------------
const voiceBtn = document.getElementById("voiceBtn");
let mediaRecorder;
let audioChunks = [];

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  voiceBtn?.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      audioChunks = [];
      voiceBtn.textContent = "⏹️ Recording...";
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const audioRef = sRef(storage, "voices/" + Date.now() + ".webm");
        await uploadBytes(audioRef, blob);
        const url = await getDownloadURL(audioRef);

        push(ref(db, "messages"), {
          name: currentUser,
          url,
          type: "audio",
          time: Date.now(),
        });
        voiceBtn.textContent = "🎤";
      };
      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 10000);
    } else {
      mediaRecorder.stop();
    }
  });
}
