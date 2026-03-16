document.addEventListener('DOMContentLoaded', function() {
    "use strict";

    const form = document.getElementById("newsletterForm");
    const messageEl = document.getElementById("newsletter-msg");

    if (!form || !messageEl) {
        return;
    }

    const getApiBase = () => {
        if (typeof window.RABABA_API_BASE === 'string' && window.RABABA_API_BASE.trim() !== '') {
            return window.RABABA_API_BASE.replace(/\/$/, '');
        }
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        return 'https://rababa-game-swebsite-79cg.vercel.app';
    };

    const getGameContext = () => {
        const currentGame = window.RABABA_CURRENT_GAME || {};
        const params = new URLSearchParams(window.location.search);
        const subscribedGameId = String(currentGame.id || params.get('id') || '').trim();
        const heading = document.querySelector('#hero h1');
        const rawName = currentGame.title || (heading ? heading.textContent : '');
        const subscribedGame = String(rawName || '').trim() || 'Hajwala';
        return { subscribedGame, subscribedGameId };
    };

    const setMessage = (text, ok) => {
        messageEl.textContent = text;
        messageEl.style.color = ok ? '#28a745' : '#dc3545';
    };

    form.addEventListener("submit", async function(e) {
        e.preventDefault();

        const emailInput = form.querySelector('#newsletter');
        const consentInput = form.querySelector('input[name="gdpr[email]"]');
        const submitButton = form.querySelector('button[type="submit"]');

        const email = (emailInput?.value || '').trim();
        const consentGiven = Boolean(consentInput?.checked);
        const gameContext = getGameContext();

        if (!email) {
            setMessage('Email is required.', false);
            return;
        }

        if (!consentGiven) {
            setMessage('Please accept the privacy consent to subscribe.', false);
            return;
        }

        submitButton.disabled = true;
        const previousButtonText = submitButton.textContent;
        submitButton.textContent = 'Subscribing...';

        try {
            const response = await fetch(`${getApiBase()}/api/newsletter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    consentGiven,
                    sourcePage: window.location.href,
                    subscribedGame: gameContext.subscribedGame,
                    subscribedGameId: gameContext.subscribedGameId,
                }),
            });

            const payload = await response.json();

            if (response.ok && payload?.success) {
                setMessage(payload.message || `Thanks for subscribing to ${gameContext.subscribedGame} updates.`, true);
                form.reset();
            } else {
                setMessage(payload?.error || 'Subscription failed. Please try again.', false);
            }
        } catch (error) {
            console.error('Newsletter subscribe error:', error);
            setMessage('Network error. Please try again later.', false);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = previousButtonText || 'Subscribe';
        }
    });
});
