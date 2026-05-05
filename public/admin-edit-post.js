const editPostForm = document.getElementById("editPostForm");
const editMessage = document.getElementById("editMessage");
const existingImages = document.getElementById("existingImages");
const logoutBtn = document.getElementById("logoutBtn");

function getPostIdFromUrl() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1];
}

function formatForDateTimeLocal(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const postId = getPostIdFromUrl();

async function loadPost() {
  try {
    const response = await fetch(`/api/posts/${postId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Post alınamadı.");
    }

    const post = result.data;

    document.getElementById("title").value = post.title || "";
    document.getElementById("description").value = post.description || "";
    document.getElementById("created_at").value = formatForDateTimeLocal(post.created_at);

    renderImages(post.images || []);
  } catch (error) {
    editMessage.textContent = error.message;
    editMessage.className = "form-message error";
  }
}

function renderImages(images) {
  if (!images.length) {
    existingImages.innerHTML = `<p>Fotoğraf yok.</p>`;
    return;
  }

  existingImages.innerHTML = images
    .map((img) => {
      const previewSrc = img.thumb_url || img.image_url;

      return `
        <div class="admin-image-card">
          <img src="${previewSrc}" alt="Post Fotoğrafı" class="admin-edit-image" />
          <div class="admin-image-actions">
            ${
              img.is_cover
                ? `<span class="cover-badge">Kapak Foto</span>`
                : `<button class="btn small-btn" type="button" onclick="setCover('${img.id}')">Kapak Yap</button>`
            }
            <button class="btn small-btn danger-btn" type="button" onclick="deleteImage('${img.id}')">Sil</button>
          </div>
        </div>
      `;
    })
    .join("");
}

editPostForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  editMessage.textContent = "Güncelleniyor...";
  editMessage.className = "form-message";

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
    const response = await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Güncelleme başarısız.");
    }

    editMessage.textContent = "Post güncellendi.";
    editMessage.className = "form-message success";
    document.getElementById("images").value = "";

    loadPost();
  } catch (error) {
    editMessage.textContent = error.message;
    editMessage.className = "form-message error";
  }
});

async function deleteImage(imageId) {
  const confirmed = confirm("Bu fotoğrafı silmek istiyor musun?");
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/posts/images/${imageId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Fotoğraf silinemedi.");
    }

    loadPost();
  } catch (error) {
    alert(error.message);
  }
}

async function setCover(imageId) {
  try {
    const response = await fetch(`/api/posts/images/${imageId}/cover`, {
      method: "PATCH",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Kapak foto değişmedi.");
    }

    loadPost();
  } catch (error) {
    alert(error.message);
  }
}

logoutBtn.addEventListener("click", async function () {
  await fetch("/auth/logout", { method: "POST" });
  window.location.href = "/yonetim-giris";
});

loadPost();