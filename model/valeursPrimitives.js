/**
 * Ne garde d'une valeur reçue dans un corps de requête que les données primitives :
 * string, number, boolean ou null.
 * Un objet ou un tableau ({ increment: 1 }, { set: ... }, { connect: ... }) serait interprété par Prisma
 * comme une opération et non comme une donnée : il est ignoré.
 * @param {*} valeur
 * @returns {*} la valeur telle quelle si elle est primitive, sinon undefined (champ ignoré par Prisma)
 */
const primitiveOuIgnoree = (valeur) => {
    if (valeur === null) {
        return null;
    }
    const type = typeof valeur;
    if (type === "string" || type === "number" || type === "boolean") {
        return valeur;
    }
    return undefined;
};

export { primitiveOuIgnoree };
