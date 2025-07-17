const { validationResult } = require("express-validator");
const Contact = require("../models/Contact");
const { Types } = require("mongoose");

// Add Contact
const addContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, phone, address, note } = req.body;
  try {
    const newContact = new Contact({
      name,
      phone,
      address,
      note,
    });
    const contact = await newContact.save();
    const io = req.app.get("socketIO");
    if (io) {
      io.emit("newContactAdded", contact);
    }
    res.status(201).json(contact);
  } catch (err) {
    console.log(err.message);
    res.status(500).json("Server Error");
  }
};

// Get Contact with Pagination and Filtering
const getContacts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const { name, phone, address } = req.query;
  const filter = {};

  if (name) {
    filter.name = { $regex: name, $options: "i" };
  }
  if (phone) {
    filter.phone = { $regex: phone, $options: "i" };
  }
  if (address) {
    filter.address = { $regex: address, $options: "i" };
  }
  try {
    const contacts = await Contact.find(filter)
      .populate("lockedBy", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalContacts = await Contact.countDocuments(filter);

    res.json({
      contacts,
      currentPage: page,
      totalPages: Math.ceil(totalContacts / limit),
      totalContacts,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Edit Contact
const editContact = async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, note, userId } = req.body;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Contact ID" });
  }
  if (!name || !phone) {
    return res.status(400).json({ message: "Name and Phone are required" });
  }
  try {
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(400).json({ message: "Contact not founnd" });
    }
    if (contact.lockedBy && contact.lockedBy.toString() !== userId) {
      return res
        .status(400)
        .json({ message: "Contact is Locked by another user" });
    }
    contact.name = name;
    contact.phone = phone;
    contact.address = address;
    contact.note = note;
    contact.lockedBy = null;
    contact.lockedAt = null;

    await contact.save();
    const io = req.app.get("socketIO");
    if (io) {
      io.emit("editedContact", contact);
    }
    res.json(contact);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete Contact
const deleteContact = async (req, res) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Contact ID" });
  }
  try {
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(400).json({ message: "No contact found" });
    }
    await Contact.deleteOne({ _id: id });
    res.json({ message: "Contact Deleted" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  addContact,
  getContacts,
  editContact,
  deleteContact,
};
