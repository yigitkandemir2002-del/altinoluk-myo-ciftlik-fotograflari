async function loadPosts() {
  const postsContainer = document.getElementById("postsContainer");
  const emptyMessage = document.getElementById("emptyMessage");

  try {
    const response = await fetch("/api/posts");
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Paylaşımlar alınamadı.");
    }

    const posts = result.data;

    if (!posts || posts.length === 0) {
      emptyMessage.style.display = "block";
      postsContainer.innerHTML = "";
      return;
    }

    emptyMessage.style.display = "none";

    postsContainer.innerHTML = posts
      .map((post) => {
        const coverSrc = post.cover_thumb || post.cover_image;

        const imageHtml = coverSrc
          ? `<img src="${coverSrc}" alt="${post.title}" class="post-image" />`
          : `<div class="no-image">Görsel yok</div>`;

        return `
          <a href="/post/${post.id}" class="post-link">
            <article class="post-card">
              <div class="post-main-image">
                ${imageHtml}
              </div>
              <div class="post-content">
                <h3>${post.title}</h3>
                <p class="post-date">${new Date(post.created_at).toLocaleString("tr-TR")}</p>
              </div>
            </article>
          </a>
        `;
      })
      .join("");
  } catch (error) {
    postsContainer.innerHTML = `<p class="error-text">${error.message}</p>`;
  }
}

loadPosts();