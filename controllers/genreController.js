let Genre = require('../models/genre');
let Book = require('../models/book');
let async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.genre_list = (req, res, next) => {
    Genre.find()
         .populate('genre')
         .sort([['name', 'ascending']])
         .exec((err, list_genres) => {
            if (err) return next(err);
            res.render('genre_list', { title: 'Genre list', genre_list: list_genres });
         });
};

exports.genre_detail = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: (callback) => {
            Book.find({ 'genre': req.params.id }).exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.genre == null) {
            let err = new Error('Genre not found');
            err.status = 400;
            return next(err);
        }
        res.render('genre_detail', { title: 'Genre detail', genre: results.genre, genre_books: results.genre_books });
    });
};

exports.genre_create_get = (req, res) => {
    res.render('genre_form', { title: 'Create Genre' });
};

exports.genre_create_post = [
    body('name', 'Genre name required').trim().isLength({ min: 1 }),
    sanitizeBody('name').escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        let genre = new Genre(
            { name: req.body.name }
        );

        if (!errors.isEmpty()) {
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
            return;
        } else {
            Genre.findOne({ 'name': req.body.name })
                .exec(function(err, found_genre) {
                    if (err) return next(err);
                    if (found_genre) {
                        res.redirect(found_genre.url);
                    } else {
                        genre.save(function(err) {
                            if (err) return next(err);
                            res.redirect(genre.url);
                        });
                    }
                });
        };        
    }
];

exports.genre_delete_get = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id).exec(callback);
        },
        genres_books: (callback) => {
            Book.find({ 'genre': req.params.id }).exec(callback)
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.genre == null) {
            res.redirect('/catalog/genres');
        };
        res.render('genre_delete', { title: 'Detele Genre', genre: results.genre, genre_books: results.genres_books });
    });
};

exports.genre_delete_post = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id).exec(callback);
        },
        genres_books: (callback) => {
            Book.find({ 'genre': req.params.id }).exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.genres_books.length > 0) {
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books });
            return;
        } else {
            Genre.findByIdAndRemove(req.body.id, (err) => {
                if (err) return next(err);
                res.redirect('/catalog/genres');
            });
        };
    });
};

exports.genre_update_get = (req, res, next) => {
    Genre.findById(req.params.id, (err, genre) => {
        if (err) return next(err);
        if(genre == null) {
            let error = new Error('Genre not found');
            error.status = 404;
            return next(error);
        }
        res.render('genre_form', { title: 'Update Genre', genre: genre })
    });
};

exports.genre_update_post = [
    body('name', 'Genre name required').trim().isLength({ min: 1 }),
    sanitizeBody('name').escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        let genre = new Genre({ 
            name: req.body.name,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            res.render('genre_form', { title: 'Update Genre', genre: genre, errors: errors.array() });
            return;
        } else {
            Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
                if (err) return next(err);
                res.redirect(thegenre.url);
            });
        };        
    }
];