const postForm = document.getElementById("postForm");
const formMessage = document.getElementById("formMessage");
const logoutBtn = document.getElementById("logoutBtn");

postForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  formMessage.textContent = "Yükleniyor...";
  formMessage.className = "form-message";

  const formData = new FormData();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const createdAt = document.getElementById("created_at").value;
  const imageFiles = document.getElementById("images").files;

  formData.append("title", title);
  formData.append("description", description);
  formData.append("created_at", createdAt);

  for (let i = 0; i < imageFiles.length; i++) {
    formData.append("images", imageFiles[i]);
  }

  try {
    const response = await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Bir hata oluştu.");
    }

    formMessage.textContent = "Paylaşım başarıyla eklendi.";
    formMessage.className = "form-message success";
    postForm.reset();
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.className = "form-message error";
  }
});

logoutBtn.addEventListener("click", async function () {
  await fetch("/auth/logout", {
    method: "POST",
  });

  window.location.href = "/yonetim-giris";
});