const moment = require('moment');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let AuthorSchema = new Schema({
    first_name: {type: String, required: true, max: 100},
    family_name: {type: String, required: true, max: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date}
});

AuthorSchema
    .virtual('date_of_birth_formatted')
    .get(function() {
        return this.date_of_birth ? moment(this.date_of_birth).format('MMMM Do, YYYY') : 'Unknown';
    });

AuthorSchema
    .virtual('date_of_death_formatted')
    .get(function() {
        return this.date_of_death ? moment(this.date_of_death).format('MMMM Do, YYYY') : 'Actual';
    });

AuthorSchema
    .virtual('fullname')
    .get(function() {
        let fullName = '';
        if (this.first_name && this.family_name) fullName = this.family_name + ', ' + this.first_name;
        if (!this.first_name || !this.family_name) fullName = '';
        return fullName;
    });

AuthorSchema
    .virtual('lifespan')
    .get(function() {
        return this.date_of_birth_formatted + ' - ' + this.date_of_death_formatted;
    });

AuthorSchema
    .virtual('url')
    .get(function() {
        return '/catalog/author/' + this._id;
    });

module.exports = mongoose.model('Author', AuthorSchema);