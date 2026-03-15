document.addEventListener("DOMContentLoaded", function () {
  "use strict";

                function getApiBase() {
                    if (typeof window.RABABA_API_BASE === "string" && window.RABABA_API_BASE.trim() !== "") {
                        return window.RABABA_API_BASE.replace(/\/$/, "");
                    }
                    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
                        return "http://localhost:5000";
                    }
                    return "https://api.rababagames.com";
                }

                async function fetchJson(path) {
                    const res = await fetch(`${getApiBase()}${path}`);
                    if (!res.ok) {
                        throw new Error(`Request failed: ${res.status}`);
                    }
                    return res.json();
                }

                function firstStoreLinks(links) {
                    if (!links) {
                        return [];
                    }

                    return [
                        { label: "Steam", href: links.steam },
                        { label: "Xbox Store", href: links.xbox },
                        { label: "Playstation Store", href: links.ps },
                        { label: "Epic Store", href: links.epicStore },
                        { label: "Nintendo Store", href: links.nintendoSwitch },
                        { label: "Google Play", href: links.googlePlay },
                        { label: "App Store", href: links.appStore },
                        { label: "Huawei AppGallery", href: links.huaweiStore }
                    ].filter(item => typeof item.href === "string" && item.href.trim() !== "").slice(0, 4);
                }

                function setSinglePageSocialLinks(links) {
                    if (!links) {
                        return;
                    }

                    const selectors = [
                        { selector: "#cta .socials li:nth-child(1) a", value: links.Facebook },
                        { selector: "#cta .socials li:nth-child(2) a", value: links.Twitter },
                        { selector: "#cta .socials li:nth-child(3) a", value: links.YouTube },
                        { selector: "#cta .socials li:nth-child(4) a", value: links.Discord }
                    ];

                    selectors.forEach((item) => {
                        const anchor = document.querySelector(item.selector);
                        if (!anchor) return;
                        if (item.value && item.value.trim() !== "") {
                            anchor.href = item.value;
                            anchor.target = "_blank";
                            anchor.rel = "noopener noreferrer";
                        }
                    });
                }

                function applyGameToPage(game) {
                    if (!game) {
                        return;
                    }

                    document.title = `${game.title || "Game"} - Rababa Games`;

                    const heroTitle = document.querySelector("#hero h1");
                    if (heroTitle) heroTitle.textContent = game.title || heroTitle.textContent;

                    const heroText = document.querySelector("#hero .col-lg-4 p");
                    if (heroText) heroText.textContent = game.shortDescription || game.description || heroText.textContent;

                    const stores = firstStoreLinks(game.links);
                    const ctaAnchors = document.querySelectorAll("#cta .dropdown-menu .dropdown-item");
                    ctaAnchors.forEach((anchor, index) => {
                        if (stores[index]) {
                            anchor.textContent = stores[index].label;
                            anchor.href = stores[index].href;
                            anchor.target = "_blank";
                            anchor.rel = "noopener noreferrer";
                            anchor.parentElement.style.display = "";
                        } else {
                            anchor.parentElement.style.display = "none";
                        }
                    });
                }

                async function loadSinglePageData() {
                    if (!document.body.classList.contains("game-page")) {
                        return;
                    }

                    const params = new URLSearchParams(window.location.search);
                    const gameId = params.get("id");

                    if (!gameId) {
                        return;
                    }

                    try {
                        const [game, platformLinks] = await Promise.all([
                            fetchJson(`/api/games/${encodeURIComponent(gameId)}`),
                            fetchJson("/api/platform-links")
                        ]);

                        applyGameToPage(game);
                        setSinglePageSocialLinks(platformLinks);
                    } catch (error) {
                        console.error("Failed to load game page data:", error.message);
                    }
                }

                loadSinglePageData();

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

        // HAMBURGER MENU ANIMATION FOR MOBILE --------------------------------------------------------------------------------------------------------------------
        document.getElementById("hamburger").addEventListener("click", function () {
          this.classList.toggle("open");
        });

        // TRIGGER NAVBAR BACKGROUND ON SCROLL ---------------------------------------------------------------------------------------------------------
        window.addEventListener("scroll", function () {
          const navbar = document.querySelector(".navbar-dark");
          const value = window.scrollY;
          if (value > window.innerHeight) {
            navbar.classList.add("scrolled");
          } else {
            navbar.classList.remove("scrolled");
          }
        });


        // LOAD SCRIPTS FOR GAME PAGE
        if (document.body.classList.contains("game-page")) {

            // TRIGGER ANIMATION WHEN ELEMENT IS IN VIEW ------------------------------------------------------------------------------------------------
            function initAnimations() {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('in-view');
                        }
                    });
                }, { threshold: 0.5 });

                // Observe all elements that should animate
                document.querySelectorAll('.animation-element').forEach(el => observer.observe(el));
            }

            initAnimations();


            // LIGHTBOX OPTIONS ---------------------------------------------------------------------------------------------------------------------------
            const lightbox = GLightbox({
                touchNavigation: true,
                loop: true,
                autoplayVideos: true
            });

        }

        //COPYRIGHT YEAR ------------------------------------------------------------------------------------------------------------------------------
        var date = new Date().getFullYear();
        document.getElementById("year").innerHTML = date;
});

window.onload = function() {
        // LOAD SCRIPTS FOR GAME PAGE
        if (document.body.classList.contains("game-page")) {

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
}