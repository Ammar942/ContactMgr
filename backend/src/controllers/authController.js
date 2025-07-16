const jwt = require("jsonwebtoken");

// Dummy users for test
const users = [
  {
    id: "60c72b2f9b1e8e001c8e4d3a",
    username: "user1",
    password: "user1",
    role: "user",
  },
  {
    id: "60c72b2f9b1e8e001c8e4d3b",
    username: "user2",
    password: "user2",
    role: "user",
  },
];

const generateToken = (id, username, role) => {
  return jwt.sign({ id, username, role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

const login = async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      token: generateToken(user.id, user.username, user.role),
    });
  } else {
    res.status(401).json({ message: "invalid credentials" });
  }
};

module.exports = { login };
