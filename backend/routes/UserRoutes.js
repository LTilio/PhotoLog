const express = require("express");
const router = express.Router();

//Controller
const {
  register,
  login,
  getCurrentUser,
  update,
  getUserById,
} = require("../controllers/UserController");

//Middleware
const validate = require("../middleware/handleValidation");
const {
  userCreateValidation,
  loginValidation,
  userUpdateValidation,
} = require("../middleware/userValidations");
const authGurd = require("../middleware/authGuard");
const { imageUpload } = require("../middleware/imageUpload");

//routes
// POST Routes
router.post("/register", userCreateValidation(), validate, register); // Rota específica
router.post("/login", loginValidation(), validate, login); // Rota específica

// GET Routes
router.get("/profile", authGurd, getCurrentUser); // Rota específica
router.get("/:id", getUserById); // Rota dinâmica, deve vir por último

// PUT Routes
router.put(
  "/",
  authGurd,
  userUpdateValidation(),
  validate,
  imageUpload.single("profileImage"),
  update
); // Rota genérica

module.exports = router;
