const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  loginMessage.textContent = "Giriş yapılıyor...";
  loginMessage.className = "form-message";

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Giriş başarısız.");
    }

    window.location.href = "/yonetim-paneli";
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.className = "form-message error";
  }
});