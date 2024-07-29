if(process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const express = require('express');

const cookieParser = require('cookie-parser');

const session = require('express-session');

const flash = require('connect-flash');

const crypto = require('crypto');

const cors = require('cors');

const authRoute = require('./routes/auth');

const userRoute = require('./routes/user');

const request = require('request');

const path = require('path');

const app = express();

app.set("view engine", "ejs");

app.set("views", "views");

const baseUrl = "https://api.h4kig.cc/api/app/connection/";

let selectFunction = (item) => {
  let options = {
    method: "POST",
    url: baseUrl + "select.php",
    formData: {
      select_query: item,
    },
    withCredentials: true
  };
  return options;
};

app.use(cors({ origin: "http://127.0.0.1:3000", credentials: true }));

app.use(cookieParser());

app.use(session({
  secret: 'Abcd@1234#',
  resave: false,
  saveUninitialized: false, // Better practice to set this to false for security
  cookie: { secure: true, sameSite: 'none', httpOnly: true },
}));

app.use((req, res, next) => {
  req.session.lang = req.session.lang || req.cookies.lang || 'fr';
  req.session.user = req.session.user || req.cookies._prod_user || '';
  req.session.isLoggedIn = req.session.isLoggedIn || req.cookies._prod_logIn || 'false';
  req.session.prodToken = req.session.prodToken || req.cookies._prod_token || '';
  next();
});

// Middleware to load language based on the session
app.use((req, res, next) => {
  const lang = req.session.lang;
  req.lang = require(`./languages/${lang}.json`);
  next();
});

app.use((req, res, next) => {
  // console.log(res.Cookie);
  if (!req.session.user) {
    return next();
  }

  else {
    let opt1 = selectFunction(
      "select * from ec_customers where email = '"
      .concat(`${req.session.user}`)
      .concat("' limit 10 offset 0")
    );

    request(opt1, async (error, response) => {
      if (error) throw new Error(error);
      else {
        let x = JSON.parse(response.body);
        // console.log(x, req.session.isLoggedIn);

        if (x.length >= 1) {
          req.user = x[0];
          res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
          return next();
        }

        else {
          console.log("error");
        }
      }
    })
  }
})

app.use(flash());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/v1", authRoute);
app.use(userRoute);

app.listen(3000, () => {
  console.log("Listening to localhost PORT 3000......");
})
