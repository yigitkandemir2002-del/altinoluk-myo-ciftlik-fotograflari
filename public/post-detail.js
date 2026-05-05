function getPostIdFromUrl() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1];
}

let currentImages = [];
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");

  if (!lightbox || !lightboxImg || currentImages.length === 0) return;

  lightboxImg.src = currentImages[currentIndex].image_url;
  lightbox.classList.remove("hidden");
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    lightbox.classList.add("hidden");
  }
}

function showNextImage() {
  if (currentImages.length === 0) return;

  currentIndex = (currentIndex + 1) % currentImages.length;
  document.getElementById("lightboxImg").src = currentImages[currentIndex].image_url;
}

function showPrevImage() {
  if (currentImages.length === 0) return;

  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  document.getElementById("lightboxImg").src = currentImages[currentIndex].image_url;
}

async function loadPostDetail() {
  const postDetail = document.getElementById("postDetail");
  const postId = getPostIdFromUrl();

  try {
    const response = await fetch(`/api/posts/${postId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Paylaşım alınamadı.");
    }

    const post = result.data;
    currentImages = post.images || [];

    const descriptionHtml =
      post.description && post.description.trim() !== ""
        ? `<p class="detail-description">${post.description}</p>`
        : "";

    const imagesHtml = currentImages.length
      ? currentImages
          .map((img, index) => {
            const previewSrc = img.thumb_url || img.image_url;

            return `
              <img 
                src="${previewSrc}" 
                alt="${post.title}" 
                class="detail-image"
                data-index="${index}"
              />
            `;
          })
          .join("")
      : `<div class="no-image">Görsel yok</div>`;

    postDetail.innerHTML = `
      <article class="detail-page">
        <section class="detail-top">
          <h2 class="detail-title">${post.title}</h2>
          <p class="detail-date">${new Date(post.created_at).toLocaleString("tr-TR")}</p>
          ${descriptionHtml}
        </section>

        <section class="detail-gallery">
          ${imagesHtml}
        </section>
      </article>

      <div id="lightbox" class="lightbox hidden">
        <button id="lightboxPrev" class="lightbox-btn lightbox-prev" type="button">&#10094;</button>
        <img id="lightboxImg" src="" alt="Büyük görsel" />
        <button id="lightboxNext" class="lightbox-btn lightbox-next" type="button">&#10095;</button>
        <button id="lightboxClose" class="lightbox-close" type="button">&times;</button>
      </div>
    `;

    const images = document.querySelectorAll(".detail-image");
    const lightbox = document.getElementById("lightbox");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");
    const closeBtn = document.getElementById("lightboxClose");

    images.forEach((img) => {
      img.addEventListener("click", () => {
        const index = Number(img.dataset.index);
        openLightbox(index);
      });
    });

    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showPrevImage();
    });

    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showNextImage();
    });

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLightbox();
    });

    lightbox.addEventListener("click", (e) => {
      if (e.target.id === "lightbox") {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (lightbox.classList.contains("hidden")) return;

      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showNextImage();
      if (e.key === "ArrowLeft") showPrevImage();
    });
  } catch (error) {
    postDetail.innerHTML = `<p class="error-text">${error.message}</p>`;
  }
}

loadPostDetail();