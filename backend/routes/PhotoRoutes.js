const express = require("express");
const router = express.Router();

//Controllers
const {
  insertPhoto,
  deletePhoto,
  getAllPhotos,
  getUserPhotos,
  getPhotoById,
  updatePhoto,
  likePhoto,
  commentPhoto,
  searchPhotos,
} = require("../controllers/PhotoController");

//Middleware
const {
  photoInsertValidation,
  photoUpdateValidation,
  commentValidation,
} = require("../middleware/photoValidation");
const authGuard = require("../middleware/authGuard");
const validade = require("../middleware/handleValidation");
const { imageUpload } = require("../middleware/imageUpload");

//Routes
// POST Routes
router.post(
  "/",
  authGuard,
  imageUpload.single("image"),
  photoInsertValidation(),
  validade,
  insertPhoto
); // Rota genérica 

// GET Routes
router.get("/", getAllPhotos); // Rota genérica 
router.get("/user/:id", getUserPhotos); // Rota mais específica
router.get("/search", searchPhotos); // Rota mais específica
router.get("/:id", getPhotoById); // Rota dinâmica, deve vir por último

// PUT Routes
router.put("/:id", authGuard, photoUpdateValidation(), validade, updatePhoto); // Rota dinâmica
router.put("/like/:id", authGuard, likePhoto); // Rota mais específica
router.put(
  "/comment/:id",
  authGuard,
  commentValidation(),
  validade,
  commentPhoto
); // Rota mais específica

// DELETE Routes
router.delete("/:id", authGuard, deletePhoto); // Rota dinâmica, deve vir por último

module.exports = router;
