document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-links a');
    const profilePicture = document.getElementById('profile-picture');
    const userId = 'user123'; // Replace with dynamic user ID as needed

    function setProfilePicture(userId) {
        const profileImages = {
            'user123': 'Images/profile-pic.png',
            'default': null
        };

        const profileSrc = profileImages[userId] || profileImages['default'];
        profilePicture.innerHTML = ''; // Clear any existing content

        if (profileSrc) {
            const img = document.createElement('img');
            img.src = profileSrc;
            img.alt = 'Profile Picture';
            profilePicture.appendChild(img);
        } else {
            profilePicture.innerHTML = '<i class="fas fa-user"></i>';
        }
    }

    function setActiveLink(clickedLink) {
        navLinks.forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');
    }

    setProfilePicture(userId);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default navigation
            setActiveLink(link);
            // Optional: You could redirect using JS here if needed
        });
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const dropdownContent = document.querySelector(".dropdown-content");

    // Toggle dropdown when clicking the button
    dropdownBtn.addEventListener("click", function (e) {
        console.log("?Clicked");
        dropdownContent.classList.toggle("show");
    });

    // Close dropdown when clicking outside the button or dropdown
    document.addEventListener("click", function (e) {
        console.log("?Clicked");
        if (
            !dropdownContent.contains(e.target) &&
            !dropdownBtn.contains(e.target)
        ) {
            dropdownContent.classList.remove("show");
        }
    });
});