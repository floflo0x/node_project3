const express = require("express");

const { body, validationResult } = require("express-validator");

const request = require("request");

const crypto = require('crypto');

const btoa = require('btoa');

const router = express.Router();

const baseUrl = "https://api.h4kig.cc/api/app/connection/";

const baseUrl2 = "https://api.h4kig.cc/web_api/";

const weAuth = require("../middleware/v_auth");

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

let insertFunction = (item, item2) => {
  let options = {
    method: "POST",
    url: baseUrl + "insert.php",
    formData: {
      insert_query: item,
      select_query: item2,
    },
    withCredentials: true
  };
  return options;
};

let updateFunction = (item, item2) => {
  let options = {
    method: "POST",
    url: baseUrl + "update.php",
    formData: {
      update_query: item,
      select_query: item2,
    },
    withCredentials: true
  };
  return options;
};

let loginFunction = (item, item2) => {
  let options = {
    method: "POST",
    url: baseUrl2 + "login.php",
    formData: {
      email: item,
      password: item2,
    },
    withCredentials: true
  };
  return options;
};

let registerFunction = (item, item2, item3) => {
  let options = {
    method: "POST",
    url: baseUrl2 + "register.php",
    formData: {
      email: item,
      password: item2,
      name: item3,
    },
    withCredentials: true
  };
  return options;
};

let forgetFunction = (item, item2) => {
  let options = {
    method: "POST",
    url: baseUrl2 + "updatePass.php",
    formData: {
	    'email': item,
    	'password': item2,
  	},
    withCredentials: true
  };
  return options;
};

function qwerty() {
  const fonts = ["cursive", "sans-serif", "serif", "monospace"];

  let captchaValue = "";

  function generateCaptcha() {
    let value = btoa(Math.random() * 1000000000);
    value = value.substr(0, 5 + Math.random() * 5);
    captchaValue = value;
    return captchaValue;
  }

  function setCaptcha() {
    const abcd = captchaValue.split("").map((char) => {
      const rotate = -20 + Math.trunc(Math.random() * 30);
      const font = Math.trunc(Math.random() * fonts.length);

      // console.log(rotate, font, char);
      return {
        rotate: rotate,
        font: fonts[font],
        char: char,
      };
    });

    // console.log(abcd);
    return abcd;
  }

  const x = generateCaptcha();
  const y = setCaptcha();

  return { x, y };
}

router.post("/language", async (req, res, next) => {
  const { lang } = req.body;

  res.cookie('lang', lang, { 
    secure: true, 
    sameSite: 'none', 
    httpOnly: true 
  });

  req.session.lang = lang;

  const email = req.session.user;

  let opt1 = updateFunction(
    "update hSession set lang = '"
      .concat(`${lang}`)
      .concat("' where email = '")
      .concat(`${email}`)
      .concat("'"),
    "select * from hSession where email = '".concat(`${email}`).concat("' limit 10 offset 0")
  );

  request(opt1, async (error, response) => {
    if (error) throw new Error(error);
    else {
      let x = JSON.parse(response.body);

      // console.log(x);
      // console.log(req.session);

      const referer = req.headers.referer;

      return res.redirect(referer);
    }
  });
});

router.get("/login", async (req, res, next) => {
	try {
		const {x,y} = qwerty();

		// console.log(x,y);

		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}

		return res.render('auth/login', 
			{ 
				title: 'Login',
				lang: req.lang,
				data1: x,
				data2: y,
		    errorMessage: message,
				isAuth: false,
				cart: '0',
				oldInput: {
					email: ''
				} 
			}
		);
	}
	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
});

router.get("/register", async (req, res, next) => {
 try {
    let message = req.flash("error");
    // console.log(message);

    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    return res.render("auth/register", {
      title: "Register",
      lang: req.lang,
      errorMessage: message,
      isAuth: false,
      cart: "0",
      oldInput: {
        email: "",
        telegram: "",
      },
    });
  }
  catch(error) {
		console.log(error);
		return res.redirect("/");
	}
});

