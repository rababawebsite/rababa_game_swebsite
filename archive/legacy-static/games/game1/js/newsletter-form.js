document.addEventListener('DOMContentLoaded', function() {
    "use strict"

    document.getElementById("newsletterForm").addEventListener("submit", function(e) {
        e.preventDefault();

        const form = e.target;
        const data = new FormData(form);

        fetch("php/subscribe.php", {
        method: "POST",
        body: data
        })
        .then(res => res.json())
        .then(response => {
        document.getElementById("newsletter-msg").textContent = response.message;
        document.getElementById("newsletter-msg").style.color = response.success ? "green" : "red";
        if (response.success) form.reset();
        })
        .catch(() => {
        document.getElementById("newsletter-msg").textContent = "Something went wrong.";
        document.getElementById("newsletter-msg").style.color = "red";
        });
    });
});
