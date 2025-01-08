const { body } = require("express-validator");

const userCreateValidation = () => {
  return [
    body("name")
      .isLength({ min: 3, max: 50 })
      .withMessage("O nome deve conter entre 3 e 50 caracteres")
      .trim()
      .escape(),
    body("email")
      .isEmail()
      .withMessage("Insira um email válido")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("A senha deve conter no mínimo 6 caracteres")
      .trim(),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("As senhas não são iguais");
        }
        return true;
      })
      .trim(),
  ];
};

const loginValidation = () => {
  return [
    body("email")
      .isEmail()
      .withMessage("Insira um email válido")
      .normalizeEmail(),
    body("password").trim(),
  ];
};

const userUpdateValidation = () => {
  return [
    body("name")
      .optional()
      .isLength({ min: 3 })
      .withMessage("O nome precisa de pelo menos 3 caracteres"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("A senha deve conter no mínimo 6 caracteres")
      .trim(),
      body("bio")
      .optional()
      .isLength({max: 500})
      .withMessage("Maximo de 500 caracteres")
  ];
};

module.exports = {
  userCreateValidation,
  loginValidation,
  userUpdateValidation,
};
