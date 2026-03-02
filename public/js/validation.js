// Validation côté client

// Référence : https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
const reg =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const isStringValid = (str) =>
    str.trim().length !== 0 &&
    typeof str === "string" &&
    str.trim().length >= 5 &&
    str.trim().length <= 100;

const isEmailValid = (email) => isStringValid(email) && reg.test(email);
const isPasswordValid = (password) => isStringValid(password);

export { isEmailValid, isPasswordValid };
