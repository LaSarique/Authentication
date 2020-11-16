const express = require("express");
const bodyParser = require("body-parser");
const sessions = require("client-sessions");
const bcrypt = require('bcryptjs');
const csurf = require("csurf");
const helmet = require("helmet");


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false }))

app.use ((req, res, next) => {
    if (!(req.session && req.session.userID)) {
        return next();
    }
    User.findById(req.session.userId, (err, user) => {
        if (err) {
            return next(err);
        }
        if(!user) {
            return next();
        }
        user.password = undefined;
        req.user = user;
        res.locals.user = user;
        next();
    });
});
app.use(helmet());

function loginRequired(req, res, next) {
    if(!req.user) {
        return res.redirect("/login");
    }
    next();
}

app.set("view engine", "pug");
app.get("/", (req, res)=> {
    res.render("index");
});
app.get("/", (req, res)=> {
    res.render("index");
});
app.use(csurf());
app.get("/register", (req, res)=> {
    res.render("register", { csrfToken: req.csrfToken() });
});
app.get("/login", (req, res)=> {
    console.log('login page?')
    res.render("login", { csrfToken: req.csrfToken() });
});

app.listen(3000);

const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://Cyberducks:cyberducks@cyberducksdb.zdljk.mongodb.net/authentication?retryWrites=true&w=majority", {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

let User = mongoose.model("User", new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}));

app.post("/register", (req, res) => {
    let hash = bcrypt.hashSync(req.body.password, 14);
    req.body.password = hash;
    let user = new User(req.body);

    user.save((err) => {
        if (err) {
            console.log(err);
            let error = "Something bad happened! Please try again.";
            if (err.code === 11000) {
                error= "that email is already taken, please try another.";
            }
            console.log('this stupid error...', err)
            return res.render("register", { error: error });
        }
        res.redirect("/dashboard");
    });
});

app.use(sessions({
    cookieName: "session",
    secret: "testingThis",
    duration: 30* 60* 1000,
    activeDuration: 5* 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true
}));


app.post("/login", (req, res) => {
    User.findOne( { email: req.body.email }, (err, user) => {
        if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
            return res.render("login", {
                error: "Incorrect email/ password."
            });
        }
        req.session.userId = user._id;
        console.log(req.session);
        console.log('where are we now?')
        res.redirect("/dashboard");
    });
});
app.get("/dashboard", loginRequired, (req, res, next)=> {
    res.render("dashboard");
});
