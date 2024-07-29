module.exports = (req, res, next) => {
    // console.log(req.session.user, !req.session.user, req.session.user);
    if(!req.session.user) {
        return res.redirect("/v1/login");
      // return next();
    }
    else return next();
}