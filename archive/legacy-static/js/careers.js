document.addEventListener("DOMContentLoaded", function () {
  "use strict";

            //SHOW COOKIE BAR
            function showCookieBar() {
                document.getElementById("policy-bar").classList.add("open");
            }
            function hideCookieBar() {
                document.getElementById("policy-bar").classList.remove("open");
            }
            function showCookieMessage() {
                document.getElementById("policy-message").classList.add("open");
            }
            function hideCookieMessage() {
                document.getElementById("policy-message").classList.remove("open");
            }
        
            // --- Event bindings ---
            document.getElementById("close-policy-message")?.addEventListener("click", hideCookieMessage);
            document.getElementById("close-policy-bar")?.addEventListener("click", hideCookieBar);

            showCookieBar();

            // TRIGGER NAVBAR BACKGROUND ON SCROLL
            window.addEventListener("scroll", function () {
                const navbar = document.querySelector(".navbar-dark");
                const scrollY = window.scrollY;
                const triggerHeight = 200; // <-- Set this to the pixel value you want

                if (scrollY > triggerHeight) {
                    navbar.classList.add("scrolled");
                } else {
                    navbar.classList.remove("scrolled");
                }
            });

            // LIGHTBOX OPTIONS
            const lightbox = GLightbox({
                touchNavigation: true,
                loop: true,
                autoplayVideos: true
            });

            // CAREERS PAGE CAROUSEL
            new Splide("#jobs-carousel", {
                type: "loop",
                perPage: 3,
                breakpoints: {
                1024: {
                    perPage: 2,
                
                },
                640: {
                    perPage: 1,
            
                },
                },
                focus: "center",
                gap: '2em',
                updateOnMove : true,
                pagination: false,
            }).mount();

});

window.onload = function() {
        // HIDE LOADING SCREEN WHEN PAGE IS LOADED ----------------------------------------------------------------------------------------------------
        const progress = document.getElementById('progress');
        const loaderWrapper = document.getElementById('loader-wrapper');

        // Animate the width to 100%
        progress.style.transition = 'width 0.3s linear';
        progress.style.width = '100%';

        // When the animation finishes, add the class
        progress.addEventListener('transitionend', function handler() {
            loaderWrapper.classList.add('content-loaded');
            // Remove the event listener so it only runs once
            progress.removeEventListener('transitionend', handler);
        });
}