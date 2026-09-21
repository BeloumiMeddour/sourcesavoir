import { isEmailValid, isPasswordValid } from "./validation.js";

let inputNom;
let inputPrenom;
let inputCourriel;
let inputMotDePasse;
let formAuth;
let erreurs;

function initDOMElements() {
    inputNom = document.getElementById("input-nom");
    inputPrenom = document.getElementById("input-prenom");
    inputCourriel = document.getElementById("input-courriel");
    inputMotDePasse = document.getElementById("input-mot-de-passe");
    formAuth = document.getElementById("form-auth");
    erreurs = document.getElementById("erreurs");
    
    formAuth.addEventListener("submit", inscription);
    initTogglePassword();
}

function initTogglePassword() {
    var btn = document.querySelector(".toggle-password");
    if (!btn) return;
    btn.addEventListener("click", function () {
        var input = document.getElementById("input-mot-de-passe");
        var eyeOn = btn.querySelector(".eye-icon");
        var eyeOff = btn.querySelector(".eye-off-icon");
        if (input.type === "password") {
            input.type = "text";
            eyeOn.style.display = "none";
            eyeOff.style.display = "block";
        } else {
            input.type = "password";
            eyeOn.style.display = "block";
            eyeOff.style.display = "none";
        }
    });
}

async function inscription(event) {
    event.preventDefault();

    // Les noms des variables doivent être les mêmes
    // que celles spécifié dans les configuration de
    // passport dans le fichier "auth.js"
    const data = {
        nom: inputNom.value,
        prenom: inputPrenom.value,
        email: inputCourriel.value,
        password: inputMotDePasse.value,
    };

    // Réinitialiser les erreurs
    erreurs.innerText = "";

    // Validation cliente
    if (!data.nom.trim()) {
        erreurs.innerText = "Le nom est requis.";
        return;
    }

    if (!data.prenom.trim()) {
        erreurs.innerText = "Le prénom est requis.";
        return;
    }

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
        inputNom.value = "";
        inputPrenom.value = "";
        inputCourriel.value = "";
        inputMotDePasse.value = "";
        erreurs.innerText =
            "Inscription réussie ! Votre compte est en attente de validation par un administrateur. Vous recevrez l'accès une fois validé.";
        erreurs.style.color = "green";
        // window.location.replace("/connexion");
    } else if (response.status === 409) {
        erreurs.innerText = "Un compte avec ce courriel existe déjà.";
    } else if (response.status === 400) {
        const data = await response.json();
        erreurs.innerText = data.error || "Données invalides.";
        erreurs.style.color = "red";
    } else {
        erreurs.innerText = "Une erreur est survenue. Veuillez réessayer.";
        erreurs.style.color = "red";
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initDOMElements();
});
