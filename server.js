// Requerir dotenv al principio del archivo
require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const app = express();

// importing the dotenv module to use environment variables:
require("dotenv").config();

mongoose.connect('mongodb://127.0.0.1/login', { useNewUrlParser: true, useUnifiedTopology: true });

// ------------ Imports & necessary things here ------------

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: 'bBWV&L5HddjLzU4i@cUN', resave: true, saveUninitialized: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

const authKey = process.env.KEY || "0b3CitWx779qo1t1RDEvIQeyxYr2Ur"

const userSchema = new mongoose.Schema({
  number: String,
  password: String,
  code: String
});

const User = mongoose.model('User', userSchema);

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        if (token === authKey) {
            next();
            return;
        }
    }

    res.status(401).json({ error: 'Unauthorized' });
};

app.get("/", (req, res) => {
  res.redirect('/login');
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { number, password } = req.body;

  try {
    const user = await User.findOne({ number: `888${number}` });

    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.number = req.session.number = `888${number}`;        ;
        res.redirect('/code');
      } else {
        res.redirect('/login');
      }
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post("/register", async (req, res) => {
  const number = generarNumeroAleatorio();
  const { password, password2 } = req.body;

  if (password == password2) {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = new User({ number: `888${number}`, password: hashedPassword, code: null });
      await user.save();

      req.session.number = `888${number}`;

      res.redirect('/code');
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.send('Don't leave empty fields');
  }
});

app.get('/code', async (req, res) => {
  const number = req.session.number;

  try {
    const user = await User.findOne({ number: number });

    if (user) {
      res.render('code', { number: user.number, code: user.code });
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    res.redirect('/login');
  }
});

app.post("/api/send", authenticate, async (req, res) => {
  const { number, message } = req.body;

  const code = message.match(/\d+/)[0];

  try {
    const user = await User.findOne({ number });

    if (user) {
      user.code = code;
      await user.save();
      res.status(200).json({ success: true, message: "Code sended sucessfully" });
    } else {
      res.status(404).json({ success: false, message: "User not fount" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Error sending the code" });
  }
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Server listening on port: ${port}!`);
});

function generarNumeroAleatorio() {
  const min = 10000000;
  const max = 99999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
