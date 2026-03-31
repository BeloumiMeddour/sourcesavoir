import { isEmailValid, isPasswordValid } from "./validation.js";

let inputCourriel;
let inputMotDePasse;
let formAuth;
let erreurs;

function initDOMElements() {
    inputCourriel = document.getElementById("input-courriel");
    inputMotDePasse = document.getElementById("input-mot-de-passe");
    formAuth = document.getElementById("form-auth");
    erreurs = document.getElementById("erreurs");
    
    formAuth.addEventListener("submit", connexion);
}

async function connexion(event) {
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
    let response = await fetch("/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    // Traitement de la réponse
    if (response.ok) {
        // Si l'authentification est réussi, on
        // redirige vers une autre page
        window.location.replace("/");
    } else if (response.status === 401) {
        // Si l'authentification ne réussi pas, on
        // a le message d'erreur dans l'objet "data"
        let data = await response.json();

        if (data.error === "mauvais_utilisateur") {
            erreurs.innerText = "Aucun compte ne correspond à ce courriel.";
        } else if (data.error === "mauvais_mot_de_passe") {
            erreurs.innerText = "Le mot de passe est incorrect.";
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initDOMElements();
});
