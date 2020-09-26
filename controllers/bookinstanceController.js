let BookInstance = require('../models/bookinstance');
let Book = require('../models/book');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const async = require('async');

exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate('book')
        .exec((err, list_bookinstances) => {
            if (err) return next(err);
            res.render('bookinstance_list', { title: 'Book Instance list', bookinstance_list: list_bookinstances })
        });
};

exports.bookinstance_detail = (req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, book_instance) => {
            if (err) return next(err);
            if (book_instance == null) {
                let err = new Error('Book-instance not found');
                err.status = 404;
                return next(err);
            }
            res.render('bookinstance_detail', { title: 'Copy: '+book_instance.book.title, book_instance: book_instance });
        });    
};

exports.bookinstance_create_get = (req, res, next) => {
    Book.find({}, 'title')
        .exec((err, books) => {
            if (err) return next(err);
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
        });
};

exports.bookinstance_create_post = [
    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        let bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec((err, books) => {
                    if (err) return next(err);
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance })
                });
            return;
        } else {
            bookinstance.save((err) => {
                if (err) return next(err);
                res.redirect(bookinstance.url);
            });
        };
    }
];

exports.bookinstance_delete_get = (req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, bookinstance) => {
            if (err) { return next(err); };
            if (bookinstance == null) { 
                res.redirect('/catalogs/bookinstances');
            };
            res.render('bookinstance_delete', { title: 'Delete Book-instance', bookinstance: bookinstance});
        });    
};

exports.bookinstance_delete_post = (req, res) => {
    BookInstance.findByIdAndRemove(req.body.id, (err) => {
        if (err) return next(err);
        res.redirect('/catalog/bookinstances');
    });
};

exports.bookinstance_update_get = (req, res, next) => {
    async.parallel({
        bookinstance: (callback) => {
            BookInstance.findById(req.params.id)
                .populate('book')
                .exec(callback);
        },
        books: (callback) => {
            Book.find(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.bookinstance == null) {
            let error = new Error('Book copy not found');
            error.status = 404;
            return next(error);
        }
        res.render('bookinstance_form', { title: 'Update Book-instance', bookinstance: results.bookinstance, book_list: results.books, selected_book: results.bookinstance.book._id })
    })
};

exports.bookinstance_update_post = [
    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    sanitizeBody('*').escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        let bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec((err, books) => {
                    if (err) return next(err);
                    res.render('bookinstance_form', { title: 'Update Book-instance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance })
                });
            return;
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thebookinstance) => {
                if (err) return next(err);
                res.redirect(thebookinstance.url);
            });
        };
    }
];