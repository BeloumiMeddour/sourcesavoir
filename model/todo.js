// importer le client prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client prisma
const prisma = new PrismaClient();

const todos = [];

/**
 * Ajoute une tâche
 * @param {*} description
 * @returns la tâche ajoutée
 */
const addTodo = async (description) => {
    const newTodo = await prisma.todo.create({
        data: {
            description,
        },
    });
    return newTodo;
};

/**
 * Retourne la liste des tâches
 * @returns liste des tâches
 */
// const getTodos = () => {
//     return todos;
// };

const getTodos = async () => {
    return await prisma.todo.findMany(); //revient a ecrire SELECT * FROM Todo
};

/**
 * Met à jour une tâche
 * @param {*} id
 * @returns la tâche mise à jour
 */
// const updateTodo = (id) => {
//     const todo = todos.find((todo) => todo.id === id);
//     if (!todo) {
//         throw new Error("Tâche non trouvée");
//     }
//     todo.completed = !todo.completed;
//     return todo;
// };

const updateTodo = async (id) => {
    const todo = await prisma.todo.findUnique({
        where: { id: id },
    });
    if (!todo) {
        throw new Error("Tâche non trouvée");
    }

    const updatedTodo = await prisma.todo.update({
        where: { id: id },
        data: { completed: !todo.completed },
    });
    return updatedTodo;
};

/**
 * Retourne une tâche par son ID
 * @param {*} id
 * @returns la tâche correspondante ou undefined
 */
const getTodoById = (id) => {
    return todos.find((todo) => todo.id === id);
};

/** * Supprime une tâche par son ID
 * @param {*} id
 * @returns true si la tâche a été supprimée, false sinon
 */
const deleteTodo = (id) => {
    const index = todos.findIndex((todo) => todo.id === id);
    if (index !== -1) {
        todos.splice(index, 1);
        return true;
    }
    return false;
};

export { addTodo, getTodos, updateTodo, getTodoById, deleteTodo };
