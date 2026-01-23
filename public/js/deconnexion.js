const btnDeconnexion = document.getElementById("btn-deconnexion");

async function deconnexion() {
    let response = await fetch("/deconnexion", {
        method: "POST",
    });

    if (response.ok) {
        // Si la déconnexion est réussie, on redirige
        // vers une autre page
        window.location.replace("/");
    }
}

if (btnDeconnexion) {
    btnDeconnexion.addEventListener("click", deconnexion);
}
