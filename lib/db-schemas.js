const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const Types = Schema.Types;

module.exports = {

  user: new Schema({
    _id: ObjectId,
    createdAt: Types.Date,

    id: { type: Types.String, index: { unique: true, dropDups: true } },
    name: Types.String,
    chatId: Types.String,
    fullInfo: Types.Object,

    lastMessageAt: Types.Date,
    lastInteractionAt: Types.Date,
    isActive: Types.Boolean,

    learningMessagesPerMinute: Types.Number,
    learningMinuteSessionCounter: Types.Number,
    lastLearningMessageAt: Types.Date,

    subscriptions: [
      {
        course: { type: Types.String },
        subscribedAt: { type: Types.Date },
        finishedAt: { type: Types.Date },
        stoppedAt: { type: Types.Date },
      }
    ],

    tasks: [
      {
        type: { type: Types.String },
        options: { type: Types.Object }
      }
    ]
  }, { usePushEach: true }),

  message: new Schema({
    _id: ObjectId,
    createdAt: Types.Date,
    sentAt: Types.Date,
    userId: Types.String,
    chatId: Types.String,
    type: Types.String,
    text: Types.String,
    buttons: [],
  }),

};
