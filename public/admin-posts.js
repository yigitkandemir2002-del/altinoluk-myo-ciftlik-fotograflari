const adminPostsList = document.getElementById("adminPostsList");
const logoutBtn = document.getElementById("logoutBtn");

async function loadAdminPosts() {
  try {
    const response = await fetch("/api/posts/admin/list");
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Postlar alınamadı.");
    }

    const posts = result.data;

    if (!posts.length) {
      adminPostsList.innerHTML = `<p>Henüz post yok.</p>`;
      return;
    }

    adminPostsList.innerHTML = posts
      .map((post) => {
        const coverSrc = post.cover_thumb || post.cover_image;

        return `
          <div class="admin-post-card">
            <div class="admin-post-image-wrap">
              ${
                coverSrc
                  ? `<img src="${coverSrc}" alt="${post.title}" class="admin-post-image" />`
                  : `<div class="no-image small-no-image">Görsel yok</div>`
              }
            </div>
            <div class="admin-post-content">
              <h3>${post.title}</h3>
              <p>${post.description || ""}</p>
              <p class="post-date">${new Date(post.created_at).toLocaleString("tr-TR")}</p>

              <div class="admin-post-actions">
                <a href="/yonetim-post-duzenle/${post.id}" class="btn small-btn">Düzenle</a>
                <a href="/post/${post.id}" class="btn small-btn" target="_blank">Görüntüle</a>
                <button class="btn small-btn danger-btn" type="button" onclick="deletePost('${post.id}')">Sil</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    adminPostsList.innerHTML = `<p class="error-text">${error.message}</p>`;
  }
}

async function deletePost(postId) {
  const confirmed = confirm("Bu paylaşımı tamamen silmek istiyor musun?");
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Paylaşım silinemedi.");
    }

    loadAdminPosts();
  } catch (error) {
    alert(error.message);
  }
}

logoutBtn.addEventListener("click", async function () {
  await fetch("/auth/logout", { method: "POST" });
  window.location.href = "/yonetim-giris";
});

loadAdminPosts();