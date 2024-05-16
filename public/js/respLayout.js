let subMenu = document.getElementById("subMenu");

document.addEventListener("DOMContentLoaded", function () {

    // Get references to your elements
    var layoutLeft = document.querySelector('.layoutLeft');
    var burgerLayout = document.querySelector('.burgerLayout');
    var layoutRight = document.querySelector('.layoutRight');
    var touchStartX = null; // Variable to store the starting X-coordinate of the touch
    var layout = document.querySelector('.layoutRight');
    //    let subMenu = document.getElementById("subMenu");

    window.addEventListener('resize', checkScreenSize);

    function checkScreenSize() {
        layoutLeft.style.display = 'none';
            if (subMenu.classList.contains("open-menu")) {
                subMenu.classList.toggle("open-menu");
            }
            subMenu.style.display = 'block';
    }

    // Add a click event listener to the burgerLayout element
    burgerLayout.addEventListener('click', function () {
        // Toggle the visibility of the layoutLeft element
        if (layoutLeft.style.display === 'none' || layoutLeft.style.display === '') {
            layoutLeft.style.display = 'flex';
            if (subMenu.classList.contains("open-menu")) {
                subMenu.classList.toggle("open-menu");
            }
            subMenu.style.display = 'none';
        } else {
            layoutLeft.style.display = 'none';
            if (subMenu.classList.contains("open-menu")) {
                subMenu.classList.toggle("open-menu");
            }
            subMenu.style.display = 'block';
        }
    });

    layoutRight.addEventListener('click', function () {
        layoutLeft.style.display = 'none';
            if (subMenu.classList.contains("open-menu")) {
                subMenu.classList.toggle("open-menu");
            }
            subMenu.style.display = 'block';


    });

    layoutLeft.addEventListener('click', function () {
        if (subMenu.classList.contains("open-menu")) {
            subMenu.classList.toggle("open-menu");
        }
        subMenu.style.display = 'block';


    });

    // Add a touchstart event listener to track the starting position of the touch
    window.addEventListener('touchstart', function (event) {
        touchStartX = event.touches[0].clientX;
    });

    // Add a touchmove event listener to detect a left swipe
    window.addEventListener('touchmove', function (event) {
        if (touchStartX !== null) {
            var touchEndX = event.touches[0].clientX;
            var swipeDistance = touchEndX - touchStartX;
            // Adjust the threshold for what is considered a left swipe
            if (swipeDistance < -10) {
                // User has swiped to the left
                layoutLeft.style.display = 'none';
                if (subMenu.classList.contains("open-menu")) {
                    subMenu.classList.toggle("open-menu");
                }
                subMenu.style.display = 'block';
            }
            touchStartX = null; // Reset the starting X-coordinate
        }
    });

    // Reset the touchStartX when the touch ends (optional)
    window.addEventListener('touchend', function () {
        touchStartX = null;
    });
});

function toggleMenu() {
    //console.log('subMenu.style.display: ', subMenu.style.display);
    subMenu.classList.toggle("open-menu");
}

