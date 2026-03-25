import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const profileToggle = document.getElementById("profileToggle");
const profileDropdown = document.getElementById("profileDropdown");
let currentUser = null;

function renderDropdown(user) {
  if (!profileDropdown) {
    return;
  }

  if (user) {
    const displayName = user.displayName || "GrowZone User";
    const email = user.email || "No email";

    profileDropdown.innerHTML = `
      <div style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${displayName}</strong><br>
        <small>${email}</small>
      </div>
      <a href="dashboard.html">Open Dashboard</a>
      <a href="growai.html">Open GrowZone AI</a>
      <button id="logoutBtn" type="button">Logout</button>
    `;

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await signOut(auth);
          profileDropdown.classList.remove("show");
        } catch (error) {
          console.error("Logout failed", error);
          alert("Unable to log out right now. Please try again.");
        }
      });
    }
  } else {
    profileDropdown.innerHTML = `
      <a href="login.html">Login</a>
      <a href="login.html#signup">Create Account</a>
    `;
  }
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  renderDropdown(user);
});

if (profileToggle && profileDropdown) {
  profileToggle.addEventListener("click", () => {
    renderDropdown(currentUser);
    profileDropdown.classList.toggle("show");
  });

  document.addEventListener("click", (event) => {
    const clickInsideMenu = profileDropdown.contains(event.target);
    const clickOnToggle = profileToggle.contains(event.target);

    if (!clickInsideMenu && !clickOnToggle) {
      profileDropdown.classList.remove("show");
    }
  });
}
