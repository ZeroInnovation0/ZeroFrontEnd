document.addEventListener("DOMContentLoaded", () => {
  // Profile Picture (unchanged)
  const profilePicture = document.getElementById("profile-picture");
  const userId = "user123";
  function setProfilePicture(userId) {
    const profileImages = { user123: "Images/profile-pic.png", default: null };
    const profileSrc = profileImages[userId];
    if (profileSrc) {
      const img = document.createElement("img");
      img.src = profileSrc;
      img.alt = "Profile Picture";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.borderRadius = "50%";
      img.style.objectFit = "cover";
      profilePicture.innerHTML = "";
      profilePicture.appendChild(img);
    } else {
      profilePicture.innerHTML = '<i class="fas fa-user"></i>';
    }
  }
  if (profilePicture) setProfilePicture(userId);

  // Dropdown Menu (unchanged)
  const dropdownBtn = document.querySelector(".dropdown-btn");
  const dropdownContent = document.querySelector(".dropdown-content");
  if (dropdownBtn && dropdownContent) {
    dropdownBtn.addEventListener("click", () => dropdownContent.classList.toggle("show"));
    document.addEventListener("click", (e) => {
      if (!dropdownContent.contains(e.target) && !dropdownBtn.contains(e.target)) {
        dropdownContent.classList.remove("show");
      }
    });
  }

  // Interactive Video Section (unchanged)
  const thumbnail = document.getElementById("profile-thumbnail");
  const video = document.getElementById("profile-video");
  if (thumbnail && video) {
    const playVideo = () => {
      thumbnail.style.display = "none";
      video.style.display = "block";
      video.play().catch((error) => console.error("Video play failed:", error));
    };
    thumbnail.addEventListener("click", playVideo);
  }

  // Reload and Scroll to Top (unchanged)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  const logo = document.querySelector(".logo");
  const footerHeader = document.querySelector(".footer-column h3");
  if (logo) logo.addEventListener("click", () => location.reload());
  if (footerHeader) footerHeader.addEventListener("click", () => location.reload());

  // Back-to-Top Button (unchanged)
  const backToTopButton = document.querySelector(".backtotop");
  const videoContainer = document.querySelector(".video-main-container");
  if (backToTopButton && videoContainer) {
    window.addEventListener("scroll", () => {
      const rect = videoContainer.getBoundingClientRect();
      if (rect.bottom < 0) backToTopButton.classList.add("show");
      else backToTopButton.classList.remove("show");
    });
    backToTopButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // Profile Card Wrapper Height (unchanged)
  const profileCardWrapper = document.querySelector(".profile-card-wrapper");
  const investorSection = document.querySelector(".investor-contribution");
  function setWrapperHeight() {
    if (!profileCardWrapper || !investorSection) {
      console.warn("Profile card wrapper or investor section not found");
      return;
    }
    const investorRect = investorSection.getBoundingClientRect();
    const investorBottom = investorRect.bottom + window.scrollY;
    profileCardWrapper.style.height = `${investorBottom}px`;
  }
  if (profileCardWrapper && investorSection) {
    setWrapperHeight();
    window.addEventListener("resize", setWrapperHeight);
  }

  // ScrollTrigger Refresh (unchanged)
  window.addEventListener("resize", () => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  // Lightbox Functionality (unchanged)
  const lightbox = document.getElementById("lightbox");
  const lightboxContent = document.getElementById("lightbox-content");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  let currentPostMedia = [];
  let currentIndex = 0;

  function clearLightbox() { lightboxContent.innerHTML = ""; }
  function createMediaElement(media) {
    if (media.tagName === "IMG") {
      const img = document.createElement("img");
      img.src = media.src; img.alt = media.alt || "Media";
      img.style.maxWidth = "90vw"; img.style.maxHeight = "80vh"; img.style.borderRadius = "8px";
      return img;
    } else if (media.tagName === "VIDEO") {
      const video = document.createElement("video");
      video.src = media.src; video.controls = true; video.autoplay = true; video.muted = true;
      video.style.maxWidth = "90vw"; video.style.maxHeight = "80vh"; video.style.borderRadius = "8px";
      return video;
    }
    return null;
  }
  function showMedia() {
    clearLightbox();
    const media = currentPostMedia[currentIndex];
    if (media) lightboxContent.appendChild(createMediaElement(media));
  }
  function openLightbox(mediaList, index) {
    if (!mediaList.length) return;
    currentPostMedia = mediaList; currentIndex = index;
    showMedia(); lightbox.classList.add("active"); document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lightbox.classList.remove("active");
    clearLightbox(); currentPostMedia = []; currentIndex = 0;
    document.body.style.overflow = "";
  }
  function prevMedia() {
    if (currentPostMedia.length) currentIndex = (currentIndex - 1 + currentPostMedia.length) % currentPostMedia.length;
    showMedia();
  }
  function nextMedia() {
    if (currentPostMedia.length) currentIndex = (currentIndex + 1) % currentPostMedia.length;
    showMedia();
  }
  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  if (prevBtn) prevBtn.addEventListener("click", prevMedia);
  if (nextBtn) nextBtn.addEventListener("click", nextMedia);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
    document.querySelectorAll(".activity-post").forEach((post) => {
      const mediaList = Array.from(post.querySelectorAll(".carousel-item"));
      mediaList.forEach((media, idx) => media.addEventListener("click", () => openLightbox(mediaList, idx)));
    });
    lightbox.classList.remove("active"); document.body.style.overflow = "";
  }

  // Carousel Navigation (single block, updated with transform)
  document.querySelectorAll(".carousel-container").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const prevBtn = carousel.querySelector(".carousel-btn.prev");
    const nextBtn = carousel.querySelector(".carousel-btn.next");
    const items = carousel.querySelectorAll(".carousel-item");

    if (!track || !items.length) {
      console.warn("Carousel track or items not found for:", carousel);
      return;
    }

    if (items.length <= 1) {
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
      return;
    }

    let currentIndex = 0;
    const itemWidth = items[0].offsetWidth + 8;

    function updateTrackPosition() {
      track.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
    }

    prevBtn.addEventListener("click", () => {
      if (currentIndex > 0) { currentIndex--; updateTrackPosition(); }
    });

    nextBtn.addEventListener("click", () => {
      if (currentIndex < items.length - 1) { currentIndex++; updateTrackPosition(); }
    });
  });
});