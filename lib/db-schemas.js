const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const Types = Schema.Types;

module.exports = {
  user: new Schema({
    _id: ObjectId,
    id: { type: Types.String, index: { unique: true, dropDups: true } },
    data: Types.Object
  })
};
