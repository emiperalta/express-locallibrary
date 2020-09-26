let Book = require('../models/book');
let Author = require('../models/author');
let Genre = require('../models/genre');
let BookInstance = require('../models/bookinstance');
const async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.index = (req, res) => {
    
    async.parallel({
        book_count: (callback) => {
            Book.countDocuments({}, callback);
        },
        bookInstance_count: (callback) => {
            BookInstance.countDocuments({}, callback);
        },
        bookInstance_available_count: (callback) => {
            BookInstance.countDocuments({ status: 'Available' }, callback);
        },
        author_count: (callback) => {
            Author.countDocuments({}, callback);
        },
        genre_count: (callback) => {
            Genre.countDocuments({}, callback);
        }
    }, (err, results) => {
        if (err) return console.log(err);
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

exports.book_list = (req, res, next) => {
    Book.find({}, 'title author')
        .populate('author')
        .exec((err, list_books) => {
            if (err) return next(err);
            res.render('book_list', { title: 'Book list', book_list: list_books });
        });
};

exports.book_detail = (req, res, next) => {
    async.parallel({
        book: (callback) => {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        book_instance: (callback) => {
            BookInstance.find({ 'book': req.params.id }).exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.book == null) {
            let err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance });
    });
};

exports.book_create_get = (req, res, next) => {
    async.parallel({
        authors: (callback) => {
            Author.find(callback);
        },
        genres: (callback) => {
            Genre.find(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
    });
};

exports.book_create_post = [
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre ==='undefined') 
                req.body.genre = [];
            else 
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    body('title', 'Title must not be empty').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),    

    sanitizeBody('*').escape(),
    sanitizeBody('genre.*').escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        let book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });

        if (!errors.isEmpty()) {
            async.parallel({
                authors: (callback) => {
                    Author.find(callback);
                },
                genres: (callback) => {
                    Genre.find(callback);
                }
            }, (err, results) => {
                if (err) return next(err);

                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }

                res.render('book_form', { title: 'Create book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
        } else {
            book.save((err) => {
                if (err) return next(err);
                res.redirect(book.url);
            });
        };
    }
];

exports.book_delete_get = (req, res, next) => {
    async.parallel({
        book: (callback) => {
            Book.findById(req.params.id)
            .populate('author')
            .populate('genre')
            .exec(callback);
        },
        books_bookinstances: (callback) => {
            BookInstance.find({ 'book': req.params.id }).exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.book == null) {
            res.redirect('/catalog/books')
            return;
        };
        res.render('book_delete', { title: 'Delete Book', book: results.book, book_bookinstances: results.books_bookinstances });
    });
};

exports.book_delete_post = (req, res) => {
    async.parallel({
        book: (callback) => {
            Book.findById(req.body.bookid)
            .populate('author')
            .populate('genre')
            .exec(callback);
        },
        books_bookinstances: (callback) => {
            BookInstance.find({ 'book': req.body.bookid }).exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.books_bookinstances.length > 0) {
            res.render('book_delete', { title: 'Delete Book', book: results.book, book_bookinstances: results.books_bookinstances });
            return;
        } else {
            Book.findByIdAndDelete(req.body.bookid, (err) => {
                if (err) return next(err);
                res.redirect('/catalog/books');
            });
        };        
    });
};

exports.book_update_get = (req, res, next) => {
    async.parallel({
        book: (callback) => {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        authors: (callback) => {
            Author.find(callback);
        },
        genres: (callback) => {
            Genre.find(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.book==null) {
            let error = new Error('Book not found');
            error.status = 404;
            return next(error);
        }

        for (let i = 0; i < results.genres.length; i++) {
            for (let j = 0; j < results.book.genre.length; j++) {
                if (results.genres[i]._id.toString()==results.book.genre[j]._id.toString()) {
                    results.genres[i].checked = 'true';
                }                
            }         
        }

        res.render('book_form', { title: 'Update Book', book: results.book, authors: results.authors, genres: results.genres })
    })
};

exports.book_update_post = [

    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre === 'undefined')
            req.body.genre = [];
            else
            req.body.genre = new Array(req.body.genre);
        };
        next();
    },

    body('title', 'Title must not be empty').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),    

    sanitizeBody('*').escape(),
    sanitizeBody('genre.*').escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        let book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            async.parallel({
                authors: (callback) => {
                    Author.find(callback);
                },
                genres: (callback) => {
                    Genre.find(callback);
                }
            }, (err, results) => {
                if (err) return next(err);

                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }

                res.render('book_form', { title: 'Create book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
        } else {
            Book.findOneAndUpdate({ '_id': req.params.id}, book, {}, (err, thebook) => {
                if (err) return next(err);
                res.redirect(thebook.url);
            });
        };
    }

];