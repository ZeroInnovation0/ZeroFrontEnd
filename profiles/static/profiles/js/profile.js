document.addEventListener("DOMContentLoaded", () => {
    // Add this flag to track lightbox state
    let isLightboxOpen = false;


    // Preview Video Management
    function initializePreviewVideos() {
        // Detect if we're in preview mode
        const isPreviewPage = document.querySelector('.preview-container, .publish-preview, .edit-preview') !== null;
        
        if (isPreviewPage) {
            console.log('Preview mode detected - disabling video playback');
            
            // Find all videos in preview areas
            const previewVideos = document.querySelectorAll('.preview-container video, .publish-preview video, .edit-preview video');
            
            previewVideos.forEach(video => {
                // Disable video completely
                video.preload = 'none';
                video.autoplay = false;
                video.controls = false;
                video.muted = true;
                video.removeAttribute('autoplay');
                
                // Pause if somehow playing
                video.pause();
                video.currentTime = 0;
                
                // Create wrapper if not exists
                if (!video.parentElement.classList.contains('preview-video-container')) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'preview-video-container';
                    video.parentNode.insertBefore(wrapper, video);
                    wrapper.appendChild(video);
                    
                    // Add overlay with play icon
                    const overlay = document.createElement('div');
                    overlay.className = 'preview-video-overlay';
                    overlay.innerHTML = '<div class="play-icon"><i class="fas fa-play"></i></div>';
                    wrapper.appendChild(overlay);
                }
                
                // Remove all event listeners that might trigger play
                video.onplay = null;
                video.oncanplay = null;
                video.onloadeddata = null;
                video.onloadedmetadata = null;
                
                // Add event listener to prevent any play attempts
                video.addEventListener('play', (e) => {
                    e.preventDefault();
                    video.pause();
                    video.currentTime = 0;
                    console.log('Prevented video play in preview mode');
                });
                
                // Set poster image if available
                if (video.dataset.poster) {
                    video.poster = video.dataset.poster;
                }
            });
            
            // Also disable the intersection observer for preview videos
            const previewObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.target.tagName === "VIDEO") {
                        // Do nothing - keep videos paused in preview
                        entry.target.pause();
                        entry.target.currentTime = 0;
                    }
                });
            }, { threshold: 0.5 });
            
            // Observe preview videos with the disabled observer
            previewVideos.forEach(video => {
                previewObserver.observe(video);
            });
        }
    }

    // Call this function after DOM is loaded
    initializePreviewVideos();

    // Custom Confirmation Modal
  function showCustomConfirm(message = "Are you sure you want to delete this post? This action cannot be undone.") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const messageEl = document.getElementById('customConfirmMessage');
        const cancelBtn = document.getElementById('customConfirmCancel');
        const deleteBtn = document.getElementById('customConfirmDelete');

        // Remove previous event listeners to avoid duplicates
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        deleteBtn.replaceWith(deleteBtn.cloneNode(true));
        modal.replaceWith(modal.cloneNode(true));

        // Re-query elements after cloning
        const newModal = document.getElementById('customConfirmModal');
        const newMessageEl = document.getElementById('customConfirmMessage');
        const newCancelBtn = document.getElementById('customConfirmCancel');
        const newDeleteBtn = document.getElementById('customConfirmDelete');

        // Reset modal UI
        newMessageEl.textContent = message;
        newDeleteBtn.classList.remove('loading');
        newDeleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        newDeleteBtn.disabled = false;
        newCancelBtn.disabled = false;

        // Show modal
        newModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus delete button for accessibility
        setTimeout(() => newDeleteBtn.focus(), 100);

        // Handle cancel
        const handleCancel = () => {
            newModal.classList.remove('active');
            document.body.style.overflow = '';
            resolve(false);
            cleanup();
        };

        // Handle confirm
        const handleConfirm = () => {
            // Add loading state
            newDeleteBtn.classList.add('loading');
            newDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            newDeleteBtn.disabled = true;
            newCancelBtn.disabled = true;

            resolve(true);
            // Caller should close modal and cleanup after deletion finishes
        };

        // Cleanup function
        const cleanup = () => {
            newCancelBtn.removeEventListener('click', handleCancel);
            newDeleteBtn.removeEventListener('click', handleConfirm);
            document.removeEventListener('keydown', handleEscape);
            newModal.removeEventListener('click', handleOutsideClick);
        };

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') handleCancel();
        };

        // Handle click outside modal to cancel
        const handleOutsideClick = (e) => {
            if (e.target === newModal) handleCancel();
        };

        // Add event listeners
        newCancelBtn.addEventListener('click', handleCancel);
        newDeleteBtn.addEventListener('click', handleConfirm);
        document.addEventListener('keydown', handleEscape);
        newModal.addEventListener('click', handleOutsideClick);
    });
}

    // Function to close the modal after successful delete
    function closeCustomConfirm() {
        const modal = document.getElementById('customConfirmModal');
        const deleteBtn = document.getElementById('customConfirmDelete');
        const cancelBtn = document.getElementById('customConfirmCancel');

        // Hide modal
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Reset delete button
        deleteBtn.classList.remove('loading');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        deleteBtn.disabled = false;

        // Reset cancel button (just in case)
        cancelBtn.disabled = false;
        }



    // Helper function to get the CSRF token from cookies
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

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
            video.currentTime = 0; // Reset to start
            video.play().catch((error) => console.error("Video play failed:", error));
        };
        thumbnail.addEventListener("click", playVideo);
    }

    // Reload and Scroll to Top (unchanged)
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Lightbox Functionality (modified to reset all videos on close)
    const lightbox = document.getElementById("lightbox");
    const lightboxContent = document.getElementById("lightbox-content");
    const closeBtn = document.getElementById("lightbox-close");
    const prevBtn = document.getElementById("lightbox-prev");
    const nextBtn = document.getElementById("lightbox-next");
    let currentVideoStartTime = 0;
    let currentPostMedia = [];
    let videoStartTimes = {}; // Kept for tracking, but not used for playback
    let currentIndex = 0;

    function clearLightbox() { 
        lightboxContent.innerHTML = "";
        document.querySelectorAll('.loading-spinner').forEach(s => s.remove());
    }

    function createMediaElement(media) {
        if (media.tagName === "IMG") {
            const img = document.createElement("img");
            img.src = media.src;
            img.alt = media.alt || "Media";
            img.style.maxWidth = "90vw";
            img.style.maxHeight = "80vh";
            img.style.borderRadius = "8px";
            return img;
        } else if (media.tagName === "VIDEO") {
            const video = document.createElement("video");
            const source = media.querySelector("source");
            
            // Enhanced optimizations
            video.preload = "auto";
            video.muted = false;
            video.controls = true;
            video.setAttribute("playsinline", ""); // Better mobile performance
            video.crossOrigin = "anonymous"; // Better loading
            
            // Add CSS animation for spinner (only once)
            if (!document.querySelector('#spinner-style')) {
                const style = document.createElement('style');
                style.id = 'spinner-style';
                style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
                document.head.appendChild(style);
            }
            
            // Track spinner for this video
            let currentSpinner = null;
            
            video.addEventListener("loadstart", () => {
                // Only create spinner if none exists in lightbox
                if (!lightboxContent.querySelector('.loading-spinner')) {
                    currentSpinner = document.createElement('div');
                    currentSpinner.className = 'loading-spinner';
                    currentSpinner.innerHTML = '<div style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div><p style="color: white; text-align: center; margin-top: 10px;">Loading...</p>';
                    currentSpinner.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000;';
                    lightboxContent.appendChild(currentSpinner);
                }
            });
            
            // Remove spinner when video is ready
            video.addEventListener("loadeddata", () => {
                const existingSpinner = lightboxContent.querySelector('.loading-spinner');
                if (existingSpinner) {
                    existingSpinner.remove();
                    currentSpinner = null;
                }
                video.style.opacity = '1'; // Show video now
            });
            
            // Also remove spinner when video can play (backup)
            video.addEventListener("canplay", () => {
                const existingSpinner = lightboxContent.querySelector('.loading-spinner');
                if (existingSpinner) {
                    existingSpinner.remove();
                    currentSpinner = null;
                }
                video.style.opacity = '1'; // Show video now
            });
            
            if (source) {
                const sourceElement = document.createElement("source");
                sourceElement.src = source.src;
                sourceElement.type = source.type;
                video.appendChild(sourceElement);
            } else {
                video.src = media.src;
            }
            
            video.style.maxWidth = "90vw";
            video.style.maxHeight = "80vh";
            video.style.borderRadius = "8px";
            
            // REMOVED the line that disabled download/fullscreen
            // video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
            
            // Hide loading spinner until video is ready
            video.style.opacity = '0';
            // Immediate loading
            video.load();
            
            video.addEventListener("error", () => {
                const existingSpinner = lightboxContent.querySelector('.loading-spinner');
                if (existingSpinner) {
                    existingSpinner.innerHTML = '<p style="color: red; text-align: center; font-size: 16px;">Error loading video</p>';
                }
            });
            
            return video;
        }
        return null;
    }

    function showMedia() {
        clearLightbox();
        const media = currentPostMedia[currentIndex];
        if (!media) return;

        const el = createMediaElement(media);
        if (el.tagName === "VIDEO") {
            el.currentTime = 0; // Reset to start
            el.addEventListener("loadedmetadata", () => {
                el.play().catch(error => console.error("Lightbox video play failed:", error));
            });
            el.addEventListener("timeupdate", () => {
                videoStartTimes[currentIndex] = el.currentTime; // Track for reference
            });
        }
        lightboxContent.appendChild(el);
        preloadAdjacentVideos();
    }

    function preloadAdjacentVideos() {
        const nextIndex = (currentIndex + 1) % currentPostMedia.length;
        const prevIndex = (currentIndex - 1 + currentPostMedia.length) % currentPostMedia.length;
        
        // Preload next and previous videos more aggressively
        [nextIndex, prevIndex].forEach((index, i) => {
            const media = currentPostMedia[index];
            if (media && media.tagName === "VIDEO") {
                const tempVideo = document.createElement("video");
                tempVideo.preload = i === 0 ? "auto" : "metadata"; // Next video gets full preload
                tempVideo.src = media.src || media.querySelector("source")?.src;
                tempVideo.muted = true; // Muted preloading is faster
                tempVideo.style.display = "none";
                document.body.appendChild(tempVideo); // Add to DOM for better preloading
                
                // Remove after 30 seconds to free memory
                setTimeout(() => {
                    if (tempVideo.parentNode) tempVideo.parentNode.removeChild(tempVideo);
                }, 30000);
            }
        });
    }

    // Modified Intersection Observer for video sync (exclude preview videos)
    const observer = new IntersectionObserver((entries, observer) => {
        // Don't process if lightbox is open
        if (isLightboxOpen) return;
        
        entries.forEach(entry => {
            const video = entry.target;
            
            // Skip if this is a preview video
            if (video.closest('.preview-container, .publish-preview, .edit-preview')) {
                video.pause();
                video.currentTime = 0;
                return;
            }
            
            const index = Array.from(document.querySelectorAll("video")).indexOf(video);
            if (entry.isIntersecting) {
                video.currentTime = 0; // Reset to start
                video.play().catch(error => console.error("Video play failed:", error));
            } else {
                videoStartTimes[index] = video.currentTime; // Track time before pausing
                video.pause();
            }
        });
    }, { threshold: 0.5 });

    // Preload videos as they come into view
    const preloadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.tagName === "VIDEO") {
                const video = entry.target;
                if (video.preload !== "auto") {
                    video.preload = "metadata";
                }
            }
        });
    }, { rootMargin: "200px" }); // Start preloading 200px before video is visible

    // Observe all videos for preloading
    document.querySelectorAll("video").forEach(video => {
        // Skip preview videos
    if (!video.closest('.preview-container, .publish-preview, .edit-preview')) {
        observer.observe(video);
        preloadObserver.observe(video);
    }
    });

    function openLightbox(mediaList, index, startTime = 0) {
        // Set flag first
        isLightboxOpen = true;

        observer.disconnect();

        // Stop and reset all videos except the lightbox context
        document.querySelectorAll("video").forEach(v => {
            if (!v.closest("#lightbox-content")) {
                v.pause();
                v.currentTime = 0;
                // disable any autoplay flag
                v.autoplay = false;
                v.removeAttribute("autoplay");
                // Remove any existing event listeners that might restart videos
                v.onplay = null;
                v.oncanplay = null;
                v.onloadeddata = null;
            }
        });

        if (!mediaList.length) return;

        currentPostMedia = mediaList;
        currentIndex = index;
        // Reset start time
        currentVideoStartTime = 0;

        showMedia(currentVideoStartTime);
        lightbox.classList.add("active");
        document.body.style.overflow = "hidden";

        // Additional safety check - run multiple times to catch any delayed autoplay
        const stopBackgroundVideos = () => {
            document.querySelectorAll("video").forEach(v => {
                if (!v.closest("#lightbox-content")) {
                    v.pause();
                    v.currentTime = 0;
                }
            });
        };

        // Run immediately and with delays
        stopBackgroundVideos();
        setTimeout(stopBackgroundVideos, 50);
        setTimeout(stopBackgroundVideos, 100);
        setTimeout(stopBackgroundVideos, 200);
    }

    function cleanupVideoMemory() {
        // Remove any temporary preload videos
        document.querySelectorAll('video[style*="display: none"]').forEach(video => {
            if (video.parentNode) video.parentNode.removeChild(video);
        });
    }

    function closeLightbox() {
        // Set flag first
        isLightboxOpen = false;

        // Hide lightbox first
        lightbox.classList.remove("active");
        clearLightbox();
        document.body.style.overflow = "";

        cleanupVideoMemory();

        // Small delay before re-enabling video functionality
        setTimeout(() => {
            // re‑attach observer so scroll‑play comes back
            document.querySelectorAll("video").forEach(v => observer.observe(v));
            // re‑enable autoplay if needed
            document.querySelectorAll("video").forEach(v => {
                v.autoplay = true;
                v.setAttribute("autoplay", "");
            });
        }, 100);
    }

    function prevMedia() {
        if (currentPostMedia.length) {
            currentIndex = (currentIndex - 1 + currentPostMedia.length) % currentPostMedia.length;
            showMedia(); // Resets to 0
        }
    }

    function nextMedia() {
        if (currentPostMedia.length) {
            currentIndex = (currentIndex + 1) % currentPostMedia.length;
            showMedia(); // Resets to 0
        }
    }

    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    if (prevBtn) prevBtn.addEventListener("click", prevMedia);
    if (nextBtn) nextBtn.addEventListener("click", nextMedia);

    if (lightbox) {
        lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

        document.querySelectorAll(".activity-post").forEach((post) => {
            const mediaList = Array.from(post.querySelectorAll(".carousel-item"));
            mediaList.forEach((media, idx) =>
                media.addEventListener("click", () => {
                    if (media.tagName === "VIDEO") {
                        media.pause(); // Explicitly pause the clicked video
                        media.currentTime = 0; // Reset the clicked video
                    }
                    openLightbox(mediaList, idx, 0);
                })
            );
        });

        lightbox.classList.remove("active"); 
        document.body.style.overflow = "";
    }

    // Observe all video elements
    document.querySelectorAll("video").forEach(video => {
        observer.observe(video);
    });

    console.log("DOMContentLoaded fired");

    const moreButtons = document.querySelectorAll('.activity-post-more');
    console.log(`Found ${moreButtons.length} .activity-post-more elements`);

    moreButtons.forEach(button => {
        console.log("Attaching event listener to:", button);
        button.addEventListener('click', (e) => {
            console.log("More button clicked:", button);
            const postContainer = button.closest('.activity-post');
            if (!postContainer) {
                console.error("No .activity-post found for button:", button);
                return;
            }
            const moreMenu = postContainer.querySelector('.post-more-menu');
            if (moreMenu) {
                console.log("Toggling more menu:", moreMenu);
                moreMenu.classList.toggle('active');
            } else {
                console.error("No post-more-menu found in postContainer:", postContainer);
            }
        });
    });

    document.querySelectorAll('.more-menu-item').forEach(item => {
        console.log("Attaching event listener to menu item:", item);
        item.addEventListener('click', (e) => {
            const action = item.dataset.action;
            const postContainer = item.closest('.activity-post');
            if (!postContainer) {
                console.error("No .activity-post found for menu item:", item);
                return;
            }
            const postId = postContainer.dataset.postId;
            const moreMenu = item.closest('.post-more-menu');
            console.log(`Menu item clicked: action=${action}, postId=${postId}`);

            if (action === 'go-to-post') {
                window.location.href = `/activity/posts/${postId}/`;
            } else if (action === 'copy-link') {
                const postUrl = `${window.location.origin}/activity/posts/${postId}/`;
                navigator.clipboard.writeText(postUrl).then(() => {
                    console.log('Link copied:', postUrl);
                    alert('Link copied to clipboard!');
                }).catch(err => {
                    console.error('Error copying link:', err);
                });
            } else if (action === 'about-account') {
                    const authorSlug = postContainer.dataset.authorSlug;
                    if (authorSlug && authorSlug !== 'undefined') {
                        console.log('Navigating to profile:', authorSlug);
                        window.location.href = `/profile/${authorSlug}/`;
                    } else {
                        console.error('Author slug not found for post');
                        // Fallback to username if slug is not available
                        const authorName = postContainer.querySelector('.activity-post-author').textContent;
                        window.location.href = `/profile/${authorName}/`;
                    }
            } else if (action === 'cancel') {
                console.log("Closing more menu");
                moreMenu.classList.remove('active');
            } else if (action === 'edit-post') {
                console.log('Editing post:', postId);
                window.location.href = `/activity/posts/${postId}/edit/`; 
            } else if (action === 'delete-post') {
                showCustomConfirm('Are you sure you want to delete this post? This action cannot be undone.')
                    .then(confirmed => {
                        if (confirmed) {
                            console.log('Deleting post:', postId);
                            
                            // PAUSE ALL VIDEOS IN THIS POST FIRST
                            const videos = postContainer.querySelectorAll('video');
                            videos.forEach(video => {
                                video.pause();
                                video.currentTime = 0;
                                video.src = '';
                                video.load();
                            });
                            
                            // Wait a moment for file handles to release
                            setTimeout(() => {
                                const deleteUrl = `/activity/posts/${postId}/delete/`;
                                fetch(deleteUrl, {
                                    method: 'POST',
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest',
                                        'X-CSRFToken': getCookie('csrftoken'),
                                        'Content-Type': 'application/json'
                                    },
                                    credentials: 'same-origin'
                                })
                                .then(response => {
                                    if (!response.ok) throw new Error('Network response was not ok');
                                    return response.json();
                                })
                                .then(data => {
                                    closeCustomConfirm(); // Close modal on success
                                    
                                    if (data.success) {
                                        postContainer.style.transition = 'opacity 0.3s ease';
                                        postContainer.style.opacity = '0';
                                        setTimeout(() => {
                                            postContainer.remove();
                                        }, 300);
                                    } else {
                                        alert('Error deleting post: ' + (data.error || 'Unknown error'));
                                    }
                                })
                                .catch(error => {
                                    closeCustomConfirm(); // Close modal on error
                                    console.error('Error deleting post:', error);
                                    alert('Error deleting post. Please try again.');
                                });
                            }, 500);
                        }
                    });
                
                moreMenu.classList.remove('active');
            }
            });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.activity-post-more') && !e.target.closest('.post-more-menu')) {
            console.log("Click outside, closing all more menus");
            document.querySelectorAll('.post-more-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        }
    });

    // Carousel Navigation (modified to respect lightbox state)
    document.querySelectorAll(".carousel-container").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const prevBtn = carousel.querySelector(".carousel-btn.prev");
    const nextBtn = carousel.querySelector(".carousel-btn.next");
    const items = carousel.querySelectorAll(".carousel-item");
    const videos = carousel.querySelectorAll(".carousel-item video");

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

    function getItemWidth() {
        // Use the container’s width to ensure accuracy
        return carousel.getBoundingClientRect().width;
    }

    function updateTrackPosition() {
        if (isLightboxOpen) return;
        const itemWidth = getItemWidth();
        track.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
        // Update button states
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === items.length - 1;
        videos.forEach((video, index) => {
            if (index === currentIndex) {
                video.currentTime = 0;
                video.play().catch(error => console.error("Video play failed:", error));
            } else {
                video.pause();
            }
        });
    }

    // Pause all videos except the first one by default, reset to 0
    if (!isLightboxOpen) {
        videos.forEach((video, index) => {
            video.preload = "metadata";
            if (index !== 0) video.pause();
            else {
                video.currentTime = 0;
                video.play().catch(error => console.error("Video play failed:", error));
            }
            video.addEventListener("timeupdate", () => {
                videoStartTimes[index] = video.currentTime;
            });
        });
    }

    prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateTrackPosition();
        }
    });

    nextBtn.addEventListener("click", () => {
        if (currentIndex < items.length - 1) {
            currentIndex++;
            updateTrackPosition();
        }
    });

    // Update on window resize to recalculate itemWidth
    window.addEventListener("resize", updateTrackPosition);

    // Initial update
    updateTrackPosition();
});

    // View More Button for post content (unchanged)
    document.querySelectorAll('.activity-post-content').forEach(content => {
        const height = content.scrollHeight;
        const maxHeight = parseInt(window.getComputedStyle(content).maxHeight); // Ensure maxHeight is correctly set via CSS
        if (height > maxHeight) {
            const container = content.closest('.activity-post-container').querySelector('.view-more-btn-container');
            const btn = document.createElement('button');
            btn.className = 'view-more-btn show';
            btn.textContent = 'View More';
            container.appendChild(btn);
            btn.addEventListener('click', () => {
                content.classList.toggle('expanded');
                if (!content.classList.contains('expanded')) {
                    content.scrollTop = 0; // Reset scroll position to top when collapsing
                }
                btn.textContent = content.classList.contains('expanded') ? 'View Less' : 'View More';
            });
        }
    });

    // Like Button functionality (unchanged)
    document.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', () => {
            const postId = button.getAttribute('data-post-id');
            const url = `/activity/posts/${postId}/toggle-like/`;
            fetch(url, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
                return response.json();
            })
            .then(data => {
                const icon = button.querySelector('i');
                const likeCount = button.querySelector('.like-count');
                if (data.liked) {
                    button.classList.add('liked');
                    icon.classList.replace('far', 'fas');
                } else {
                    button.classList.remove('liked');
                    icon.classList.replace('fas', 'far');
                }
                likeCount.textContent = data.total_likes > 0 ? data.total_likes : '';
                // button.style.display = 'none';
                // setTimeout(() => button.style.display = '', 0);
            })
            .catch(error => console.error('Error toggling like:', error));
        });
    });

    // Function to add a comment to the DOM
