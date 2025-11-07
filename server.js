const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(
  session({
    secret: "todo-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// ---------- SIGNUP ----------
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  const users = fs.existsSync("users.json")
    ? JSON.parse(fs.readFileSync("users.json", "utf8"))
    : [];

  if (users.find((u) => u.username === username)) {
    return res.json({ msg: "User already exists" });
  }

  const newUser = { id: Date.now(), username, password };
  users.push(newUser);
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
  res.json({ msg: "Signup successful" });
});

// ---------- LOGIN ----------
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = fs.existsSync("users.json")
    ? JSON.parse(fs.readFileSync("users.json", "utf8"))
    : [];

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return res.json({ msg: "Invalid credentials" });

  req.session.user = user;
  res.json({ msg: "Login successful" });
});

// ---------- VIEW TASKS ----------
app.get("/tasks", (req, res) => {
  if (!req.session.user) return res.json({ msg: "Login required" });

  const tasks = fs.existsSync("tasks.json")
    ? JSON.parse(fs.readFileSync("tasks.json", "utf8"))
    : [];

  const userTasks = tasks.filter((t) => t.userid === req.session.user.id);
  res.json(userTasks);
});

// ---------- ADD TASK ----------
app.post("/add-task", (req, res) => {
  if (!req.session.user) return res.json({ msg: "Login required" });

  const { title } = req.body;
  if (!title || title.trim() === "")
    return res.json({ msg: "Task title required" });

  const tasks = fs.existsSync("tasks.json")
    ? JSON.parse(fs.readFileSync("tasks.json", "utf8"))
    : [];

  const newTask = {
    id: Date.now(),
    userid: req.session.user.id,
    title,
    status: "pending",
  };

  tasks.push(newTask);
  fs.writeFileSync("tasks.json", JSON.stringify(tasks, null, 2));

  res.json({ msg: "Task added successfully" });
});

// ---------- COMPLETE TASK ----------
app.post("/complete-task/:id", (req, res) => {
  if (!req.session.user) return res.json({ msg: "Login required" });

  const taskId = parseInt(req.params.id);
  const tasks = fs.existsSync("tasks.json")
    ? JSON.parse(fs.readFileSync("tasks.json", "utf8"))
    : [];

  const task = tasks.find(
    (t) => t.id === taskId && t.userid === req.session.user.id
  );
  if (!task) return res.json({ msg: "Task not found" });

  task.status = "completed";
  fs.writeFileSync("tasks.json", JSON.stringify(tasks, null, 2));
  res.json({ msg: "Task marked as completed" });
});

// ---------- DELETE TASK ----------
app.delete("/delete-task/:id", (req, res) => {
  if (!req.session.user) return res.json({ msg: "Login required" });

  const taskId = parseInt(req.params.id);
  let tasks = fs.existsSync("tasks.json")
    ? JSON.parse(fs.readFileSync("tasks.json", "utf8"))
    : [];

  tasks = tasks.filter(
    (t) => !(t.id === taskId && t.userid === req.session.user.id)
  );
  fs.writeFileSync("tasks.json", JSON.stringify(tasks, null, 2));
  res.json({ msg: "Task deleted" });
});


// ---------- LOGOUT ----------
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.json({ msg: "Logged out" });
});

// ---------- SERVER ----------
app.listen(3000, () =>
  console.log("✅ Server running on http://localhost:3000")
);
