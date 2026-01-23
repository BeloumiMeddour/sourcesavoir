import { isDescriptionValid, isEmailValid } from "./validation.js";

const formulaire = document.getElementById("todo-form");
const description = document.getElementById("todo-input");
const listeDesTaches = document.getElementById("todo-list");
const templateTache = document.getElementById("todo-template");

const errorMessage = document.getElementById("error-message");

// Mettre à jour une tâche sur le serveur
const updateTodoOnServer = async (id) => {
    try {
        // const response = await fetch(`/api/update-todo/${id}`, {
        //     method: "PUT",
        // });

        //Uasge de query param
        const response = await fetch(`/api/update-todo?id=${id}`, {
            method: "PATCH",
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la tâche");
    }
};

//Ajouter une tâche au DOM
const addTodoToDOM = (tache) => {
    //Cloner le template
    const clone = templateTache.content.firstElementChild.cloneNode(true);

    //Modifier le clone
    const descriptionTache = clone.querySelector(".description");
    const checkboxTache = clone.querySelector("input[type='checkbox']");

    descriptionTache.textContent = tache.description;
    checkboxTache.checked = tache.completed;

    //Ajouter un écouteur sur la checkbox
    checkboxTache.addEventListener("change", () => {
        updateTodoOnServer(tache.id);
    });

    //Ajouter le clone à la liste
    listeDesTaches.appendChild(clone);

    //Vider le champ de saisie
    description.value = "";
};

//Ajouter une tâche sur le serveur
const addTodoToServer = async () => {
    //Recupérer la description de la tâche
    const descriptionTache = description.value;

    if (!isDescriptionValid(descriptionTache)) {
        errorMessage.textContent =
            "Description invalide. Veuillez entrer une description valide.";
        return;
    }

    //Fabriquer l'objet à envoyer
    const tache = { description: descriptionTache };

    //Envoyer la requête au serveur
    const response = await fetch("/api/add-todo", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tache),
    });

    //Traiter la réponse du serveur, response.ok = 200-299 (signifie que la requête a réussi)
    if (response.ok) {
        //Recuperer des données envoyées par le serveur
        const data = await response.json();

        //Ajouter la tâche au DOM
        addTodoToDOM(data.tache);
        errorMessage.textContent = "";
    } else {
        console.error("Erreur lors de l'ajout de la tâche");
    }
};

//Ajouter un écouteur sur le formulaire d'ajout de tâche
formulaire.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodoToServer();
});

//Mettre a jour une tache
const updateTask = async (event) => {
    await fetch(`/api/update-todo?id=${event.target.parentElement.id}`, {
        method: "PATCH",
    });
};

//Permet d'ajouter un event listener sur chaque checkbox
const checkboxes = document.querySelectorAll("input[type=checkbox]");
checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateTask);
});