router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email Address required")
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid email or password"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password required")
      .isLength({ min: 8 })
      .withMessage("Password must be 8 characters long")
      .matches(/(?=.*?[A-Z])/)
      .withMessage("Password must have at least one Uppercase")
      .matches(/(?=.*?[a-z])/)
      .withMessage("Password must have at least one Lowercase")
      .matches(/(?=.*?[0-9])/)
      .withMessage("Password must have at least one Number")
      .matches(/(?=.*?[#?!@$%^&*-])/)
      .withMessage("Password must have at least one special character")
      .not()
      .matches(/^$|\s+/)
      .withMessage("White space not allowed"),
    body("captcha").trim().notEmpty().withMessage("Captcha required"),
  ],
  async (req, res, next) => {
    const { email, password } = req.body;

    // console.log(req.body);
    // console.log(req.session.lang);

    try {
      const { x, y } = qwerty();

      const error = validationResult(req);

      if (!error.isEmpty()) {
				// console.log(error.array());
				let msg1 = error.array()[0].msg;

				if (msg1 == 'Email Address required' && req.session.lang == 'fr') {
					msg1 = "Adresse mail: (requis";
				}
				else if (msg1 == 'Invalid email or password' && req.session.lang == 'fr') {
					msg1 = "email ou mot de passe invalide";
				}
				else if (msg1 == 'Password required' && req.session.lang == 'fr') {
					msg1 = "Mot de passe requis";
				}
				else if (msg1 == 'Password must be 8 characters long' && req.session.lang == 'fr') {
					msg1 = "Le mot de passe doit comporter 8 caractères";
				}
				else if (msg1 == 'Password must have at least one Uppercase' && req.session.lang == 'fr') {
					msg1 = "Le mot de passe doit contenir au moins une majuscule";
				}
				else if (msg1 == 'Password must have at least one Lowercase' && req.session.lang == 'fr') {
					msg1 = "Le mot de passe doit avoir au moins une minuscule";
				}
				else if (msg1 == 'Password must have at least one Number' && req.session.lang == 'fr') {
					msg1 = "Le mot de passe doit avoir au moins un numéro";
				}
				else if (msg1 == 'Password must have at least one special character' && req.session.lang == 'fr') {
					msg1 = "Le mot de passe doit contenir au moins un caractère spécial";
				}
				else if (msg1 == 'White space not allowed' && req.session.lang == 'fr') {
					msg1 = "Espace blanc non autorisé";
				}
				else {
					msg1 = error.array()[0].msg;
				}

        // console.log(msg1);

				return res.render("auth/login", 
			    { 
						title: 'Login',
			      lang: req.lang,
			      errorMessage: msg1,
			      data1: x,
						data2: y,
						isAuth: false,
						cart: '0',
			      oldInput: {
			      	email: email
			      }
			    }
			  );
			} else {
        let opt1 = loginFunction(`${email}`, `${password}`);

        request(opt1, async (error, response) => {
          if (error) throw new Error(error);
          else {
            let x = JSON.parse(response.body);

            // console.log(x, x.isSuccess);

            if (x.isSuccess == false) {
              if (req.session.lang == 'en') {
								req.flash('error', 'Invalid email or password...');
							}
							else {
								req.flash('error', 'Email ou mot de passe invalide...');
							}
              return res.redirect("/v1/login");
            } else {
              const lang = req.lang.smws.lang;

              function random() {
                let num = "";
                for (let i = 0; i < 5; i++) {
                  num += Math.floor(Math.random() * 10);
                }
                return num;
              }

              const array = [
                {
                  lang: "en",
                  msg: "Do not share it with anyone, even if they claim to work for H4KIG. This code can only be used to log in to your app. We will never ask you for it for any other purpose. If you didn't request this code while trying to log in from another device, you can ignore this message. Check spam folder in gmail.",
                },
                {
                  lang: "fr",
                  msg: "Ne le communiquez à personne, même si quelqu'un prétend être un employé de H4KIG. Ce code est uniquement destiné à être utilisé pour vous connecter à votre application. Nous ne vous le demanderons jamais pour d'autres raisons. Si vous n'avez pas demandé ce code en essayant de vous connecter depuis un autre appareil, vous pouvez ignorer ce message. Vérifiez le dossier spam dans Gmail.",
                },
              ];

              let msgBody = "";

              let rNumber = "";
              rNumber = random();
              console.log(rNumber);

              if (lang === array[1].lang) {
                msgBody = `Code de connexion : ${rNumber}. ${array[1].msg}`;
              } else if (lang === array[0].lang) {
                msgBody = `Connection Code : ${rNumber}. ${array[0].msg}`;
              }

              // console.log(msgBody);

              const opt2 = {
                method: "POST",
                url: "https://api.h4kig.cc/web_api/sendOtp.php",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                form: {
                  email: email,
                  otp: rNumber,
                  msg: msgBody,
                },
              };

              request(opt2, function (error, response) {
                if (error) throw new Error(error);
                else {
                  let y = response.body;
                  // console.log(y, typeof y);

                  if (y === "Sent") {
                    // insert otp into database

                    const opt3 = updateFunction(
                      "update ec_customers set email_verify_token = '"
                        .concat(`${rNumber}`)
                        .concat("' where email = '")
                        .concat(`${email}`)
                        .concat("'"),
                      "select * from ec_customers where email = '"
                        .concat(`${email}`)
                        .concat("' limit 10 offset 0")
                    );

                    // console.log(opt3);

                    request(opt3, (error, response) => {
                      if (error) throw new Error(error);
                      else {
                        let z = JSON.parse(response.body);
                        // console.log(z, email, res.cookie);

                        if (z.length >= 1) {
                          res.cookie("_prod_user", z[0].email, { 
                            secure: true, 
                            sameSite: "none", 
                            httpOnly: true 
                          });
                          req.session.save(err => {
                            if(!err) {
                              return res.redirect("/v1/verifyMe");
                            } else {
                              console.error('Session save error:', err);
                              res.status(500).send('Error saving session.');
                            }
                          })
                          // req.session.user = z[0].email;
                          // return res.redirect("/v1/verifyMe");
                        } else {
                          if (req.session.lang == 'en') {
										      	req.flash('error', 'Invalid email...');
										      }
										      else {
										      	req.flash('error', 'Email invalide...');
										      }
                          return res.redirect("/v1/login");
                        }
                      }
                    });
                  } else {
                    if (req.session.lang == 'en') {
							  			req.flash('error', 'Error sending OPT...');
							  		}
										else {
							  			req.flash('error', "Erreur lors de l'envoi d'OPT...");
										}
                    return res.redirect("/v1/login");
                  }
                }
              });
            }
          }
        });
      }
    } catch (error) {
      console.log(error);
      return res.redirect("/v1/login");
    }
  }
);

router.post(
  "/register",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email Address required")
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid email"),
    body("telegram").trim().notEmpty().withMessage("Name required"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password required")
      .isLength({ min: 8 })
      .withMessage("Password must be 8 characters long")
      .matches(/(?=.*?[A-Z])/)
      .withMessage("At least one Uppercase")
      .matches(/(?=.*?[a-z])/)
      .withMessage("At least one Lowercase")
      .matches(/(?=.*?[0-9])/)
      .withMessage("At least one Number")
      .matches(/(?=.*?[#?!@$%^&*-])/)
      .withMessage("At least one special character")
      .not()
      .matches(/^$|\s+/)
      .withMessage("White space not allowed"),
    body("cpassword")
      .notEmpty()
      .withMessage("Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ],
  async (req, res, next) => {
    const { email, password, cpassword, telegram } = req.body;

    // console.log(req.body);
    
    try {
			const error = validationResult(req);

      if (!error.isEmpty()) {
				// console.log(error.array());
				let msg1 = error.array()[0].msg;

				if (msg1 == 'Email Address required' && req.session.lang == 'fr') {
					msg1 = "Adresse mail: (requis";
				}
				else if (msg1 == 'Invalid email' && req.session.lang == 'fr') {
					msg1 = "Email invalide";
				}
				else if (msg1 == 'Name required' && req.session.lang == 'fr') {
					msg1 = "Nom (obligatoire";
				}
				else if (msg1 == 'Password required' && req.session.lang == 'fr') {
					msg1 = "Mot de passe requis";
				}
				else if (msg1 == 'Password must be 8 characters long' && req.session.lang == 'fr') {
					msg1 = "Le mot de passe doit comporter 8 caractères";
				}
				else if (msg1 == 'Password must have at least one Uppercase' && req.session.lang == 'fr') {
					msg1 = "Le mot de passe doit contenir au moins une majuscule";
				}
				else if (msg1 == 'Password must have at least one Lowercase' && req.session.lang == 'fr') {
					msg1 = "Le mot de passe doit avoir au moins une minuscule";
				}
				else if (msg1 == 'Password must have at least one Number' && req.session.lang == 'fr') {
					msg1 = "Le mot de passe doit avoir au moins un numéro";
				}
				else if (msg1 == 'Password must have at least one special character' && req.session.lang == 'fr') {
					msg1 = "Le mot de passe doit contenir au moins un caractère spécial";
				}
				else if (msg1 == 'White space not allowed' && req.session.lang == 'fr') {
					msg1 = "Espace blanc non autorisé";
				}
				else if (msg1 == 'Confirm password is required' && req.session.lang == 'fr') {
					msg1 = "Confirmer que le mot de passe est requis";
				}
				else {
					msg1 = error.array()[0].msg;
				}

				return res.render("auth/register", 
			    { 
						title: 'Register',
			      lang: req.lang,
			      errorMessage: msg1,
			      isAuth: false,
			      cart: '0',
			      oldInput: {
			      	email: email,
			      	telegram: telegram
			      }
			    }
			  );
			}

			else {
				let opt1 = registerFunction(
					`${email}`,
					`${password}`,
					`${telegram}`
				);

				request(opt1, async (error, response) => {
					if (error) throw new Error(error);
					else {
						let x = JSON.parse(response.body);

						// console.log(x);

						if (x.isSuccess == false) {
							if (req.session.lang == 'en') {
								req.flash('error', 'Email already exists...');
							}
							else {
								req.flash('error', "L'email existe déjà...");
							}
							return res.redirect('/v1/register');
						}

						else {
					   	const lang = req.lang.smws.lang;

							function random() {
								let num = '';
								for (let i = 0; i < 5; i++) {
								  num += Math.floor(Math.random() * 10);
								}
								return num;
							}

							const array = [
								{ lang: 'en',
									msg: "Do not share it with anyone, even if they claim to work for H4KIG. This code can only be used to log in to your app. We will never ask you for it for any other purpose. If you didn't request this code while trying to log in from another device, you can ignore this message. Check spam folder in gmail." 
								},
								{ lang: 'fr',
									msg: "Ne le communiquez à personne, même si quelqu'un prétend être un employé de H4KIG. Ce code est uniquement destiné à être utilisé pour vous connecter à votre application. Nous ne vous le demanderons jamais pour d'autres raisons. Si vous n'avez pas demandé ce code en essayant de vous connecter depuis un autre appareil, vous pouvez ignorer ce message. Vérifiez le dossier spam dans Gmail." 
								}
							];

							let msgBody = '';

							let rNumber = '';
							rNumber = random();
							console.log(rNumber);

							if (lang === array[1].lang) {
								msgBody = `Code de connexion : ${rNumber}. ${array[1].msg}`;
							}
							else if (lang === array[0].lang) {
								msgBody = `Connection Code : ${rNumber}. ${array[0].msg}`;
							}

							const opt2 = {
							  method: "POST",
                url: "https://api.h4kig.cc/web_api/sendOtp.php",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                form: {
                  email: email,
                  otp: rNumber,
                  msg: msgBody,
                },
							};

							request(opt2, function (error, response) {
								if (error) throw new Error(error);
								else {
									let y = response.body;
									// console.log(y, typeof y);

									if (y === 'Sent') {
										const opt3 = updateFunction(
										  "update ec_customers set email_verify_token = '"
										    .concat(`${rNumber}`)
										    .concat("' where email = '")
										    .concat(`${email}`)
										    .concat("'"),
										  "select * from ec_customers where email = '"
												.concat(`${email}`)
												.concat("' limit 10 offset 0")
										)

										// console.log(opt3);

										request(opt3, (error, response) => {
										  if (error) throw new Error(error);
											else {
											  let z = JSON.parse(response.body);

											  // console.log(z);

											  if (z.length >= 1) {
                          // const sessionId = crypto.randomUUID();
                          // req.session.sessionId = sessionId;
                          req.session.user = z[0].email;
                          // res.cookie("_prod_sessionId", sessionId, { 
                          //   secure: true, 
                          //   sameSite: "none", 
                          //   httpOnly: true 
                          // });
                          res.cookie("_prod_user", z[0].email, { 
                            secure: true, 
                            sameSite: "none", 
                            httpOnly: true 
                          });
                          req.session.save(err => {
                            if(!err) {
                              return res.redirect("/v1/verifyMe");
                            } else {
                              console.error('Session save error:', err);
                              res.status(500).send('Error saving session.');
                            }
                          })
											  }
											  else {
											  	if (req.session.lang == 'en') {
											   		req.flash('error', 'Invalid email...');
											  	}
											  	else {
											  		req.flash('error', "Email invalide...");
											  	}
													return res.redirect("/v1/register");
											  }
											}
										})
									}

									else {
										if (req.session.lang == 'en') {
							  			req.flash('error', 'Error sending OPT...');
										}
										else {
							  			req.flash('error', "Erreur lors de l'envoi d'OPT...");
										}
										return res.redirect("/v1/register");
							  	}
								}
							})
						}
					}
				})
			}
		}

		catch(error) {
			console.log(error);
			return res.redirect("/v1/register");
		}
  }
);

router.get("/verifyMe", async (req, res, next) => {
 try {
    let message = req.flash("error");
    // console.log(message);

    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    return res.render("auth/verify", {
      title: "VerifyMe",
      lang: req.lang,
      errorMessage: message,
      isAuth: false,
      cart: "0",
      oldInput: {
        number: "",
      },
    });
 }
 	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
});

router.post(
  "/verifyMe",
  weAuth,
  [
    body("number")
      .trim()
      .notEmpty()
      .withMessage("OTP required")
      .isLength({ max: 5 })
      .withMessage("contains 5 numbers only")
      .matches(/^[0-9]+$/)
      .withMessage("must be a valid otp"),
  ],
  async (req, res, next) => {
		const otp = req.body.number;
		// console.log(otp);

	  try {
			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array());
				let msg1 = error.array()[0].msg;

				if (msg1 == 'OTP required' && req.session.lang == 'fr') {
					msg1 = "OTP requis";
				}
				else if (msg1 == 'contains 5 numbers only' && req.session.lang == 'fr') {
					msg1 = "contient seulement 5 chiffres";
				}
				else if (msg1 == 'must be a valid otp' && req.session.lang == 'fr') {
					msg1 = "doit être un OTP valide";
				}
				else {
					msg1 = error.array()[0].msg;
				}

				return res.render('auth/verify', 
					{ 
						title: 'VerifyMe',
						lang: req.lang,
			      errorMessage: msg1,
			      isAuth: false,
			      cart: '0',
						oldInput: {
							number: otp
						} 
					}
				)
			}

			else {
			  const email = req.user.email;
				const lang = req.session.lang;
				// console.log(req.session.user == '');
				
				let opt1 = selectFunction(
					"select email_verify_token from ec_customers where email = '"
						.concat(`${email}`)
						.concat("' limit 10 offset 0")
				);

				request(opt1, (error, response) => {
					if (error) throw new Error(error);
					else {
						let x = JSON.parse(response.body);

						// console.log(x);

						if (x.length >= 1) {
							const number = x[0].email_verify_token;

							const currentDate = new Date();

							const subDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

							// console.log(subDate);

							// console.log(typeof otp, typeof number, Number(number) == Number(otp));

							if (number !== null && number !== '' && Number(number) == Number(otp)) {
								let opt2 = updateFunction(
									"update ec_customers set email_verify_token = 'null', status = 'activated', confirmed_at = '"
										.concat(`${subDate}`)
										.concat("' where email = '")
                    .concat(`${email}`)
                    .concat("'"),
                  "select * from ec_customers where email = '"
                    .concat(`${email}`)
                    .concat("' limit 10 offset 0")
								);

								request(opt2, (error, response) => {
									if (error) throw new Error(error);
									else {
										let y = JSON.parse(response.body);

										// console.log(y, email, lang);

										if (y.length >= 1) {
											let values2 = `\'${email}\', \'true\', \'${lang}\'`;

								    	let opt3 = insertFunction(
								    		"insert into hSession (email, isLoggedIn, lang) values ("
								    		.concat(`${values2}`)
								    		.concat(")"),
								    		"select * from hSession where email = '"
								    		.concat(`${email}`)
								    		.concat("' limit 10 offset 0")
								    	);

								    	request(opt3, (error, response) => {
								    		if (error) throw new Error(error);
												else {
													let z = JSON.parse(response.body);
													// console.log(z);

													// res.cookie('isLoggedIn', true, { maxAge: 365 * 24 * 60 * 60 * 1000 });										      	
													
													// req.session.user = email;
                          const sessionId = crypto.randomUUID();
                          req.session.sessionId = sessionId;
                          res.cookie("_prod_sessionId", sessionId, { 
                            secure: true, 
                            sameSite: "none", 
                            httpOnly: true 
                          });
                          const csrfToken = crypto.randomUUID();
                          req.session.prodToken = csrfToken;
													req.session.isLoggedIn = true;
                          res.cookie("_prod_logIn", true, { 
                            secure: true, 
                            sameSite: "none", 
                            httpOnly: true 
                          });
                          res.cookie("_prod_token", csrfToken, { 
                            secure: true, 
                            sameSite: "none", 
                            httpOnly: true 
                          });
                          req.session.save(err => {
                            if(!err) {
                              let opt4 = updateFunction(
                                "update ec_customers set remember_token = '"
                                  .concat(`${csrfToken}`)
                                  .concat("' where email = '")
                                  .concat(`${email}`)
                                  .concat("'"),
                                "select * from ec_customers where email = '"
                                  .concat(`${email}`)
                                  .concat("' limit 10 offset 0")
                              );

                              request(opt4, (error, response) => {
                                if (error) throw new Error(error);
                                else {
                                  let z1 = JSON.parse(response.body);

                                  if (z1.length >= 1) {
                                    return res.redirect("/");
                                  }
                                   else {
                                    console.error('Session save error:', err);
                                    return res.redirect("/v1/verifyMe");
                                  }
                                }
                              })
                            } else {
                              console.error('Session save error:', err);
                              res.status(500).send('Error saving session.');
                            }
                          })
													// req.session.lang = lang;
												}
								    	})
										}

										else {
			                if (req.session.lang == 'en') {
												req.flash('error', 'Failed to update otp...');
											}
											else {
												req.flash('error', "Échec de la mise à jour d'OTP...");
											}
											return res.redirect("/v1/verifyMe");
										}
									}
								})
							}

							else {
			          if (req.session.lang == 'en') {
									req.flash('error', 'Invalid OTP, Try Again...');
								}
								else {
									req.flash('error', "OTP invalide, réessayez...");
								}
								return res.redirect("/v1/verifyMe");
							}
						}

						else {
			        if (req.session.lang == 'en') {
								req.flash('error', 'Invalid OTP, Try Again...');
							}
							else {
								req.flash('error', "OTP invalide, réessayez...");
							}
							return res.redirect("/v1/verifyMe");
						}
					}
				})
			}
		}
      
		catch(error) {
			if (req.session.lang == 'en') {
				req.flash('error', 'Invalid OTP, Try Again...');
			}
			else {
				req.flash('error', "OTP invalide, réessayez...");
			} 
			return res.redirect("/v1/verifyMe");
		}
	}
);

router.get("/forgetPassword", async (req, res, next) => {
	try {
		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}

		return res.render("user/forgetPassword", 
			{ 
				title: 'Forget Password',
				lang: req.lang,
		    errorMessage: message,
				isAuth: false,
				cart: '0',
				isOTP: false,
				isPass: false,
				action: "/v1/authEmail",
				oldInput: {
					email: ''
				} 
			}
		)
	}
	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.post("/authEmail",
	[
	  body('email')
			.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email')
	],
	async (req, res, next) => {
		try {
			const { email } = req.body;

			// console.log(email);

			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array());
				let msg1 = error.array()[0].msg;

				if (msg1 == 'Email Address required' && req.session.lang == 'fr') {
					msg1 = "Adresse mail: (requis";
				}
				else if (msg1 == 'Invalid email' && req.session.lang == 'fr') {
					msg1 = "Email invalide";
				}
				else {
					msg1 = error.array()[0].msg;
				}

				return res.render("user/forgetPassword", 
					{ 
						title: 'Forget Password',
						lang: req.lang,
				    errorMessage: msg1,
						isAuth: false,
						isOTP: false,
				    isPass: false,
						action: "/v1/authEmail",
						cart: '0',
						oldInput: {
							email: email
						} 
					}
				)
			}

			else {
				let opt1 = selectFunction(
					"select * from ec_customers where email = '"
						.concat(`${email}`)
						.concat("' limit 10 offset 0")
				);

				request(opt1, async (error, response) => {
					if (error) throw new Error(error);
					else {
						let x = await JSON.parse(response.body);

						// console.log(x);

						if (x.length >= 1) {
							const lang = req.lang.smws.lang;

							function random() {
								let num = '';
								for (let i = 0; i < 5; i++) {
								  num += Math.floor(Math.random() * 10);
								}
								return num;
							}

							const array = [
								{ lang: 'en',
									msg: "Do not share it with anyone, even if they claim to work for H4KIG. This code can only be used to log in to your app. We will never ask you for it for any other purpose. If you didn't request this code while trying to log in from another device, you can ignore this message. Check spam folder in gmail." 
								},
								{ lang: 'fr',
									msg: "Ne le communiquez à personne, même si quelqu'un prétend être un employé de H4KIG. Ce code est uniquement destiné à être utilisé pour vous connecter à votre application. Nous ne vous le demanderons jamais pour d'autres raisons. Si vous n'avez pas demandé ce code en essayant de vous connecter depuis un autre appareil, vous pouvez ignorer ce message. Vérifiez le dossier spam dans Gmail." 
								}
							];

							let msgBody = '';

							let rNumber = '';
							rNumber = random();
							// console.log(rNumber);

							if (lang === array[1].lang) {
								msgBody = `Code de connexion : ${rNumber}. ${array[1].msg}`;
							}
							else if (lang === array[0].lang) {
								msgBody = `Connection Code : ${rNumber}. ${array[0].msg}`;
							}

							const opt2 = {
							  method: "POST",
                url: "https://api.h4kig.cc/web_api/sendOtp.php",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                form: {
                  email: email,
                  otp: rNumber,
                  msg: msgBody,
                },
							};

							request(opt2, function (error, response) {
								if (error) throw new Error(error);
								else {
									let y = response.body;
									// console.log(y, typeof y);

									if (y === 'Sent') {
										const opt3 = updateFunction(
										  "update ec_customers set email_verify_token = '"
										    .concat(`${rNumber}`)
										    .concat("' where email = '")
										    .concat(`${email}`)
										    .concat("'"),
										  "select * from ec_customers where email = '"
												.concat(`${email}`)
												.concat("' limit 10 offset 0")
										)

										request(opt3, (error, response) => {
										  if (error) throw new Error(error);
											else {
											  let z = JSON.parse(response.body);

											  // console.log(z);

											  if (z.length >= 1) {
											  	res.cookie('fp1', email, { 
                            secure: true, 
                            sameSite: 'none', 
                            httpOnly: true 
                          });										      	
													
													req.session.fp1 = email;
											   	return res.render("user/forgetPassword", 
														{ 
															title: 'Forget Password',
															lang: req.lang,
													    errorMessage: '',
															isAuth: false,
															isOTP: true,
													    isPass: false,
													    action: "/v1/authOTP",
															cart: '0',
															oldInput: {
																email: email
															} 
														}
													)
											  }
											  else {
											  	if (req.session.lang == 'en') {
											   		req.flash('error', 'Invalid email...');
											  	}
											  	else {
											  		req.flash('error', "Email invalide...");
											  	}
													return res.redirect("/v1/forgetPassword");
											  }
											}
										})
									}

									else {
										if (req.session.lang == 'en') {
							  			req.flash('error', 'Error sending OPT...');
										}
										else {
							  			req.flash('error', "Erreur lors de l'envoi d'OPT...");
										}
										return res.redirect("/v1/forgetPassword");
							  	}
								}
							})
						}

						else {
							if (req.session.lang == 'en') {
								req.flash('error', 'Invalid email...');
							}
							else {
								req.flash('error', 'Email invalide...');
							}
							return res.redirect("/v1/forgetPassword");
						}
					}
				})
			}
		}
		catch(error) {
			console.log(error);
			return res.redirect("/");
		}
})

router.post("/authOTP",
	[
		body('number')
			.trim()
			.notEmpty()
			.withMessage('OTP required')
			.isLength({max: 5, min: 5})
			.withMessage('contains 5 numbers only')
			.matches(/^[0-9]+$/)
			.withMessage('must be a valid otp'),
	],
 	async (req, res, next) => {
		try {
			const otp = req.body.number;

			// console.log(otp);

			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array());
				let msg1 = error.array()[0].msg;

				if (msg1 == 'OTP required' && req.session.lang == 'fr') {
					msg1 = "OTP requis";
				}
				else if (msg1 == 'contains 5 numbers only' && req.session.lang == 'fr') {
					msg1 = "contient seulement 5 chiffres";
				}
				else if (msg1 == 'must be a valid otp' && req.session.lang == 'fr') {
					msg1 = "doit être un OTP valide";
				}
				else {
					msg1 = error.array()[0].msg;
				}

				return res.render('user/forgetPassword', 
					{ 
						title: 'Forget Password',
						lang: req.lang,
			      errorMessage: msg1,
			      isAuth: false,
			      isOTP: true,
						isPass: false,
						action: "/v1/authOTP",
			      cart: '0',
						oldInput: {
							email: req.session.fp1
						} 
					}
				)
			}

			else {
				const email = req.user.email;
				// console.log(req.session.user == '');
				// console.log(email);
				
				let opt1 = selectFunction(
					"select email_verify_token from ec_customers where email = '"
						.concat(`${email}`)
						.concat("' limit 10 offset 0")
				);

				request(opt1, (error, response) => {
					if (error) throw new Error(error);
					else {
						let x = JSON.parse(response.body);

						// console.log(x);

						if (x.length >= 1) {
							const number = x[0].email_verify_token;

							const currentDate = new Date();

							const subDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

							// console.log(subDate);

							// console.log(typeof otp, typeof number, Number(number) == Number(otp));

							if (number !== null && number !== '' && Number(number) == Number(otp)) {
								let opt2 = updateFunction(
									"update ec_customers set email_verify_token = 'null', status = 'activated', confirmed_at = '"
										.concat(`${subDate}`)
										.concat("' where email = '")
                    .concat(`${email}`)
                    .concat("'"),
                  "select * from ec_customers where email = '"
                    .concat(`${email}`)
                    .concat("' limit 10 offset 0")
								);

								request(opt2, (error, response) => {
									if (error) throw new Error(error);
									else {
										let y = JSON.parse(response.body);

										return res.render("user/forgetPassword", 
											{ 
												title: 'Forget Password',
												lang: req.lang,
										    errorMessage: '',
												isAuth: false,
												isOTP: false,
										    isPass: true,
						            action: "/v1/forgetPassword",
												cart: '0',
												oldInput: {
													email: email
												} 
											}
										)
									}
								})
							}

							else {
								return res.redirect("/v1/forgetPassword");
							}
						}

						else {
							return res.redirect("/v1/forgetPassword");
						}
					}
				})
			}
		}
		catch(error) {
			console.log(error);
			return res.redirect("/");
		}
})

router.post("/forgetPassword",
	[
		body('password')
			.trim()
			.notEmpty()
			.withMessage('Password required')
			.isLength({min: 8})
			.withMessage('Password must be 8 characters long')
			.matches(/(?=.*?[A-Z])/).withMessage('At least one Uppercase')
  		.matches(/(?=.*?[a-z])/).withMessage('At least one Lowercase')
  		.matches(/(?=.*?[0-9])/).withMessage('At least one Number')
  		.matches(/(?=.*?[#?!@$%^&*-])/).withMessage('At least one special character')
  		.not().matches(/^$|\s+/).withMessage('White space not allowed'),
	  body('cpassword')
	  	.notEmpty()
		  .withMessage('Confirm password is required')
		  .custom((value, { req }) => {
		    if (value !== req.body.password) {
		      throw new Error('Passwords do not match');
		    }
		    return true;
			}),
	],
 	async (req, res, next) => {
  	try {
  		const { password } = req.body;
  		const email = req.session.fp1;
  		// console.log(req.body, email);

  		const error = validationResult(req);

  		if (!error.isEmpty()) {
  				// console.log(error.array());
  				let msg1 = error.array()[0].msg;

  				if (msg1 == 'Password required' && req.session.lang == 'fr') {
  					msg1 = "Mot de passe requis";
  				}
  				else if (msg1 == 'Password must be 8 characters long' && req.session.lang == 'fr') {
  					msg1 = "Le mot de passe doit comporter 8 caractères";
  				}
  				else if (msg1 == 'Password must have at least one Uppercase' && req.session.lang == 'fr') {
  					msg1 = "Le mot de passe doit contenir au moins une majuscule";
  				}
  				else if (msg1 == 'Password must have at least one Lowercase' && req.session.lang == 'fr') {
  					msg1 = "Le mot de passe doit avoir au moins une minuscule";
  				}
  				else if (msg1 == 'Password must have at least one Number' && req.session.lang == 'fr') {
  					msg1 = "Le mot de passe doit avoir au moins un numéro";
  				}
  				else if (msg1 == 'Password must have at least one special character' && req.session.lang == 'fr') {
  					msg1 = "Le mot de passe doit contenir au moins un caractère spécial";
  				}
  				else if (msg1 == 'White space not allowed' && req.session.lang == 'fr') {
  					msg1 = "Espace blanc non autorisé";
  				}
  				else if (msg1 == 'Confirm password is required' && req.session.lang == 'fr') {
  					msg1 = "Confirmer que le mot de passe est requis";
  				}
  				else {
  					msg1 = error.array()[0].msg;
  				}

  			return res.render('user/forgetPassword', 
  					{ 
  						title: 'Forget Password',
  						lang: req.lang,
  			      errorMessage: msg1,
  			      isAuth: false,
  			      isOTP: false,
  						isPass: true,
  						action: "/v1/forgetPassword",
  			      cart: '0',
  						oldInput: {
  							email: req.session.fp1,
  						} 
  					}
  			)
  		}

  		else {
  			let opt1 = forgetFunction(
  				`${email}`,
  				`${password}`
  			);

  			request(opt1, async (error, response) => {
  				if (error) throw new Error(error);
  				else {
  					let x = await JSON.parse(response.body);

  					if (x.length >= 1) {
  					    // console.log(err);
  					    res.clearCookie('fp1');
  					    return res.redirect("/v1/login");
  					}

  					else {
  						if (req.session.lang == 'en') {
  							req.flash('error', 'Invalid email...');
  						}
  						else {
  							req.flash('error', 'Email invalide...');
  						}
  						return res.redirect("/v1/forgetPassword");
  					}
  				}
  			})
  		}
  	}
  	catch(error) {
  		console.log(error);
  		return res.redirect("/");
  	}
})

router.get("/logout", async (req, res, next) => {
  req.session.destroy((err) => {
    // console.log(err);
    res.clearCookie('lang');
    res.clearCookie("_prod_sessionId");
    res.clearCookie("_prod_user");
    res.clearCookie("_prod_logIn");
    res.clearCookie("_prod_token");
    return res.redirect("/");
  });
});

module.exports = router;
