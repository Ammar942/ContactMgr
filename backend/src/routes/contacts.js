const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { protect, authorize } = require("../middleware/auth");
const {
  addContact,
  editContact,
  getContacts,
  deleteContact,
} = require("../controllers/contactController");

router.get("/", protect, getContacts);

router.post(
  "/",
  [
    protect,
    check("name", "Name is required").not().isEmpty(),
    check("phone", "phone is required").not().isEmpty(),
    check("address", "address is required").not().isEmpty(),
  ],
  addContact
);

router.put("/:id", protect, editContact);

router.delete("/:id", protect, deleteContact);

module.exports = router;
