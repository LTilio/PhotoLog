const Photo = require("../models/Photo");
const mongoose = require("mongoose");
const User = require("../models/User");
const fs = require("fs").promises;
const path = require("path");

//inset a photo, with an user reated to id
const insertPhoto = async (req, res) => {
  try {
    const { title } = req.body;
    const image = req.file.filename;

    const reqUser = req.user;
    const user = await User.findById(reqUser._id);

    // Verifica se o usuário existe
    if (!user) {
      return res.status(404).json({ errors: ["Usuário não encontrado."] });
    }

    // Cria a foto
    const newPhoto = await Photo.create({
      image,
      title,
      userId: user._id,
      userName: user.name,
    });

    // Se a foto não for criada, retorna erro
    if (!newPhoto) {
      return res
        .status(422)
        .json({ errors: ["Houve um erro, tente mais tarde..."] });
    }

    // Retorna os dados da foto criada
    return res.status(201).json(newPhoto);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      errors: ["Erro interno do servidor. Tente novamente mais tarde."],
    });
  }
};

//Remove a photo from db
const deletePhoto = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    const reqUser = req.user;

    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ errors: ["ID fornecido inválido."] });
    }

    // Fetch the photo with session
    const photo = await Photo.findById(id).session(session);

    // Check if the photo exists
    if (!photo) {
      return res.status(404).json({ errors: ["Imagem não encontrada"] });
    }

    // Check if the photo belongs to the user
    if (!photo.userId.equals(reqUser._id)) {
      return res
        .status(422)
        .json({ errors: ["Ocorreu um erro, tente mais tarde"] });
    }

    // Remove the photo from the database
    await Photo.findByIdAndDelete(photo._id).session(session);

    /// Try to remove the image from the file system
    const imagePath = path.join(
      __dirname,
      "..",
      "uploads",
      "photos",
      photo.image
    );
    try {
      await fs.access(imagePath); // Verifica se o arquivo existe
      await fs.unlink(imagePath); // Exclui o arquivo
    } catch (error) {
      console.error("Erro ao excluir o arquivo da pasta:", error); // Adicionado para depuração
      // Se a exclusão do arquivo falhar, aborta a transação do banco de dados
      await session.abortTransaction();
      return res.status(500).json({
        errors: ["Erro ao excluir a imagem do sistema."],
      });
    }

    // Commit the transaction if everything succeeded
    await session.commitTransaction();
    return res.status(200).json({
      id: photo._id,
      message: "Foto excluída com sucesso.",
    });
  } catch (error) {
    console.error(error);
    // If there's an error, abort the transaction and handle it
    await session.abortTransaction();
    return res.status(500).json({
      errors: ["Erro interno do servidor. Tente novamente mais tarde."],
    });
  } finally {
    // Ensure the session is always ended
    session.endSession();
  }
};

//Get all photos
const getAllPhotos = async (req, res) => {
  const photos = await Photo.find({})
    .sort([["createdAt", -1]])
    .exec();
  return res.status(200).json(photos);
};

//Get user Photos
const getUserPhotos = async (req, res) => {
  const { id } = req.params;

  const photos = await Photo.find({ userId: id })
    .sort([["createdAt", -1]])
    .exec();

  return res.status(200).json(photos);
};

// get photo by id
const getPhotoById = async (req, res) => {
  const { id } = req.params;

  // Verifica se o ID é válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ errors: ["ID fornecido inválido."] });
  }

  const photo = await Photo.findById(id);
  if (!photo) {
    return res.status(404).json({ errors: ["Foto não encontrada."] });
  }
  return res.status(200).json(photo);
};

//update a photo
const updatePhoto = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const userReq = req.user;

  // Verifica se o ID é válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ errors: ["ID fornecido inválido."] });
  }

  const photo = await Photo.findById(id);
  if (!photo) {
    return res.status(404).json({ errors: ["Foto não encontrada."] });
  }

  if (!photo.userId.equals(userReq._id)) {
    return res
      .status(422)
      .json({ errors: ["Você não tem permissão para editar essa foto."] });
  }

  if (title) {
    photo.title = title;
  }

  await photo.save();

  return res
    .status(200)
    .json({ photo, message: "Foto atualizada com sucesso." });
};

//Like/Unlike function
const likePhoto = async (req, res) => {
  const { id } = req.params;
  const requser = req.user;

  const photo = await Photo.findById(id);
  if (!photo) {
    return res.status(404).json({ errors: ["Foto não encontrada."] });
  }

  // Check if user already liked the photo
  const likeIndex = photo.likes.indexOf(requser._id);
  if (likeIndex !== -1) {
    // User already liked the photo, so unlike it
    photo.likes.splice(likeIndex, 1);
    await photo.save();
    return res.status(200).json({
      photoId: id,
      userId: requser._id,
      message: "Like removido com sucesso",
    });
  }

  // User has not liked the photo, so like it
  photo.likes.push(requser._id);
  await photo.save();

  res.status(200).json({
    photoId: id,
    userId: requser._id,
    message: "Foto curtida com sucesso",
  });
};

const commentPhoto = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  const reqUser = req.user;
  const user = await User.findById(reqUser._id);

  const photo = await Photo.findById(id);

  if (!photo) {
    return res.status(404).json({ errors: ["Foto não encontrada."] });
  }

  const userComment = {
    comment,
    userName: user.name,
    userImage: user.profileImage,
    userId: user._id,
  };

  photo.comments.push(userComment);
  await photo.save();

  res.status(200).json({
    comment: userComment,
    message: "Comentário adicionado com sucesso.",
  });
};

//Search photos by title
const searchPhotos = async (req, res) => {
  const { q } = req.query;
  const photos = await Photo.find({ title: new RegExp(q, "i") }).exec();

  res.status(200).json(photos);
};

module.exports = {
  insertPhoto,
  deletePhoto,
  getAllPhotos,
  getUserPhotos,
  getPhotoById,
  updatePhoto,
  likePhoto,
  commentPhoto,
  searchPhotos,
};
