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

                function escapeHtml(value) {
                    return String(value || "")
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/\"/g, "&quot;")
                        .replace(/'/g, "&#39;");
                }

                function toArray(value) {
                    return Array.isArray(value) ? value : [];
                }

                function toCssUrl(value) {
                    return `url("${String(value || "").replace(/"/g, '\\"')}")`;
                }

                function normalizeEmbedUrl(value) {
                    const raw = String(value || "").trim();
                    if (!raw) {
                        return "";
                    }

                    try {
                        const parsed = new URL(raw, window.location.origin);
                        const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();

                        if (hostname === "youtu.be") {
                            const videoId = parsed.pathname.replace(/^\//, "");
                            return videoId ? `https://www.youtube.com/embed/${videoId}` : raw;
                        }

                        if (hostname === "youtube.com" || hostname === "m.youtube.com") {
                            if (parsed.pathname === "/watch") {
                                const videoId = parsed.searchParams.get("v");
                                return videoId ? `https://www.youtube.com/embed/${videoId}` : raw;
                            }

                            if (parsed.pathname.startsWith("/embed/")) {
                                return raw;
                            }
                        }

                        if (hostname === "vimeo.com") {
                            const videoId = parsed.pathname.replace(/^\//, "");
                            return videoId ? `https://player.vimeo.com/video/${videoId}` : raw;
                        }
                    } catch (error) {
                        return raw;
                    }

                    return raw;
                }

                function normalizeGameTitle(title) {
                    const value = String(title || "").trim();
                    return /^hajwala\s*1$/i.test(value) ? "Hajwala Drift Revolution" : value;
                }

                function applySectionBackground(selector, gradient, imageUrl) {
                    const section = document.querySelector(selector);
                    if (!section || !imageUrl) {
                        return;
                    }

                    section.style.backgroundImage = `${gradient}, ${toCssUrl(imageUrl)}`;
                }

                function fallbackPageContent(game) {
                    const displayTitle = normalizeGameTitle(game.title || "Game") || "Game";
                    return {
                        hero: {
                            title: displayTitle,
                            description: game.shortDescription || game.description || "",
                            buttonText: "Drift Now",
                            backgroundImage: game.bannerImage || game.image || ""
                        },
                        video: {
                            src: "",
                            poster: game.bannerImage || game.image || "",
                            embedUrl: game.trailerUrl || ""
                        },
                        about: {
                            heading: "The Game",
                            paragraphs: [game.description || "", ""],
                            bullets: ["Immersive Gameplay", "High-Quality Graphics", "Ongoing Updates", "Cross-Platform Experience"],
                            backgroundImage: game.image || game.bannerImage || ""
                        },
                        features: [],
                        media: toArray(game.galleryImages).map((item, index) => ({
                            title: item?.name || `Screenshot ${index + 1}`,
                            url: item?.url || "",
                            thumbnail: item?.thumbnailUrl || item?.url || "",
                            alt: item?.name || `Screenshot ${index + 1}`
                        })).filter((item) => item.url),
                        faq: [],
                        dlc: [],
                        cta: {
                            lines: ["Join", "The", displayTitle],
                            buttonText: "Buy now",
                            systemRequirementsTitle: "SYSTEM REQUIREMENTS",
                            backgroundImage: ""
                        },
                        systemRequirements: {
                            minimumTitle: "Minimum System Requirements",
                            minimum: ["CPU:", "RAM:", "OS:", "VIDEO CARD:", "FREE DISK SPACE:"],
                            recommendedTitle: "Recommended System Requirements",
                            recommended: ["CPU:", "RAM:", "OS:", "VIDEO CARD:", "FREE DISK SPACE:"]
                        },
                        newsletter: {
                            heading: "Newsletter",
                            subHeading: "Join the newsletter to get the latest updates on the game.",
                            consentText: "I agree to receive newsletters and accept the Privacy Policy.",
                            infoText: "You can unsubscribe at any time using the link in our emails.",
                            buttonText: "Subscribe"
                        },
                        footer: {
                            logo: game.logo || "",
                            ageRatingImage: "",
                            copyrightText: ""
                        }
                    };
                }

                function getPageContent(game) {
                    const base = fallbackPageContent(game);
                    const custom = game?.pageContent && typeof game.pageContent === "object" ? game.pageContent : {};
                    return {
                        ...base,
                        ...custom,
                        hero: { ...base.hero, ...(custom.hero || {}) },
                        video: { ...base.video, ...(custom.video || {}) },
                        about: { ...base.about, ...(custom.about || {}) },
                        cta: { ...base.cta, ...(custom.cta || {}) },
                        systemRequirements: { ...base.systemRequirements, ...(custom.systemRequirements || {}) },
                        newsletter: { ...base.newsletter, ...(custom.newsletter || {}) },
                        footer: { ...base.footer, ...(custom.footer || {}) },
                    };
                }

                function renderMedia(mediaItems) {
                    const container = document.querySelector("#media .container");
                    if (!container || !Array.isArray(mediaItems) || mediaItems.length === 0) {
                        return;
                    }

                    const heading = '<div class="row"><div class="col-lg-12 text-center"><h2 class="heading uppercase">Media</h2></div></div>';
                    const cards = mediaItems.map((item) => `
                        <div class="col-lg-4 g-0">
                            <a href="${escapeHtml(item.url || item.thumbnail || "")}" data-title="${escapeHtml(item.title || "Media")}" class="glightbox" data-gallery="games_gallery">
                                <img src="${escapeHtml(item.thumbnail || item.url || "images/game-cover.webp")}" loading="lazy" alt="${escapeHtml(item.alt || item.title || "Game media")}">
                            </a>
                        </div>
                    `);

                    const rows = [];
                    for (let i = 0; i < cards.length; i += 3) {
                        rows.push(`<div class="row gallery-box">${cards.slice(i, i + 3).join("")}</div>`);
                    }

                    container.innerHTML = heading + rows.join("");
                }

                function renderFaq(faqItems, systemRequirements) {
                    const heading = document.querySelector(".faq .heading");
                    if (heading) heading.textContent = "FAQ";

                    const accordion = document.querySelector(".faq .accordion");
                    if (!accordion) {
                        return;
                    }

                    const normalFaq = toArray(faqItems).map((item, index) => {
                        const n = index + 1;
                        const headingId = `headingDynamic${n}`;
                        const collapseId = `collapseDynamic${n}`;

                        return `
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="${headingId}">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                                    ${escapeHtml(item.question || "Question")}
                                </button>
                            </h2>
                            <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#accordionExample">
                                <div class="accordion-body">${escapeHtml(item.answer || "")}</div>
                            </div>
                        </div>
                        `;
                    });

                    const toRequirementList = (entries) => {
                        return toArray(entries).map((line) => `<li>${escapeHtml(line)}</li>`).join("");
                    };

                    const requirementItem = `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="headingDynamicRequirements">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDynamicRequirements" aria-expanded="false" aria-controls="collapseDynamicRequirements">
                                ${escapeHtml(systemRequirements.question || "What are the system requirements?")}
                            </button>
                        </h2>
                        <div id="collapseDynamicRequirements" class="accordion-collapse collapse" aria-labelledby="headingDynamicRequirements" data-bs-parent="#accordionExample">
                            <div class="accordion-body">
                                <h3>${escapeHtml(systemRequirements.minimumTitle || "Minimum System Requirements")}</h3>
                                <ul>${toRequirementList(systemRequirements.minimum)}</ul>
                                <br>
                                <h3>${escapeHtml(systemRequirements.recommendedTitle || "Recommended System Requirements")}</h3>
                                <ul>${toRequirementList(systemRequirements.recommended)}</ul>
                            </div>
                        </div>
                    </div>
                    `;

                    accordion.innerHTML = [...normalFaq, requirementItem].join("");
                }

                function renderDlc(dlcItems) {
                    const dlcSection = document.getElementById("dlc");
                    const section = document.querySelector("#dlc .container");
                    const dlcNavLink = document.querySelector('a.nav-link[href="#dlc"]');
                    if (!section || !dlcSection) {
                        return;
                    }

                    if (!Array.isArray(dlcItems) || dlcItems.length === 0) {
                        dlcSection.style.display = "none";
                        if (dlcNavLink) {
                            dlcNavLink.style.display = "none";
                        }
                        return;
                    }

                    dlcSection.style.display = "";
                    if (dlcNavLink) {
                        dlcNavLink.style.display = "";
                    }

                    const heading = '<div class="row"><div class="col-lg-12 text-center"><h2 class="heading uppercase">DLC</h2></div></div>';

                    const cards = dlcItems.map((item, index) => {
                        const delayedClass = index === 1 ? " delayed" : index > 1 ? " delayed-1" : "";
                        return `
                        <div class="col-lg-4 animation-element slide-down${delayedClass}">
                            <div class="dlc-cover mx-auto">
                                <a href="${escapeHtml(item.url || "#")}">
                                    <img src="${escapeHtml(item.image || "images/dlc.webp")}" class="img-fluid" loading="lazy" alt="${escapeHtml(item.alt || item.title || "DLC cover")}">
                                </a>
                            </div>
                        </div>
                        `;
                    }).join("");

                    section.innerHTML = `${heading}<div class="row">${cards}</div>`;
                }

                function applyContentToCta(content, game, links) {
                    applySectionBackground("#cta", "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.82) 100%)", content.cta?.backgroundImage || "");

                    const lines = toArray(content.cta?.lines);
                    const ctaHeaders = document.querySelectorAll("#cta .cta-text h3");
                    ctaHeaders.forEach((heading, index) => {
                        if (lines[index]) {
                            heading.textContent = lines[index];
                        }
                    });

                    const ctaButton = document.querySelector("#cta .cta-text .dropdown-toggle");
                    if (ctaButton && content.cta?.buttonText) {
                        ctaButton.textContent = content.cta.buttonText;
                    }

                    const boxArt = document.querySelector("#cta .game-box");
                    if (boxArt && (game.logo || game.image)) {
                        boxArt.src = game.logo || game.image;
                        boxArt.alt = `${game.title || "Game"} box art`;
                    }

                    const platformImage = document.querySelector("#cta img.platforms");
                    if (platformImage && game.bannerImage) {
                        platformImage.src = game.bannerImage;
                    }

                    const requirementsTitle = document.querySelector("#system-requirements");
                    if (requirementsTitle && content.cta?.systemRequirementsTitle) {
                        requirementsTitle.textContent = content.cta.systemRequirementsTitle;
                    }

                    const systemReqBody = document.querySelector("#systemreq .modal-body");
                    if (systemReqBody) {
                        const minItems = toArray(content.systemRequirements?.minimum).map((line) => `<li>${escapeHtml(line)}</li>`).join("");
                        const recItems = toArray(content.systemRequirements?.recommended).map((line) => `<li>${escapeHtml(line)}</li>`).join("");
                        systemReqBody.innerHTML = `
                            <h3>${escapeHtml(content.systemRequirements?.minimumTitle || "Minimum System Requirements")}</h3>
                            <ul>${minItems}</ul>
                            <br>
                            <h3>${escapeHtml(content.systemRequirements?.recommendedTitle || "Recommended System Requirements")}</h3>
                            <ul>${recItems}</ul>
                        `;
                    }

                    const newsletterHeading = document.querySelector("#cta .newsletter-container h3");
                    if (newsletterHeading && content.newsletter?.heading) {
                        newsletterHeading.textContent = content.newsletter.heading;
                    }

                    const newsletterSubheading = document.querySelector("#cta .newsletter-container .sub-heading");
                    if (newsletterSubheading && content.newsletter?.subHeading) {
                        newsletterSubheading.textContent = content.newsletter.subHeading;
                    }

                    const consentLabel = document.querySelector("#cta .newsletter-container label");
                    if (consentLabel && content.newsletter?.consentText) {
                        const checkbox = consentLabel.querySelector("input[type='checkbox']");
                        const privacyLink = consentLabel.querySelector("a");
                        const checkboxHtml = checkbox ? checkbox.outerHTML : '<input type="checkbox" required>';
                        const privacyHtml = privacyLink ? privacyLink.outerHTML : '<a href="privacy_policy.html">Privacy Policy</a>';
                        consentLabel.innerHTML = `${checkboxHtml} ${escapeHtml(content.newsletter.consentText).replace("Privacy Policy", privacyHtml)}`;
                    }

                    const infoParagraph = document.querySelector("#cta .newsletter-container p:not(.sub-heading)");
                    if (infoParagraph && content.newsletter?.infoText) {
                        infoParagraph.textContent = content.newsletter.infoText;
                    }

                    const newsletterButton = document.querySelector("#cta .newsletter-button");
                    if (newsletterButton && content.newsletter?.buttonText) {
                        newsletterButton.textContent = content.newsletter.buttonText;
                    }

                    const stores = firstStoreLinks(links);
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

                function applyFooterContent(content) {
                    const logo = document.querySelector("#main-footer .company-logo");
                    if (logo && content.footer?.logo) {
                        logo.src = content.footer.logo;
                    }

                    const ageRating = document.querySelector("#main-footer .age-rating");
                    if (ageRating && content.footer?.ageRatingImage) {
                        ageRating.src = content.footer.ageRatingImage;
                    }

                    const copyright = document.querySelector("#copyright");
                    if (copyright && content.footer?.copyrightText) {
                        const yearNode = document.getElementById("year");
                        if (yearNode) {
                            copyright.innerHTML = `${escapeHtml(content.footer.copyrightText)} <span id="year">${yearNode.textContent || ""}</span>`;
                        } else {
                            copyright.textContent = content.footer.copyrightText;
                        }
                    }
                }

                function refreshLightbox() {
                    if (window.__rababaLightboxInstance && typeof window.__rababaLightboxInstance.destroy === "function") {
                        window.__rababaLightboxInstance.destroy();
                    }

                    if (typeof window.GLightbox === "function") {
                        window.__rababaLightboxInstance = window.GLightbox({
                            touchNavigation: true,
                            loop: true,
                            autoplayVideos: true
                        });
                    }
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

                    const displayTitle = normalizeGameTitle(game.title || "") || "Game";

                    window.RABABA_CURRENT_GAME = {
                        id: game._id || "",
                        title: displayTitle,
                    };

                    const content = getPageContent(game);

                    document.title = `${displayTitle} - Rababa Games`;

                    const heroTitle = document.querySelector("#hero h1");
                    if (heroTitle) heroTitle.textContent = normalizeGameTitle(content.hero?.title || displayTitle) || heroTitle.textContent;

                    const heroText = document.querySelector("#hero .col-lg-4 p");
                    if (heroText) heroText.textContent = content.hero?.description || game.shortDescription || game.description || heroText.textContent;

                    const heroButton = document.querySelector("#hero a.button");
                    if (heroButton && content.hero?.buttonText) {
                        heroButton.textContent = content.hero.buttonText;
                    }

                    applySectionBackground("#hero", "linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.5) 100%)", content.hero?.backgroundImage || game.bannerImage || game.image || "");

                    const video = document.getElementById("bgvid");
                    const videoSection = document.querySelector(".video");
                    const videoSource = video?.querySelector("source");
                    const embedUrl = normalizeEmbedUrl(content.video?.embedUrl || game.trailerUrl || "");
                    if (video && content.video?.poster) {
                        video.poster = content.video.poster;
                    }
                    if (videoSource && content.video?.src) {
                        if (videoSection) {
                            videoSection.style.display = "";
                        }
                        videoSource.src = content.video.src;
                        video.load();
                    } else if (videoSection && embedUrl) {
                        videoSection.style.display = "";
                        videoSection.innerHTML = `
                            <div class="video-embed-shell">
                                <iframe
                                    src="${escapeHtml(embedUrl)}"
                                    title="${escapeHtml(displayTitle + " trailer")}" 
                                    loading="lazy"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerpolicy="strict-origin-when-cross-origin">
                                </iframe>
                            </div>
                        `;
                    } else if (videoSection) {
                        videoSection.style.display = "none";
                    }

                    const aboutHeading = document.querySelector("#about h2");
                    if (aboutHeading && content.about?.heading) {
                        aboutHeading.textContent = content.about.heading;
                    }

                    const aboutParagraphs = document.querySelectorAll("#about .col-lg-6 > p");
                    toArray(content.about?.paragraphs).forEach((text, index) => {
                        if (aboutParagraphs[index]) {
                            aboutParagraphs[index].textContent = text;
                        }
                    });

                    applySectionBackground("#about", "linear-gradient(90deg, rgba(0,0,0,0.9) 20%, rgba(17,17,17,0) 100%)", content.about?.backgroundImage || game.image || game.bannerImage || "");

                    const bulletList = document.querySelector("#about .bulletpoints");
                    if (bulletList && toArray(content.about?.bullets).length > 0) {
                        const bullets = toArray(content.about.bullets).map((item, index) => {
                            const delayClass = index === 1 ? " delayed" : index === 2 ? " delayed-1" : index >= 3 ? " delayed-2" : "";
                            return `<li class="animation-element slide-up${delayClass}"><span class="highlight">+</span> ${escapeHtml(item)}</li>`;
                        });

                        const blocks = [];
                        for (let i = 0; i < bullets.length; i += 2) {
                            blocks.push(`<div class="block">${bullets.slice(i, i + 2).join("")}</div>`);
                        }

                        bulletList.innerHTML = blocks.join("");
                    }

                    renderMedia(toArray(content.media));
                    renderFaq(toArray(content.faq), content.systemRequirements || {});
                    renderDlc(toArray(content.dlc));

                    const stores = firstStoreLinks(game.links);
                    applyContentToCta(content, game, game.links || {});
                    applyFooterContent(content);

                    // Keep backward compatibility for legacy store menu if CTA section is missing.
                    const ctaAnchors = document.querySelectorAll("#cta .dropdown-menu .dropdown-item");
                    if (ctaAnchors.length > 0) {
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

                    refreshLightbox();
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
            refreshLightbox();

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