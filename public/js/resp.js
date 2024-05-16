burger = document.querySelector('.burger');
navbar = document.querySelector('.navbar');
navList = document.querySelector('.nav-list');
rightNav = document.querySelector('.rightNav');
firstSection = document.querySelector('.firstSection');

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

window.addEventListener('resize', checkScreenSize);

function checkScreenSize() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight
    if(screenWidth > 1279){
        rightNav.style.opacity = '1'; // Set opacity as a string
        navList.style.opacity = '1'; // Set opacity as a string
        navbar.style.height = '60px';
    }
    else{
        rightNav.style.opacity = '0'; // Set opacity as a string
        navList.style.opacity = '0';
        navbar.style.height = '60px';
    }
}

burger.addEventListener('click', () => {
    if (rightNav.style.opacity === '0' || rightNav.style.opacity === '') { // Compare to '0' as a string
        rightNav.style.opacity = '1'; // Set opacity as a string
        navList.style.opacity = '1'; // Set opacity as a string
        navbar.style.height = '447px';
    } else {
        rightNav.style.opacity = '0'; // Set opacity as a string
        navList.style.opacity = '0'; // Set opacity as a string
        navbar.style.height = '60px';
    }
});

firstSection.addEventListener('click', () => {
    if(screenWidth <= 1279){
        rightNav.style.opacity = '0'; // Set opacity as a string
    navList.style.opacity = '0'; // Set opacity as a string
    navbar.style.height = '60px';
    }
});

let touchStartY;

// Add a touchstart event listener to track the starting position of the touch
window.addEventListener('touchstart', function (event) {
    if(screenWidth <= 1279){
        touchStartY = event.touches[0].clientY;
    }
});

// Add a touchmove event listener to detect an upward swipe
window.addEventListener('touchmove', function (event) {
    if(screenWidth <= 1279){
        if (touchStartY !== null) {
            var touchEndY = event.touches[0].clientY;
            var swipeDistance = touchStartY - touchEndY;
            // Adjust the threshold for what is considered an upward swipe
            if (swipeDistance > 5) {
                // User has swiped up
                // Add your code to handle the upward swipe here
                rightNav.style.opacity = '0'; // Set opacity as a string
                navList.style.opacity = '0'; // Set opacity as a string
                navbar.style.height = '60px';
            }
            touchStartY = null; // Reset the starting Y-coordinate
        }
    }
});

// Reset the touchStartY when the touch ends (optional)
window.addEventListener('touchend', function () {
    if(screenWidth <= 1279){
        touchStartY = null;
    }
});
