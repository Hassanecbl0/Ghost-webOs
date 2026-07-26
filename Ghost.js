document.addEventListener('DOMContentLoaded', function () {
    const currentPath = window.location.pathname.toLowerCase();
    const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    const isBootPage = currentFile === '' || currentFile === 'index.html';
    const isLoginPage = currentFile === 'login.html';
    const isWelcomePage = currentFile === 'welcome.html';

    if (isBootPage) {
        const bootBar = document.getElementById('loadingBar');

        if (bootBar) {
            let progress = 0;

            function updateLoading() {
                progress += Math.random() * 6;
                if (progress > 100) {
                    progress = 100;
                }

                bootBar.style.width = progress + '%';

                if (progress < 100) {
                    setTimeout(updateLoading, 100 + Math.random() * 300);
                } else {
                    setTimeout(function () {
                        window.location.replace('login.html');
                    }, 800);
                }
            }

            updateLoading();
        } else {
            window.location.replace('login.html');
        }
    } else if (isLoginPage) {
        const input = document.getElementById('password');
        const button = document.getElementById('loginBtn');
        const message = document.getElementById('message');

        if (input && button && message) {
            const PASSWORD = '123456';

            function login() {
                const password = input.value.trim();

                if (password === PASSWORD) {
                    message.textContent = 'Connexion réussie...';
                    message.style.color = '#0f0';

                    setTimeout(function () {
                        window.location.replace('welcome.html');
                    }, 800);
                } else {
                    message.textContent = 'Mot de passe incorrect';
                    message.style.color = '#ff4d4d';
                    input.value = '';
                    input.focus();
                }
            }

            button.addEventListener('click', function (e) {
                e.preventDefault();
                login();
            });

            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    login();
                }
            });

            input.focus();
        }
    } else if (isWelcomePage) {
        setTimeout(function () {
            window.location.replace('Bureau.html');
        }, 2000);
    }
});
