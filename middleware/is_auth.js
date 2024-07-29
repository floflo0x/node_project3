module.exports = (req, res, next) => {
    // console.log(req.user?.remember_token, req.session.prodToken, !(req.session.prodToken === req.user?.remember_token));
    // console.log(req.session.isLoggedIn, !req.session.isLoggedIn, req.session.isLoggedIn == 'false');
    if(req.session.isLoggedIn == 'false' && !(req.session.prodToken === req.user?.remember_token)) {
        return res.redirect("/v1/login");
      // return next();
    }
    else return next();
}