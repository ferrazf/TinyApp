const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

var urlDatabase = {
    "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
    "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" },
    "3F5j7S": { longURL: "http://www.paypal.com", userID: "test" },
    "sfjf2D": { longURL: "http://www.gmail.com", userID: "test" },
    "G4jI9S": { longURL: "http://www.github.com", userID: "test" },
    "3m9d6c": { longURL: "http://www.trello.com", userID: "test" }
};

const users = {
    userRandomID: {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur"
    },
    user2RandomID: {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk"
    },
    test: {
        id: "test",
        email: "test@test.test",
        password: "test"
    }
};

app.get("/", (req, res) => {
    res.send("Hello!");
});

//Return user object matching email and password provided
function retrieveUserByEmailPass(email, password, userdb) {
  for (var key in userdb) {
    if (users[key].email == email && users[key].password == password) {
      return users[key].id;
    }
  }
}

//Generate a new random 6-digit string for short URLs
function generateRandomString(length) {
    let str = "";
    let characters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < length; i++) {
        let randomNum = Math.floor(Math.random() * characters.length);
        str += characters[randomNum];
    }
    return str;
}

//Check if a user exists in users database
function checkUsrExists(email, userdb) {
    for (var key in userdb) {
        if (users[key].email == email) {
            return true;
        }
    }
}

// Handle POST registration requests
app.post("/register", (req, res) => {
    let usrIDStr = generateRandomString(8);
    let eml = req.body.email;
    let pwd = req.body.password;
    let insertObj = {};

    if (!eml || !pwd) {
        res.body.render("You must specify an email and password!")
        res.redirect("/register");
    }
    if (checkUsrExists(eml, users)) {
      res.status(400).send("The specified user ID already exists!");
      return;
    }

    insertObj = {
        id: usrIDStr,
        email: eml,
        password: pwd
    };

    users[usrIDStr] = insertObj;
    //console.log("insertObj = ", insertObj);
    res.cookie("user_id", usrIDStr);

    res.redirect("/urls");
});

// Handle POST login requests
app.post("/login", (req, res) => {
    let eml = req.body.email;
    let pwd = req.body.password;
    let usrId = retrieveUserByEmailPass(eml, pwd, users);

    if (!eml || !pwd || !usrId) {
      res.status(400).send("Invalid login credentials!");
      return;
    }
    if (!checkUsrExists(eml, users)) {
      res.status(400).send("The specified user does not exist!");
      return;
    }
    res.cookie("user_id", usrId);
    res.redirect("/urls");
});

// Handle POST logout requests
app.post("/logout", (req, res) => {
    res.clearCookie("user_id");
    res.redirect("/login");
});

// Handle POST requests for adding URLs
app.post("/urls", (req, res) => {
    let postURL = req.body.longURL;0
    let ranStr = generateRandomString(6);
    let usrID = req.cookies.user_id;
    urlDatabase[ranStr] = { "longURL": postURL, "userID": usrID };
    res.redirect("/urls");
});

// Handle POST requests for updating URLs
app.post("/urls/:id", (req, res) => {
    if (urlDatabase[req.params.id]) {
        urlDatabase[req.params.id].longURL = req.body.updateURL;
    }
    res.redirect("/urls");
});

// Handle POST requests for deleting URLs
app.post("/urls/:shortURL/delete", (req, res) => {
    if (req.params.shortURL && urlDatabase[req.params.shortURL])
        delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
});

// Show user registration page
app.get("/register", (req, res) => {
    res.render("urls_register");
});

// Show login page
app.get("/login", (req, res) => {
    res.render("urls_login");
});

// Show Initial/Index page
app.get("/urls", (req, res) => {
    let templateVars = {
        usrObj: users[req.cookies.user_id],
        urls: urlDatabase
    };

    if (!templateVars.usrObj) {
      res.redirect("urls_login");
      return;
    }
    res.render("urls_index", templateVars);
});

// Show form to add a new TinyURL
app.get("/urls/new", (req, res) => {
    let templateVars = {
        usrObj: users[req.cookies.user_id]
    };

    if (!templateVars.usrObj) {
        res.redirect("urls_login");
        return;
    }

    res.render("urls_new", templateVars);
});

// Get a shortURL by id
app.get("/urls/:shortURL", (req, res) => {
    let templateVars = {
        usrObj: users[req.cookies.user_id],
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL
    };

    if (!templateVars.usrObj) {
        res.redirect("urls_login");
        return;
    }
    res.render("urls_show", templateVars);
});

//Handle short URL requests /u/imageid
app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL];
    if (longURL) res.redirect(longURL);
    else {
        let templateVars = {
            shortURL: req.params.shortURL,
            longURL: undefined
        };
        res.render("urls_show", templateVars);
    }
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});