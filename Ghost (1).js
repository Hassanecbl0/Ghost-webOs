const currentPath = window.location.pathname.toLowerCase();
const isBootPage = currentPath.includes("boot.html");
const isLoginPage = currentPath.includes("login.html");
const isWelcomePage = currentPath.includes("welcome.html");

if (isBootPage) {
    const bootBar = document.getElementById("loadingBar");

    if (bootBar) {
        let progress = 0;

        function updateLoading() {
            progress += Math.random() * 6;
            if (progress > 100) {
                progress = 100;
            }

            bootBar.style.width = progress + "%";

            if (progress < 100) {
                setTimeout(updateLoading, 100 + Math.random() * 300);
            } else {
                setTimeout(() => {
                    window.location.replace("login.html");
                }, 800);
            }
        }

        updateLoading();
    } else {
        window.location.replace("login.html");
    }
} else if (isLoginPage) {
    const input = document.getElementById("password");
    const button = document.getElementById("loginBtn");
    const message = document.getElementById("message");

    if (input && button && message) {
        const PASSWORD = "123456";

        function login() {
            const password = input.value.trim();

            if (password === PASSWORD) {
                message.textContent = "Connexion réussie...";
                message.style.color = "#0f0";

                setTimeout(() => {
                    window.location.replace("welcome.html");
                }, 800);
            } else {
                message.textContent = "Mot de passe incorrect";
                message.style.color = "#ff4d4d";

                input.value = "";
                input.focus();
            }
        }

        button.addEventListener("click", function (e) {
            e.preventDefault();
            login();
        });

        button.onclick = function (e) {
            e.preventDefault();
            login();
        };

        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                login();
            }
        });
    }
} else if (isWelcomePage) {
    setTimeout(() => {
        window.location.replace("final.html");
    }, 2000);
}
