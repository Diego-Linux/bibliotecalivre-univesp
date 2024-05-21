exports.isUser = (req, res, next) => {
    if (req.session.userId) next();
    else res.redirect('/login');
}

exports.notUser = (req, res, next) => {
    if (!req.session.userId) next();
    else res.redirect('/');
}

exports.isAdmin = (req, res, next) => {
    if (req.session.isAdmin) next();
    else res.redirect('/book');
}


