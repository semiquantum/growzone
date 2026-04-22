import { supabase, getUserDisplayName } from "./supabase-config.js";

const profileToggle = document.getElementById("profileToggle");
const profileDropdown = document.getElementById("profileDropdown");
let currentUser = null;

function renderDropdown(user) {
  if (!profileDropdown) {
    return;
  }

  if (user) {
    const displayName = getUserDisplayName(user);
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
          await supabase.auth.signOut();
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

async function hydrateAuthUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    currentUser = null;
    renderDropdown(null);
    return;
  }

  currentUser = data.user;
  renderDropdown(data.user);
}

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  renderDropdown(currentUser);
});

hydrateAuthUser();

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
