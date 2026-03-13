const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

router.get("/me", getMe);
router.put("/updatedetails", updateDetails);
router.put("/updatepassword", updatePassword);
router.get("/logout", logout);

module.exports = router;