const User = require("../models/User");

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

// generate user token

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: "7d",
  });
};

//register user and sign in
const register = async (req, res) => {
  const { name, email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    res.status(422).json({ errors: ["Email já cadastrado"] });
    return;
  }

  //generate password hash
  const salt = await bcrypt.genSalt();
  const passHash = await bcrypt.hash(password, salt);

  try {
    const newUser = await User.create({
      name,
      email,
      password: passHash,
    });

    res.status(201).json({
      _id: newUser._id,
      token: generateToken(newUser._id),
    });
  } catch (error) {
    console.error("Erro interno do servidor:", error);
    res.status(500).json({ errors: ["Ocorreu um erro, tente mais tarde"] });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ errors: ["Usuário não encontrado"] });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ errors: ["Credenciais inválidas"] });
    }

    res.status(200).json({
      _id: user._id,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ errors: ["Erro interno do servidor"] });
  }
};

//Get current logged user
const getCurrentUser = async (req, res) => {
  const user = req.user;

  res.status(200).json(user);
};

//upload an user
const update = async (req, res) => {
  const { name, password, bio } = req.body;
  let profileImage = null;

  if (req.file) {
    profileImage = req.file.filename;
  }

  const reqUser = req.user;
  const user = await User.findById(reqUser._id).select("-password");

  if (!user) {
    return res.status(404).json({ errors: ["Usuário não encontrado"] });
  }

  if (name) {
    user.name = name;
  }

  if (password) {
    //generate password hash
    const salt = await bcrypt.genSalt();
    const passHash = await bcrypt.hash(password, salt);

    user.password = passHash;
  }

  if (profileImage) {
    user.profileImage = profileImage;
  }

  if (bio) {
    user.bio = bio;
  }

  await user.save();

  res.status(200).json(user);
};

//Get user by id

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-password");
    //check if user exists
    if (!user) {
      res.status(404).json({ errors: ["Usuario não encontrado"] });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ errors: ["Usuario não encontrado"] });
    return;
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  update,
  getUserById,
};
