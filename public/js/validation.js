// const isDescriptionValid = (description) => {
//     if (typeof description !== "string" || description.trim().length === 0) {
//         return false;
//     } else {
//         return true;
//     }
// };

// const isDescriptionValid2 = (description) => {
//     if (typeof description !== "string" || description.trim().length === 0) {
//         return false;
//     }
//     return true;
// };

// const isDescriptionValid3 = (description) => {
//     return !(
//         typeof description !== "string" || description.trim().length === 0
//     );
// };

//Reference : https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
const reg =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const isStringValid = (str) =>
    str.trim().length !== 0 &&
    typeof str === "string" &&
    str.trim().length >= 5 &&
    str.trim().length <= 100;

const isDescriptionValid = (description) => isStringValid(description);

const isEmailValid = (email) => isStringValid(email) && reg.test(email);
const isPasswordValid = (password) => isStringValid(password);

export { isDescriptionValid, isEmailValid, isPasswordValid };
