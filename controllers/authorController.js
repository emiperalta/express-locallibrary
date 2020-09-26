let Author = require('../models/author');
let Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.author_list = (req, res, next) => {    
    Author.find()
        .populate('author')
        .sort([['family_name', 'ascending']])
        .exec((err, list_authors) => {
            if (err) return next(err);
            res.render('author_list', { title: 'Author list', author_list: list_authors });
        });
};

exports.author_detail = (req, res, next) => {
    async.parallel({
        author: (callback) => {
            Author.findById(req.params.id).exec(callback);                
        },
        authors_books: (callback) => {
            Book.find({ 'author': req.params.id }, 'title summary').exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.author == null) {
            let err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render('author_detail', { title: 'Author detail', author: results.author, author_books: results.authors_books });
    });
};

exports.author_create_get = (req, res) => {
    res.render('author_form', { title: 'Create Author' });
};

exports.author_create_post = [
    body('first_name').isLength({ min: 1, max: 100 }).trim().withMessage('First name must be specified.'),
    body('family_name').isLength({  min: 1, max: 100 }).trim().withMessage('Family name must be specified.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(), 

    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),   

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render('author_form', { title: 'Create author', author: req.body, errors: errors.array() });
            return;
        } else {
            let author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            });

            author.save((err) => {
                if (err) return next(err);
                res.redirect(author.url);
            });
        };
    }
];

exports.author_detele_get = (req, res, next) => {
    async.parallel({
        author: (callback) => {
            Author.findById(req.params.id).exec(callback);
        },
        authors_books: (callback) => {
            Book.find({ 'author': req.params.id }).exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.author == null) {
            res.redirect('/catalog/authors');
        };
        res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books });
    });
};

exports.author_delete_post = (req, res, next) => {
    async.parallel({
        author: (callback) => {
            Author.findById(req.body.authorid).exec(callback);
        },
        authors_books: (callback) => {
            Book.find({ 'author': req.body.authorid }).exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.authors_books.length > 0) {
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: authors_books });
            return next();
        } else {
            Author.findByIdAndRemove(req.body.authorid, (err) => {
                if (err) return next(err);
                res.redirect('/catalog/authors');
            });
        };
    })
};

exports.author_update_get = (req, res, next) => {
    Author.findById(req.params.id, (err, author) => {
            if (err) return next(err);
            if (author == null) {
                let error = new Error('Author not found');
                error.status = 404;
                return next(error);
            }
            res.render('author_form', { title: 'Update Author', author: author});
        });
};

exports.author_update_post = [
    body('first_name').isLength({ min: 1, max: 100 }).trim().withMessage('First name must be specified.'),
    body('family_name').isLength({  min: 1, max: 100 }).trim().withMessage('Family name must be specified.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(), 

    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),
    
    (req, res, next) => {
        const errors = validationResult(req);

        let author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            res.render('author_form', { title: 'Update author', author: author, errors: errors.array() });
            return;
        } else {
            Author.findByIdAndUpdate(req.params.id, author, {}, (err, theauthor) => {
                if (err) return next(err);
                res.redirect(theauthor.url);
            });
        };
    }
];