// Function to add a comment to the DOM
function addCommentToDOM(postId, commentData, parentId = null) {
    const commentsList = document.getElementById(`comment-list-${postId}`);
    if (!commentsList) {
        console.error(`Comment list not found for post ID: ${postId}`);
        return;
    }

    // Check if comment already exists to avoid duplicates
    if (commentsList.querySelector(`[data-comment-id="${commentData.id}"]`)) {
        return;
    }

    const newCommentDiv = document.createElement('div');
    newCommentDiv.className = `flex mb-3 ${commentData.depth > 0 ? 'comment-reply' : ''}`;
    newCommentDiv.dataset.commentId = commentData.id;
    newCommentDiv.dataset.commentDepth = commentData.depth;
    newCommentDiv.dataset.parentCommentId = commentData.parent_comment || '';

    const profilePicUrl = commentData.author_profile_picture || '/static/images/default-user.png';
    const isLiked = commentData.liked || false;
    const likeCount = commentData.total_likes || 0;

    newCommentDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
            <img src="${profilePicUrl}" alt="${commentData.author_name}" class="w-full h-full object-cover" loading="lazy">
        </div>
        <div class="ml-2 relative z-10">
            <div class="bg-gray-100 rounded-lg px-3 py-2">
                <p class="font-semibold text-sm">${commentData.author_name}</p>
                <p class="text-sm">
                    ${commentData.parent_comment ? `<span class="text-blue-600 font-medium cursor-pointer hover:text-blue-800 hover:underline mention-link" data-slug="${commentData.parent_author_slug}">@${commentData.parent_author_name}</span> ` : ''}
                    ${commentData.text}
                </p>
            </div>
            <div class="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                <span>${commentData.created_at}</span>
                <button class="like-comment flex items-center text-gray-500 hover:text-yellow-500 ${isLiked ? 'liked text-yellow-500' : ''}" data-comment-id="${commentData.id}">
                    <i class="fa-star mr-1 relative bottom-[2px] ${isLiked ? 'fas' : 'far'}"></i>
                    <span class="like-text">Star</span>
                    <span class="like-count ml-1">${likeCount > 0 ? likeCount : ''}</span>
                </button>
                <button class="hover:text-gray-700 reply-btn" data-comment-id="${commentData.id}">Reply</button>
            </div>
        </div>
    `;

    if (commentData.parent_comment) {
        const parentComment = commentsList.querySelector(`[data-comment-id="${commentData.parent_comment}"]`);
        if (parentComment) {
            let insertAfter = parentComment;
            let nextSibling = parentComment.nextElementSibling;
            while (nextSibling && nextSibling.dataset.parentCommentId === commentData.parent_comment) {
                insertAfter = nextSibling;
                nextSibling = nextSibling.nextElementSibling;
            }
            insertAfter.insertAdjacentElement('afterend', newCommentDiv);
        } else {
            commentsList.appendChild(newCommentDiv);
        }
    } else {
        const firstComment = commentsList.querySelector('.flex.mb-3:not(.comment-reply)') || commentsList.firstElementChild;
        if (firstComment && firstComment.classList.contains('flex')) {
            commentsList.insertBefore(newCommentDiv, firstComment);
        } else {
            commentsList.prepend(newCommentDiv);
        }
        const noCommentsMsg = commentsList.querySelector('p');
        if (noCommentsMsg && noCommentsMsg.textContent === 'No comments yet.') {
            noCommentsMsg.remove();
        }
    }
}

// Function to fetch comments for a specific post via AJAX
function fetchComments(postId) {
    return fetch(`/activity/comments/${postId}/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const commentList = document.getElementById(`comment-list-${postId}`);
        const commentSection = document.getElementById(`comment-section-${postId}`);

        // Store existing like states
        const existingComments = {};
        commentList.querySelectorAll('.like-comment').forEach(button => {
            const commentId = button.dataset.commentId;
            existingComments[commentId] = {
                liked: button.classList.contains('liked'),
                likeCount: button.querySelector('.like-count').textContent,
                iconClass: button.querySelector('.fa-star').classList.contains('fas') ? 'fas' : 'far'
            };
        });

        // Clear and re-render comments
        commentList.innerHTML = '';
        if (data.comments && data.comments.length > 0) {
            const sortedComments = data.comments.sort((a, b) => {
                if (!a.parent_comment && b.parent_comment) return -1;
                if (a.parent_comment && !b.parent_comment) return 1;
                return new Date(a.created_at_iso) - new Date(b.created_at_iso);
            });

            sortedComments.forEach(comment => {
                addCommentToDOM(postId, {
                    id: comment.id,
                    author_name: comment.author_name,
                    author_profile_picture: comment.author_profile_picture,
                    text: comment.text,
                    created_at: comment.created_at,
                    parent_comment: comment.parent_comment,
                    parent_author_name: comment.parent_author_name,
                    parent_author_slug: comment.parent_author_slug,
                    depth: comment.depth || (comment.parent_comment ? 1 : 0),
                    liked: comment.liked,
                    total_likes: comment.total_likes
                }, comment.parent_comment);

                // Restore like state if it exists
                const commentElement = commentList.querySelector(`[data-comment-id="${comment.id}"] .like-comment`);
                if (commentElement && existingComments[comment.id]) {
                    const state = existingComments[comment.id];
                    commentElement.classList.toggle('liked', state.liked);
                    commentElement.classList.toggle('text-yellow-500', state.liked);
                    commentElement.classList.toggle('text-gray-500', !state.liked);
                    const icon = commentElement.querySelector('.fa-star');
                    icon.classList.toggle('fas', state.liked);
                    icon.classList.toggle('far', !state.liked);
                    commentElement.querySelector('.like-count').textContent = state.likeCount;
                }
            });
        } else {
            const p = document.createElement('p');
            p.textContent = 'No comments yet.';
            p.style.textAlign = 'center';
            p.style.color = '#888';
            commentList.appendChild(p);
        }

        if (commentSection && !commentSection.classList.contains('active')) {
            commentSection.classList.add('active');
        }

        commentList.scrollTop = 0;
        return data;
    })
    .catch(error => {
        console.error('Error fetching comments:', error);
        throw error;
    });
}

