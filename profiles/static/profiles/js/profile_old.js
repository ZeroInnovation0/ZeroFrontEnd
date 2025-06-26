document.addEventListener('DOMContentLoaded', () => {
  const profilePicture = document.getElementById('profile-picture');
  const userId = 'user123'; // Example user ID

  function setProfilePicture(userId) {
    const profileImages = {
      'user123': 'Images/profile-pic.png',
      'default': null
    };

    const profileSrc = profileImages[userId];

    if (profileSrc) {
      const img = document.createElement('img');
      img.src = profileSrc;
      img.alt = 'Profile Picture';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      profilePicture.innerHTML = '';
      profilePicture.appendChild(img);
    } else {
      profilePicture.innerHTML = '<i class="fas fa-user"></i>';
    }
  }

  setProfilePicture(userId);

  // Interactive video section
  const thumbnail = document.getElementById('profile-thumbnail');
  const video = document.getElementById('profile-video');

  if (thumbnail && video) {
    const playVideo = () => {
      thumbnail.style.display = 'none';
      video.style.display = 'block';
      video.play().catch((error) => console.error('Video play failed:', error));
    };
    thumbnail.addEventListener('click', playVideo);
  }

  // Reload and Scroll to Top
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const logo = document.querySelector('.logo');
  const footerHeader = document.querySelector('.footer-column h3');

  if (logo) logo.addEventListener('click', () => location.reload());
  if (footerHeader) footerHeader.addEventListener('click', () => location.reload());

  // Back-to-Top Button
  const backToTopButton = document.querySelector('.backtotop');
  const videoContainer = document.querySelector('.video-main-container');

  if (backToTopButton && videoContainer) {
    window.addEventListener('scroll', () => {
      const rect = videoContainer.getBoundingClientRect();
      if (rect.bottom < 0) backToTopButton.classList.add('show');
      else backToTopButton.classList.remove('show');
    });

    backToTopButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.addEventListener('resize', () => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
});
