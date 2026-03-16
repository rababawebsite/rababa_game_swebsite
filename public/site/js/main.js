document.addEventListener("DOMContentLoaded", function () {
  "use strict";

        function getApiBase() {
          if (typeof window.RABABA_API_BASE === "string" && window.RABABA_API_BASE.trim() !== "") {
            return window.RABABA_API_BASE.replace(/\/$/, "");
          }
          if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            return "http://localhost:5000";
          }
          return "https://rababa-game-swebsite-79cg.vercel.app";
        }

        async function fetchJson(path) {
          const res = await fetch(`${getApiBase()}${path}`);
          if (!res.ok) {
            throw new Error(`Request failed: ${res.status}`);
          }
          return res.json();
        }

        function gamePlatformClasses(game) {
          const classes = [];
          const platforms = Array.isArray(game.platforms) ? game.platforms : [];
          const text = platforms.join(" ").toLowerCase();

          if (text.includes("steam") || text.includes("epic")) classes.push("pc");
          if (text.includes("xbox")) classes.push("xbox");
          if (text.includes("ps4") || text.includes("ps5")) classes.push("ps");
          if (text.includes("android") || text.includes("apple") || text.includes("huawei") || text.includes("amazon")) classes.push("mobile");
          if (game.isNewRelease) classes.push("new");

          return classes.join(" ");
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

        function normalizeGameTitle(title) {
          const value = String(title || "").trim();
          return /^hajwala\s*1$/i.test(value) ? "Hajwala Drift Revolution" : value;
        }

        function renderGalleryGames(games) {
          const gallery = document.querySelector(".game-gallery");
          if (!gallery) {
            return;
          }

          if (!Array.isArray(games) || games.length === 0) {
            gallery.innerHTML = `
              <div class="row">
                <div class="col-12">
                  <p class="text">No games found in database.</p>
                </div>
              </div>
            `;
            return;
          }

          const cards = games.slice(0, 8).map((game) => {
            const safeTitle = normalizeGameTitle(game.title || "Untitled Game") || "Untitled Game";
            const image = game.image || "images/game-img.webp";
            const promo = game.isNewRelease ? '<p class="promotion uppercase">new</p>' : "";
            return `
              <div class="col-lg-4 game-card ${gamePlatformClasses(game)}">
                <a href="/games/game1/index.html?id=${encodeURIComponent(game._id)}" aria-label="Visit ${safeTitle} game page">
                  <img src="${image}" class="img-fluid game-img" alt="${safeTitle} cover art">
                  <div class="overlay"></div>
                  <h3>${safeTitle.replace(/\s+/g, "<br>")}</h3>
                  ${promo}
                </a>
              </div>
            `;
          }).join("");

          gallery.innerHTML = `<div class="row">${cards}</div>`;

          if (typeof window.rababaInitIsotope === "function") {
            window.rababaInitIsotope(true);
          }
        }

        function renderGallerySkeleton(count = 6) {
          const gallery = document.querySelector(".game-gallery");
          if (!gallery) {
            return;
          }

          const placeholders = Array.from({ length: count }).map(() => `
            <div class="col-lg-4 game-card skeleton-card" aria-hidden="true">
              <div class="skeleton-media db-shimmer"></div>
              <div class="skeleton-title db-shimmer"></div>
              <div class="skeleton-subtitle db-shimmer"></div>
            </div>
          `).join("");

          gallery.innerHTML = `<div class="row">${placeholders}</div>`;
        }

        function setFeaturedLoading() {
          const latestHeading = document.querySelector(".latest-game.left .heading");
          const latestDescription = document.querySelector(".latest-game.left .text");
          const detailsLinks = document.querySelectorAll(".featured-details-link");

          if (latestHeading) {
            latestHeading.innerHTML = '<span class="db-skeleton-line db-skeleton-heading db-shimmer"></span>';
          }

          if (latestDescription) {
            latestDescription.innerHTML = `
              <span class="db-skeleton-line db-skeleton-paragraph db-shimmer"></span>
              <span class="db-skeleton-line db-skeleton-paragraph short db-shimmer"></span>
            `;
          }

          detailsLinks.forEach((detailsLink) => {
            detailsLink.classList.add("is-loading");
            detailsLink.setAttribute("aria-disabled", "true");
          });
        }

        function setFooterSocialLinks(links) {
          if (!links) {
            return;
          }

          const selectors = [
            { selector: "#main-footer .socials li:nth-child(1) a", value: links.Facebook },
            { selector: "#main-footer .socials li:nth-child(2) a", value: links.Twitter },
            { selector: "#main-footer .socials li:nth-child(3) a", value: links.Instagram },
            { selector: "#main-footer .socials li:nth-child(4) a", value: links.YouTube },
            { selector: "#main-footer .socials li:nth-child(5) a", value: links.Discord }
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

        function setFeaturedGame(game) {
          const latestHeading = document.querySelector(".latest-game.left .heading");
          const latestDescription = document.querySelector(".latest-game.left .text");
          const detailsLinks = document.querySelectorAll(".featured-details-link");

          detailsLinks.forEach((detailsLink) => {
            detailsLink.classList.remove("is-loading");
            detailsLink.removeAttribute("aria-disabled");
          });

          if (!game) {
            if (latestHeading) latestHeading.textContent = "No featured game";
            if (latestDescription) latestDescription.textContent = "Add and mark a game as featured in dashboard to show it here.";
            detailsLinks.forEach((detailsLink) => {
              detailsLink.href = "/games/game1/index.html";
            });
            return;
          }

          const displayTitle = normalizeGameTitle(game.title || "");
          const featuredHeadingTitle = /hajwala/i.test(displayTitle) ? "Hajwala" : displayTitle;

          if (latestHeading) latestHeading.textContent = featuredHeadingTitle || latestHeading.textContent;

          if (latestDescription) latestDescription.textContent = game.shortDescription || game.description || latestDescription.textContent;

          detailsLinks.forEach((detailsLink) => {
            detailsLink.href = `/games/game1/index.html?id=${encodeURIComponent(game._id)}`;
          });

          const storeAnchors = document.querySelectorAll(".latest-game.left .dropdown-menu .dropdown-item");
          const stores = firstStoreLinks(game.links);
          storeAnchors.forEach((anchor, index) => {
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

        async function loadDynamicHomepageData() {
          if (!document.body.classList.contains("main-page")) {
            return;
          }

          setFeaturedLoading();
          renderGallerySkeleton();

          try {
            const [games, featuredGames, platformLinks] = await Promise.all([
              fetchJson("/api/games"),
              fetchJson("/api/games/featured"),
              fetchJson("/api/platform-links")
            ]);

            renderGalleryGames(games);
            setFeaturedGame(Array.isArray(featuredGames) && featuredGames.length > 0 ? featuredGames[0] : (Array.isArray(games) ? games[0] : null));
            setFooterSocialLinks(platformLinks);
          } catch (error) {
            console.error("Failed to load homepage data:", error.message);
            renderGalleryGames([]);
            setFeaturedGame(null);
          }
        }

        loadDynamicHomepageData();

        // Force navigation for game links in case another listener cancels clicks.
        document.addEventListener("click", function (event) {
          const anchor = event.target.closest(".game-gallery .game-card a, .latest-game a.features");
          if (!anchor) {
            return;
          }

          const href = anchor.getAttribute("href");
          if (!href || href.trim() === "#") {
            return;
          }

          event.preventDefault();
          window.location.assign(anchor.href);
        }, true);

        // HAMBURGER MENU ANIMATION --------------------------------------------------------------------------------------------------------
        document.getElementById("hamburger").addEventListener("click", function () {
          this.classList.toggle("open");
        });
    

        // TRIGGER NAVBAR BACKGROUND ON SCROLL ---------------------------------------------------------------------------------------------
        window.addEventListener("scroll", function () {
          const navbar = document.querySelector(".navbar-dark");
          const value = window.scrollY;
          if (value > window.innerHeight) {
            navbar.classList.add("scrolled");
          } else {
            navbar.classList.remove("scrolled");
          }
        });

        // LOAD MAIN PAGE SCRIPTS
        if (document.body.classList.contains("main-page")) {
          const hoverLogoImage = "https://ik.imagekit.io/x5ffdja5c/rababa-site/public-assets-images-images_eeFrm-vGG.png";

          // HERO SECTION ANIMATIONS ---------------------------------------------------------------------------------------------------------
          const heroGame = document.querySelector(".hero-game-caption[data-hover-reveal='true']");

          function triggerHeroAnimation() {
            const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;

            document.querySelectorAll(".curtain-left, .curtain-right").forEach(el => {
              el.classList.add("curtain-open");
            });

            document.querySelectorAll(".discard").forEach(discard => {
              discard.style.display = "none";
            });

            const heroImg = document.querySelector(".hero-game-img");
            if (heroImg) {
              if (!heroImg.dataset.hoverLogoApplied) {
                heroImg.src = hoverLogoImage;
                heroImg.alt = "Rababa Games logo";
                heroImg.classList.add("hero-logo-reveal");
                heroImg.dataset.hoverLogoApplied = "true";
              }
              heroImg.style.transition = "margin-left 0.5s ease, width 0.5s ease";
              heroImg.style.marginLeft = isSmallScreen ? "auto" : "12%";
              heroImg.style.marginRight = isSmallScreen ? "auto" : "0";
              heroImg.style.width = isSmallScreen ? "60%" : "76%";
            }
            
            const caption = document.querySelector(".hero-game-caption");
            if (caption) {
              caption.style.transform = isSmallScreen ? "translate3d(0, 0, 0)" : "translate3d(0, -100px, 0)";
            }

            const description = document.querySelector(".hero-game-description");
            if (description) description.style.opacity = "1";

            const hoverArrow = document.querySelector(".hover-arrow");
            if (hoverArrow) hoverArrow.style.display = "none";
          }

          if (heroGame) {
            // Desktop hover
            heroGame.addEventListener("mouseenter", triggerHeroAnimation);

            // Mobile tap
            heroGame.addEventListener("touchstart", function handleTouch(e) {
              // prevent multiple taps
              e.stopPropagation();
              e.preventDefault();
              triggerHeroAnimation();

              // optionally remove this listener after first trigger
              heroGame.removeEventListener("touchstart", handleTouch);
            }, { passive: false });

            // Auto-run reveal on touch devices and smaller viewports where hover is unavailable.
            if (window.matchMedia("(hover: none), (max-width: 1200px)").matches) {
              window.requestAnimationFrame(() => {
                triggerHeroAnimation();
              });
            }
          }

    
          // LIGHTBOX OPTIONS --------------------------------------------------------------------------------------------------------------------
          const lightbox = GLightbox({
              touchNavigation: true,
              loop: true,
              autoplayVideos: true
          });
      

          // Map removed - no API key configured
        } 

        //COPYRIGHT YEAR ----------------------------------------------------------------------------------------------------------------------------------
        var date = new Date().getFullYear();
        document.getElementById("year").innerHTML = date;
});

window.onload = function() {
        // LOAD MAIN PAGE SCRIPTS
        if (document.body.classList.contains("main-page")) {
          
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
        
          // INITIALIZE ISOTOPE PLUGIN ------------------------------------------------------------------------------------------------------------------
          window.rababaInitIsotope = function(forceRebuild) {
            var container = document.querySelector('.game-gallery');
            if (!container) return;

            if (window.rababaIso && forceRebuild) {
              window.rababaIso.destroy();
              window.rababaIso = null;
            }

            if (!window.rababaIso) {
              window.rababaIso = new Isotope(container, {
                layoutMode: 'fitRows',
                percentPosition: true,
                itemSelector: '.game-card'
              });

              var filterLinks = document.querySelectorAll('.game-tags li button');
              filterLinks.forEach(function (link) {
                link.addEventListener('click', function (e) {
                  e.preventDefault();
                  var selector = link.getAttribute('data-filter');
                  window.rababaIso.arrange({ filter: selector });
                });
              });
            } else {
              window.rababaIso.reloadItems();
              window.rababaIso.layout();
            }
          }

          window.rababaInitIsotope(false);
          

          // TRIGGER ANIMATIONS WHEN ELEMENT IS IN VIEW ---------------------------------------------------------------------------------------------------
          const observer = new IntersectionObserver((entries, observer) => {
              entries.forEach(entry => {
              if (entry.isIntersecting) {
                  // Add the 'in-view' class when the element comes into view
                  entry.target.classList.add('in-view');
              } else {

              }
              });
          }, { threshold: 0.5 }); // Adjust the threshold based on how much of the element needs to be in view

          // Select all elements with the class '.animation-element'
          const elements = document.querySelectorAll('.animation-element');

          // Start observing each of the selected elements
          elements.forEach(element => {
              observer.observe(element);
          });
      }
}