// Function to post a new comment or reply via AJAX
function postComment(postId, text, parentCommentId = null) {
    const bodyData = { text: text };
    if (parentCommentId) {
        bodyData.parent_comment_id = parentCommentId;
    }

    return fetch(`/activity/add_comment/${postId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(bodyData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().catch(() => {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }).then(errData => {
                throw new Error(errData.error || `HTTP error! status: ${response.status} - ${response.statusText}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            return fetchComments(postId);
        } else {
            throw new Error(data.error || 'Unknown error posting comment');
        }
    })
    .catch(error => {
        console.error('Error during comment/reply post:', error);
        throw error;
    });
}

// Event Delegation for dynamically added elements
document.querySelector('.recent-activity').addEventListener('click', (e) => {
    // Handle @mention clicks
    if (e.target.closest('.mention-link')) {
        const mentionLink = e.target.closest('.mention-link');
        const slug = mentionLink.dataset.slug;
        window.location.href = `/profile/${slug}/`;
        return;
    }

    // Toggle comment section visibility (for .comment-btn)
    if (e.target.closest('.comment-btn')) {
        const button = e.target.closest('.comment-btn');
        const postId = button.getAttribute('data-post-id');
        const commentSection = document.getElementById(`comment-section-${postId}`);
        if (commentSection) {
            commentSection.classList.toggle('active');
            if (commentSection.classList.contains('active')) {
                fetchComments(postId);
                document.querySelectorAll("video").forEach(v => v.pause());
            }
        }
        return;
    }

    // Close comment section (for .close-btn)
    if (e.target.closest('.close-btn')) {
        const button = e.target.closest('.close-btn');
        const postId = button.getAttribute('id').split('-')[2];
        const commentSection = document.getElementById(`comment-section-${postId}`);
        if (commentSection) {
            commentSection.classList.remove('active');
        }
        return;
    }

    // Prefill comment input (for .preset-comment-btn)
    if (e.target.closest('.preset-comment-btn')) {
        const button = e.target.closest('.preset-comment-btn');
        const postId = button.getAttribute('data-post-id');
        const text = button.getAttribute('data-text');
        const commentSection = document.getElementById(`comment-section-${postId}`);
        const input = document.getElementById(`comment-input-${postId}`);

        if (commentSection && commentSection.classList.contains('active')) {
            if (input) {
                input.value = text;
                input.focus();
                input.setSelectionRange(text.length, text.length);
            }
        } else {
            if (commentSection) {
                commentSection.classList.add('active');
                setTimeout(() => {
                    fetchComments(postId).then(() => {
                        if (input) {
                            input.value = text;
                            input.focus({ preventScroll: true });
                            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            input.setSelectionRange(text.length, text.length);
                        }
                    });
                    document.querySelectorAll("video").forEach(v => v.pause());
                }, 310);
            }
        }
        return;
    }

    // Handle new comment submission (for .comment-submit button)
    if (e.target.closest('.comment-submit')) {
        e.preventDefault();
        const button = e.target.closest('.comment-submit');
        const postId = button.id.replace('comment-submit-', '');
        const input = document.getElementById(`comment-input-${postId}`);
        const text = input.value.trim();

        if (text) {
            button.disabled = true;
            const originalButtonText = button.textContent;
            button.textContent = 'Posting...';
            input.value = '';

            postComment(postId, text)
                .then(() => {
                    button.disabled = false;
                    button.textContent = originalButtonText;
                })
                .catch(error => {
                    console.error('Error during manual comment post:', error);
                    alert('Error posting comment.');
                    button.disabled = false;
                    button.textContent = originalButtonText;
                });
        }
        return;
    }

    // Show reply box when "Reply" is clicked (for .reply-btn)
    if (e.target.closest('.reply-btn')) {
        const button = e.target.closest('.reply-btn');
        const parentCommentDiv = button.closest('.flex.mb-3');

        if (parentCommentDiv.nextElementSibling && parentCommentDiv.nextElementSibling.classList.contains('reply-box')) {
            parentCommentDiv.nextElementSibling.remove();
            return;
        }

        const parentCommentId = parentCommentDiv.dataset.commentId;
        const parentDepth = parseInt(parentCommentDiv.dataset.commentDepth || 0);
        const parentName = parentCommentDiv.querySelector('.font-semibold').textContent;

        let userProfilePic = window.currentUserProfilePic || '/static/images/default-user.png';

        const replyBox = document.createElement('div');
        replyBox.className = 'flex mt-2 mb-3 reply-box comment-reply';
        replyBox.dataset.commentDepth = parentDepth + 1;
        replyBox.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                <img src="${userProfilePic}" alt="Profile" class="w-full h-full object-cover">
            </div>
            <div class="ml-2 flex-grow relative">
                <div class="flex items-center bg-gray-100 rounded-full px-4 py-2">
                    <span class="text-sm text-gray-600 mr-2 select-none">@${parentName}</span>
                    <input type="text" class="flex-grow bg-transparent outline-none text-sm reply-input" placeholder="Write a reply...">
                </div>
                <button class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#026181] submit-reply-btn" data-comment-id="${parentCommentId}"><i class="fas fa-paper-plane"></i></button>
            </div>
        `;

        parentCommentDiv.parentNode.insertBefore(replyBox, parentCommentDiv.nextSibling);
        replyBox.querySelector('input').focus();
        replyBox.querySelector('input').setSelectionRange(2 + parentName.length, 2 + parentName.length);
        return;
    }

    // Submit reply (for .submit-reply-btn)
    if (e.target.closest('.submit-reply-btn')) {
        const button = e.target.closest('.submit-reply-btn');
        const replyBox = button.closest('.reply-box');
        const input = replyBox.querySelector('input');
        const replyText = input.value.trim();
        const parentCommentId = button.dataset.commentId;
        const postId = replyBox.closest('.activity-post-comments').id.replace('comment-section-', '');

        if (replyText) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            postComment(postId, replyText, parentCommentId)
                .then(() => {
                    replyBox.remove();
                })
                .catch(error => {
                    console.error('Error submitting reply:', error);
                    alert('Error posting reply.');
                })
                .finally(() => {
                    button.disabled = false;
                    button.innerHTML = '<i class="fas fa-paper-plane"></i>';
                });
        }
        return;
    }

    // Handle like comment (for .like-comment button)
    if (e.target.closest('.like-comment')) {
        const button = e.target.closest('.like-comment');
        const commentId = button.dataset.commentId;
        const url = `/activity/comments/${commentId}/toggle-like/`;

        fetch(url, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
            return response.json();
        })
        .then(data => {
            const icon = button.querySelector('.fa-star');
            const likeCount = button.querySelector('.like-count');
            if (data.liked) {
                button.classList.add('liked');
                button.classList.add('text-yellow-500');
                button.classList.remove('text-gray-500');
                icon.classList.replace('far', 'fas');
            } else {
                button.classList.remove('liked');
                button.classList.remove('text-yellow-500');
                button.classList.add('text-gray-500');
                icon.classList.replace('fas', 'far');
            }
            likeCount.textContent = data.total_likes > 0 ? data.total_likes : '';
            console.log(`Comment ${commentId} liked status: ${data.liked}, Total likes: ${data.total_likes}`);
        })
        .catch(error => console.error('Error toggling comment like:', error));
    }
});

    // Function to initialize event listeners for a single post
    function initializePost(postElement) {
        // Debugging: Log post initialization
        console.log('Initializing post ID:', postElement.dataset.postId);

        // Like Button
        const likeBtn = postElement.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                const postId = likeBtn.getAttribute('data-post-id');
                const url = `/activity/posts/${postId}/toggle-like/`;
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': getCookie('csrftoken'),
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                })
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
                    return response.json();
                })
                .then(data => {
                    const icon = likeBtn.querySelector('i');
                    const likeCount = likeBtn.querySelector('.like-count');
                    if (data.liked) {
                        likeBtn.classList.add('liked');
                        icon.classList.replace('far', 'fas');
                    } else {
                        likeBtn.classList.remove('liked');
                        icon.classList.replace('fas', 'far');
                    }
                    likeCount.textContent = data.total_likes > 0 ? data.total_likes : '';
                    // Debugging: Log like toggle
                    console.log(`Toggled like for post ID: ${postId}, liked: ${data.liked}`);
                })
                .catch(error => console.error('Error toggling like:', error));
            });
        }

        // More Menu Toggle
        const moreButton = postElement.querySelector('.activity-post-more');
        const moreMenu = postElement.querySelector('.post-more-menu');
        if (moreButton && moreMenu) {
            moreButton.addEventListener('click', () => {
                // Debugging: Log more menu toggle
                console.log('Toggling more menu for post ID:', postElement.dataset.postId);
                moreMenu.classList.toggle('active');
            });
        }

        // More Menu Items
        postElement.querySelectorAll('.more-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.dataset.action;
                const postId = postElement.dataset.postId;
                // Debugging: Log menu item action
                console.log(`Menu item action: ${action}, postId: ${postId}`);
                if (action === 'go-to-post') {
                    window.location.href = `/activity/posts/${postId}/`;
                } else if (action === 'copy-link') {
                    const postUrl = `${window.location.origin}/activity/posts/${postId}/`;
                    navigator.clipboard.writeText(postUrl).then(() => {
                        console.log('Link copied:', postUrl);
                        alert('Link copied to clipboard!');
                    }).catch(err => console.error('Error copying link:', err));
                } else if (action === 'about-account') {
                    const authorSlug = postElement.dataset.authorSlug;
                    window.location.href = `/profile/${authorSlug}/`;
                } else if (action === 'edit-post') {
                    window.location.href = `/activity/posts/${postId}/edit/`;
                } else if (action === 'delete-post') {
                    showCustomConfirm('Are you sure you want to delete this post? This action cannot be undone.')
                        .then(confirmed => {
                            if (confirmed) {
                                // Debugging: Log deletion attempt
                                console.log('Deleting post:', postId);
                                const videos = postElement.querySelectorAll('video');
                                videos.forEach(video => {
                                    video.pause();
                                    video.currentTime = 0;
                                    video.src = '';
                                    video.load();
                                });
                                setTimeout(() => {
                                    const deleteUrl = `/activity/posts/${postId}/delete/`;
                                    fetch(deleteUrl, {
                                        method: 'POST',
                                        headers: {
                                            'X-Requested-With': 'XMLHttpRequest',
                                            'X-CSRFToken': getCookie('csrftoken'),
                                            'Content-Type': 'application/json'
                                        },
                                        credentials: 'same-origin'
                                    })
                                    .then(response => {
                                        if (!response.ok) throw new Error('Network response was not ok');
                                        return response.json();
                                    })
                                    .then(data => {
                                        closeCustomConfirm();
                                        if (data.success) {
                                            postElement.style.transition = 'opacity 0.3s ease';
                                            postElement.style.opacity = '0';
                                            setTimeout(() => postElement.remove(), 300);
                                            // Debugging: Log successful deletion
                                            console.log(`Post ID: ${postId} deleted successfully`);
                                        } else {
                                            alert('Error deleting post: ' + (data.error || 'Unknown error'));
                                        }
                                    })
                                    .catch(error => {
                                        closeCustomConfirm();
                                        console.error('Error deleting post:', error);
                                        alert('Error deleting post. Please try again.');
                                    });
                                }, 500);
                            }
                        });
                    moreMenu.classList.remove('active');
                } else if (action === 'cancel') {
                    moreMenu.classList.remove('active');
                }
            });
        });

        // Carousel Navigation
        const carousel = postElement.querySelector('.carousel-container');
        if (carousel) {
            const track = carousel.querySelector('.carousel-track');
            const prevInteraction = carousel.querySelector('.carousel-btn.prev');
            const nextInteraction = carousel.querySelector('.carousel-btn.next');
            const items = carousel.querySelectorAll('.carousel-item');
            const videos = carousel.querySelectorAll('.carousel-item video');

            if (!track || !items.length) {
                console.warn('Carousel track or items not found for post ID:', postElement.dataset.postId);
                return;
            }

            if (items.length <= 1) {
                if (prevInteraction) prevInteraction.style.display = 'none';
                if (nextInteraction) nextInteraction.style.display = 'none';
                return;
            }

            let currentIndex = 0;

            function getItemWidth() {
                return carousel.getBoundingClientRect().width;
            }

            function updateTrackPosition() {
                if (isLightboxOpen) return;
                const itemWidth = getItemWidth();
                track.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
                prevInteraction.disabled = currentIndex === 0;
                nextInteraction.disabled = currentIndex === items.length - 1;
                videos.forEach((video, index) => {
                    if (index === currentIndex) {
                        video.currentTime = 0;
                        video.play().catch(error => console.error('Video play failed:', error));
                    } else {
                        video.pause();
                    }
                });
            }

            if (!isLightboxOpen) {
                videos.forEach((video, index) => {
                    video.preload = 'metadata';
                    if (index !== 0) video.pause();
                    else {
                        video.currentTime = 0;
                        video.play().catch(error => console.error('Video play failed:', error));
                    }
                    video.addEventListener('timeupdate', () => {
                        videoStartTimes[index] = video.currentTime;
                    });
                });
            }

            prevInteraction.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateTrackPosition();
                    // Debugging: Log carousel navigation
                    console.log(`Carousel prev clicked for post ID: ${postElement.dataset.postId}, new index: ${currentIndex}`);
                }
            });

            nextInteraction.addEventListener('click', () => {
                if (currentIndex < items.length - 1) {
                    currentIndex++;
                    updateTrackPosition();
                    // Debugging: Log carousel navigation
                    console.log(`Carousel next clicked for post ID: ${postElement.dataset.postId}, new index: ${currentIndex}`);
                }
            });

            window.addEventListener('resize', updateTrackPosition);
            updateTrackPosition();
        }

        // View More Content Button
        const content = postElement.querySelector('.activity-post-content');
        if (content) {
            const height = content.scrollHeight;
            const maxHeight = parseInt(window.getComputedStyle(content).maxHeight);
            if (height > maxHeight) {
                const container = content.closest('.activity-post-container')?.querySelector('.view-more-btn-container') || postElement.querySelector('.view-more-btn-container');
                const btn = document.createElement('button');
                btn.className = 'view-more-btn show';
                btn.textContent = 'View More';
                container.appendChild(btn);
                btn.addEventListener('click', () => {
                    content.classList.toggle('expanded');
                    if (!content.classList.contains('expanded')) {
                        content.scrollTop = 0;
                    }
                    btn.textContent = content.classList.contains('expanded') ? 'View Less' : 'View More';
                    // Debugging: Log content view more toggle
                    console.log(`View More content toggled for post ID: ${postElement.dataset.postId}`);
                });
            }
        }

        // Lightbox for Media
        const mediaList = Array.from(postElement.querySelectorAll('.carousel-item'));
        mediaList.forEach((media, idx) => {
            media.addEventListener('click', () => {
                if (media.tagName === 'VIDEO') {
                    media.pause();
                    media.currentTime = 0;
                }
                openLightbox(mediaList, idx, 0);
                // Debugging: Log lightbox open
                console.log(`Lightbox opened for post ID: ${postElement.dataset.postId}, media index: ${idx}`);
            });
        });

        // Video Observers
        postElement.querySelectorAll('video').forEach(video => {
            if (!video.closest('.preview-container, .publish-preview, .edit-preview')) {
                observer.observe(video);
                preloadObserver.observe(video);
                // Debugging: Log video observer attachment
                console.log(`Attached video observers for post ID: ${postElement.dataset.postId}`);
            }
        });
    }

    // Initialize existing posts on page load
    document.querySelectorAll('.activity-post').forEach(postElement => {
        initializePost(postElement);
    });

    // View More Button for the entire activity feed
    const overallViewMoreBtn = document.querySelector('.view-more');
    if (overallViewMoreBtn) {
        // Debugging: Log when the View More button is initialized
        console.log('Initializing View More button for activity feed');

        let isLoading = false; // Prevent multiple simultaneous clicks

        overallViewMoreBtn.addEventListener('click', () => {
            // Debugging: Log button click
            console.log('View More button clicked, current page:', overallViewMoreBtn.dataset.page);

            if (isLoading) {
                // Debugging: Log if click is ignored due to loading
                console.log('Ignoring click: Posts are already loading');
                return;
            }

            isLoading = true;
            overallViewMoreBtn.disabled = true;
            overallViewMoreBtn.textContent = 'Loading...';

            const slug = overallViewMoreBtn.dataset.slug;
            const page = parseInt(overallViewMoreBtn.dataset.page) + 1;

            // Debugging: Log the fetch request details
            console.log(`Fetching posts for slug: ${slug}, page: ${page}`);

            fetch(`/activity/posts/${slug}/?page=${page}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => {
                // Debugging: Log response status
                console.log('Fetch response status:', response.status);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                // Debugging: Log received data
                console.log('Received data:', data);

                if (data.success) {
                    overallViewMoreBtn.dataset.page = page;
                    const recentActivity = document.querySelector('.recent-activity .activity-posts');

                    // Debugging: Confirm container exists
                    if (!recentActivity) {
                        console.error('Activity posts container not found');
                        throw new Error('Activity posts container not found');
                    }

                    data.posts.forEach(post => {
                        const postElement = document.createElement('div');
                        postElement.className = 'activity-post';
                        postElement.dataset.postId = post.id;
                        postElement.dataset.authorSlug = post.author_slug;
                        postElement.innerHTML = `
                            <div class="activity-post-left-section">
                                <div class="activity-post-images carousel-container">
                                    <button class="carousel-btn prev" aria-label="Previous image">
                                        <i class="fas fa-chevron-left carousel-icon"></i>
                                    </button>
                                    <div class="carousel-track">
                                        ${post.media.map(media => `
                                            <div class="carousel-item">
                                                ${media.type === 'image' ? `
                                                    <img src="${media.url}" alt="${media.alt_text || 'Image'}" class="w-full h-auto" loading="lazy">
                                                ` : `
                                                    <video class="carousel-item" controls autoplay muted loop playsinline>
                                                        <source src="${media.url}" type="video/mp4">
                                                    </video>
                                                `}
                                            </div>
                                        `).join('')}
                                    </div>
                                    <button class="carousel-btn next" aria-label="Next image">
                                        <i class="fas fa-chevron-right carousel-icon"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="activity-post-right-section">
                                <div class="post-more-menu">
                                    <div class="more-menu-content">
                                        <div class="more-menu-item" data-action="go-to-post">Go to post</div>
                                        <div class="more-menu-item" data-action="copy-link">Copy Link</div>
                                        <div class="more-menu-item" data-action="about-account">About this Account</div>
                                        ${window.currentUserName === post.author_name ? `
                                            <div class="more-menu-item" data-action="edit-post" style="color: #0066cc;">Edit Post</div>
                                            <div class="more-menu-item" data-action="delete-post" style="color: #dc2626;">Delete Post</div>
                                        ` : ''}
                                        <div class="more-menu-item" data-action="cancel">Cancel</div>
                                    </div>
                                </div>
                                <div class="activity-post-header">
                                    <div class="activity-post-avatar">
                                        <img src="${post.author_profile_picture}" alt="${post.author_name}">
                                    </div>
                                    <div class="activity-post-author">${post.author_name}</div>
                                    <div class="activity-post-time">${post.created_at} ago</div>
                                    <div class="activity-post-more" aria-label="More options"></div>
                                </div>
                                <div class="activity-post-container">
                                    <div class="activity-post-content">
                                        ${post.content}
                                        ${post.category ? `<span class="category">${post.category}</span>` : ''}
                                        ${post.hashtags.map(hashtag => `<span class="hashtag">${hashtag}</span>`).join(' ')}
                                    </div>
                                    <div class="view-more-btn-container"></div>
                                    <div class="flex space-x-2 mb-0 mt-4 mb-4">
                                        <button class="preset-comment-btn px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm" data-post-id="${post.id}" data-text="Well Done!">Well Done!</button>
                                        <button class="preset-comment-btn px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm" data-post-id="${post.id}" data-text="Congratulations">Congratulations!</button>
                                    </div>
                                    <div class="flex items-center justify-between border-t border-b border-gray-100 py-3 my-0 px-4">
                                        <button class="like-btn flex items-center text-gray-500 hover:text-yellow-500 ${post.liked ? 'liked text-yellow-500' : ''}" data-post-id="${post.id}">
                                            <i class="fa-star mr-1 relative bottom-[2px] ${post.liked ? 'fas' : 'far'}"></i>
                                            <span class="like-text">Star</span>
                                            <span class="like-count ml-1">${post.total_likes > 0 ? post.total_likes : ''}</span>
                                        </button>
                                        <button class="comment-btn flex items-center text-gray-500 hover:text-[#026181]" data-post-id="${post.id}"><i class="far fa-comment mr-1"></i> Comment</button>
                                        <button class="flex items-center text-gray-500 hover:text-[#026181]"><i class="fas fa-link mr-1"></i> Link-Up</button>
                                    </div>
                                </div>
                                <div class="activity-post-comments" id="comment-section-${post.id}">
                                    <div class="flex items-center justify-between">
                                        <div class="comment-header">Comments</div>
                                        <button class="close-btn" id="close-comment-${post.id}"><i class="fas fa-times"></i></button>
                                    </div>
                                    <div class="comment-list" id="comment-list-${post.id}"></div>
                                    <form class="comment-form flex items-center gap-2 mt-2">
                                        <div class="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                                            <img src="${window.currentUserProfilePic || '/static/images/default-user.png'}" alt="Profile" class="w-full h-full object-cover">
                                        </div>
                                        <div class="flex-grow relative">
                                            <input type="text" class="w-full bg-gray-100 rounded-full px-4 py-2 outline-none text-sm" id="comment-input-${post.id}" placeholder="Write a comment...">
                                            <button type="submit" class="comment-submit absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#026181]" id="comment-submit-${post.id}"><i class="fas fa-paper-plane"></i></button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        `;
                        recentActivity.appendChild(postElement);
                        initializePost(postElement);

                        // Debugging: Log each post added
                        console.log(`Added post ID: ${post.id} to DOM`);
                    });

                    if (!data.has_next) {
                        // Debugging: Log button removal
                        console.log('No more posts to load, removing View More button');
                        overallViewMoreBtn.remove();
                    }
                } else {
                    // Debugging: Log error from server
                    console.error('Server returned error:', data.error);
                    alert('Error loading more posts: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                // Debugging: Log fetch error
                console.error('Fetch error:', error);
                alert('Error loading more posts.');
            })
            .finally(() => {
                isLoading = false;
                overallViewMoreBtn.disabled = false;
                overallViewMoreBtn.textContent = 'View More';
                // Debugging: Log loading state reset
                console.log('Loading complete, button reset');
            });
        });
    }

    // Add global event listener to prevent any video autoplay when lightbox is open
    document.addEventListener('play', (e) => {
        if (isLightboxOpen && e.target.tagName === 'VIDEO' && !e.target.closest('#lightbox-content')) {
            e.preventDefault();
            e.target.pause();
            e.target.currentTime = 0;
        }
    }, true); // Use capture phase
});