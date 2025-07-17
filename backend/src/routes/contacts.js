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
const nameRegex = /^[A-Za-z\s]+$/;
const phoneRegex = /^[0-9+\-\s()]+$/;

router.get("/", protect, getContacts);

router.post(
  "/",
  [
    protect,
    check("name", "Name is required").not().isEmpty(),
    check("name", "Name must contain only letters and spaces").matches(
      nameRegex
    ),
    check("phone", "phone is required").not().isEmpty(),
    check("phone", "Invalid phone format").matches(phoneRegex),
    check("address", "address is required").not().isEmpty(),
  ],
  addContact
);

router.put("/:id", protect, editContact);

router.delete("/:id", protect, deleteContact);

module.exports = router;
