const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const Types = Schema.Types;

module.exports = {
  user: new Schema({
    _id: ObjectId,
    id: { type: Types.String, index: { unique: true, dropDups: true } },
    name: Types.String,
    lastMessage: Types.Date,
    isActive: Types.Boolean,
    tasks: [
      {
        type: { type: Types.String },
        options: { type: Types.Object }
      }
    ]
  }),
  message: new Schema({
    _id: ObjectId,
    createdAt: Types.Date,
    sentAt: Types.Date,
    user: Types.String,
    text: Types.String,
  }),
};
