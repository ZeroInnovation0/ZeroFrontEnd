document.addEventListener('DOMContentLoaded', () => {
    // Typed.js Animation for the Heading
    if (document.getElementById('typed')) {
        new Typed('#typed', {
            strings: ["Zero<br>to One", "Ideas<br>to Reality", "Startups<br>to Success"],
            typeSpeed: 90,
            backSpeed: 60,
            loop: true,
            showCursor: true,
            cursorChar: '|',
            autoInsertCss: true
        });
    }

    // Smooth Counting Animation for Stats
    const counters = document.querySelectorAll('.stat-number');
    const duration = 3000; // 3 seconds

    if (counters.length > 0) {
        counters.forEach(counter => {
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = +counter.getAttribute('data-target');
                        const startTime = performance.now();
                        
                        const animate = (time) => {
                            const progress = Math.min((time - startTime) / duration, 1);
                            const current = Math.floor(progress * target);
                            counter.innerText = `${current.toLocaleString()}+`;

                            const bounce = Math.sin(progress * Math.PI) * 0.1;
                            counter.style.transform = `scale(${1 + bounce})`;

                            if (progress < 1) requestAnimationFrame(animate);
                            else counter.style.transform = 'scale(1)';
                        };

                        requestAnimationFrame(animate);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(counter);
        });
    }

    

    // Video Section
    const thumbnail = document.getElementById('thumbnail');
    const video = document.getElementById('video');
    const watchDemoButton = document.getElementById('watch-demo');

    if (thumbnail && video && watchDemoButton) {
        const playVideo = () => {
            thumbnail.style.display = 'none';
            video.style.display = 'block';
            video.play().catch((error) => console.error('Video play failed:', error));
        };

        thumbnail.addEventListener('click', playVideo);
        watchDemoButton.addEventListener('click', playVideo);
    }

    // Hover Effects for Buttons
    const investorButton = document.querySelector('.join-investor');
    const entrepreneurButton = document.querySelector('.join-entrepreneur');

    if (investorButton && entrepreneurButton) {
        entrepreneurButton.addEventListener('mouseenter', () => {
            investorButton.style.backgroundColor = '#E5EDF5';
            investorButton.style.color = '#026181';
        });

        entrepreneurButton.addEventListener('mouseleave', () => {
            investorButton.style.backgroundColor = '';
            investorButton.style.color = '';
        });
    }


    // slider step


$(function() {
    gsap.registerPlugin(ScrollTrigger);
    const delay = 100;
    const images = gsap.utils.toArray(".flip-card");
    const dots = document.querySelectorAll('.dot');
    const totalSteps = images.length;

    // 1. Calculate the scroll‐width of all flip‐cards together:
    const container = document.querySelector(".flip-card-inner");
    const totalWidth = container.offsetWidth; 
    // (this is how many pixels we want the cards to slide over)

    // 2. Create a timeline that uses scrollTrigger, pinning .twosections
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".twosections",
            pin: true,
            scrub: 1,
            // TOTAL scroll-distance = 200px (delay) + totalWidth (cards slide)
            end: "+=" + (delay + totalWidth),
            onUpdate: self => {
                // Calculate which card should be “active” based on overall progress
                const progress = self.progress; 
                // Because the first 200px do nothing, we measure active-card only once progress > (200 / (200+totalWidth)).
                // However, rounding by (totalSteps–1) effectively “stretches” the index across the entire timeline,
                // so it still works if we just do this:
                // const delay = 200;
                const full = delay + totalWidth;

                let normalizedProgress = (self.progress * full - delay) / totalWidth;
                normalizedProgress = Math.max(0, Math.min(1, normalizedProgress)); // Clamp between 0 and 1

                const stepWidth = 1 / (totalSteps - 1);
                const activeStepIndex = Math.min(
                    Math.round(normalizedProgress / stepWidth),
                    totalSteps - 1
                );
                dots.forEach(dot => dot.classList.remove('active'));
                dots[activeStepIndex].classList.add('active');
            }
        }
    });

    // 3. Add a purely “empty” tween of duration: 200 to create the illusion of 200px of scroll-delay
    tl.to({}, { 
        duration: delay 
    });

    // 4. Now add the real horizontal slide, giving it duration = totalWidth
    tl.to(images, {
        xPercent: -100 * (images.length - 1.7),
        ease: "none",
        duration: totalWidth
    });

    // 5. Dot‐click logic (jumps along the same timeline)
    // const delay = 200;
    const full = delay + totalWidth;

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            const triggerST = tl.scrollTrigger;
            if (!triggerST) return;

            const scrollStart = triggerST.start;
            const scrollEnd = triggerST.end;

            // Calculate scroll distance excluding delay
            const scrollDistance = scrollEnd - scrollStart;

            // 🔥 Adjust scroll progress to include the delay at the start
            const targetProgress = index / (totalSteps - 1);
            const targetScroll = scrollStart + ((delay + (targetProgress * totalWidth)) / full) * scrollDistance;

            if (gsap.plugins.scrollTo) {
                gsap.to(window, {
                    scrollTo: { y: targetScroll, autoKill: false },
                    duration: 0.5,
                    ease: "power1.out",
                    onComplete: () => ScrollTrigger.refresh()
                });
            } else {
                window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        });
    });


    // 6. Refresh on resize
    window.addEventListener('resize', () => {
        ScrollTrigger.refresh();
    });
});



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
});



//faq
// JavaScript to toggle FAQ answers
document.addEventListener('DOMContentLoaded', () => {
    // Select all FAQ toggles
    const toggles = document.querySelectorAll('.faq-question-toggle');
    
    // Set the first FAQ item as active by default
    if (toggles.length > 0) {
        const firstItem = toggles[0].parentNode;
        firstItem.classList.add('active');
        toggles[0].style.borderLeft = '8px solid #35819a';
    }

    // Add click event listeners to all toggles
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const parentItem = toggle.parentNode;
            const isActive = parentItem.classList.contains('active');

            // Remove 'active' class from all FAQ items and reset border
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-question-toggle').style.borderLeft = ''; // Default border
            });

            // If the clicked item was not active, activate it and set red border
            if (!isActive) {
                parentItem.classList.add('active');
                toggle.style.borderLeft = '8px solid #35819a';
            }
       });
    });
});
