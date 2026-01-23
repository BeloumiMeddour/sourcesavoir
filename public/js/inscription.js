import { isEmailValid, isPasswordValid } from "./validation.js";

const inputCourriel = document.getElementById("input-courriel");
const inputMotDePasse = document.getElementById("input-mot-de-passe");
const formAuth = document.getElementById("form-auth");
const erreurs = document.getElementById("erreurs");

async function inscription(event) {
    event.preventDefault();

    // Les noms des variables doivent être les mêmes
    // que celles spécifié dans les configuration de
    // passport dans le fichier "auth.js"
    const data = {
        email: inputCourriel.value,
        password: inputMotDePasse.value,
    };

    // Réinitialiser les erreurs
    erreurs.innerText = "";

    // Validation cliente
    if (!isEmailValid(data.email)) {
        erreurs.innerText = "Le courriel n'est pas valide.";
        return;
    }

    if (!isPasswordValid(data.password)) {
        erreurs.innerText =
            "Le mot de passe doit contenir au moins 5 caractères.";
        return;
    }

    // Envoyer la requête au serveur
    let response = await fetch("/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    // Traitement de la réponse
    if (response.ok) {
        // Si l'authentification est réussi, on
        // redirige vers une autre page
        inputCourriel.value = "";
        inputMotDePasse.value = "";
        erreurs.innerText =
            "Inscription réussie ! Vous pouvez maintenant vous connecter.";
        erreurs.style.color = "green";
        // window.location.replace("/connexion");
    } else if (response.status === 409) {
        erreurs.innerText = "Un compte avec ce courriel existe déjà.";
    }
}

formAuth.addEventListener("submit", inscription);
