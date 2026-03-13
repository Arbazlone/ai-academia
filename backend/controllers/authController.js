
const User = require("../models/User");
const jwt = require("jsonwebtoken");


// ================= REGISTER =================
exports.register = async (req, res) => {
  try {

    const { firstName, lastName, email, password } = req.body;

    const name = `${firstName} ${lastName}`;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    // generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};



// ================= LOGIN =================
exports.login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};



// ================= GET CURRENT USER =================
exports.getMe = async (req, res) => {
  try {

    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user
    });

  } catch (error) {

    res.status(500).json({
      message: "Server Error"
    });

  }
};



// ================= UPDATE DETAILS =================
exports.updateDetails = async (req, res) => {
  try {

    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      user
    });

  } catch (error) {

    res.status(500).json({
      message: "Server Error"
    });

  }
};



// ================= UPDATE PASSWORD =================
exports.updatePassword = async (req, res) => {
  try {

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.matchPassword(req.body.currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect password"
      });
    }

    user.password = req.body.newPassword;

    await user.save();

    res.json({
      success: true,
      message: "Password updated"
    });

  } catch (error) {

    res.status(500).json({
      message: "Server Error"
    });

  }
};



// ================= LOGOUT =================
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: "Logged out"
  });
};

