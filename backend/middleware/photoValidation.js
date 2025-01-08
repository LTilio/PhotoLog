const { body } = require("express-validator");

const photoInsertValidation = () => {
  return [
    body("title")
      .not()
      .equals("undefined")
      .withMessage("O titulo é obrigatorio")
      .isString("O titulo é obrigatorio")
      .isLength({ min: 3, max: 50 })
      .withMessage("O titulo deve conter entre 3 e 50 caracteres"),
    body("image").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("A imagem é obrigatoria");
      }
      return true;
    }),
  ];
};

const photoUpdateValidation = () => {
  return [
    body("title")
      .notEmpty()
      .withMessage("O titulo é obrigatorio")
      .isString()
      .withMessage("O titulo deve ser uma string")
      .isLength({ min: 3, max: 50 })
      .withMessage("O titulo deve conter entre 3 e 50 caracteres"),
  ];
};

const commentValidation = () => {
  return [
    body("comment")
      .notEmpty()
      .withMessage("O comentario é obrigatorio")
      .isString()
      .withMessage("O comentario deve ser uma string")
      .isLength({ min: 3, max: 200 })
      .withMessage("O comentario deve conter entre 3 e 200 caracteres"),
  ];
};

module.exports = {
  photoInsertValidation,
  photoUpdateValidation,
  commentValidation,
};
