export const numberRegex = /(?<![\w.])-?(\d+\.\d+|\d+|\.\d+)(?!\.\d|\w)/g;

export const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,20}$/;
