import { isDescriptionValid } from "../public/js/validation.js";

//Middleware pour valider la description d'une tâche
const validerDescription = (req, res, next) => {
    const { description } = req.body;
    if (!isDescriptionValid(description)) {
        return res.status(400).end();
    }
    next();
};
export { validerDescription };
