const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const Types = Schema.Types;

mongoose.Promise = global.Promise;

const db = module.exports;

db.models = {};
db.mongoose = mongoose;

db.registerTongue = function registerTongue(tongue) {
  const TongueSchema = new Schema({
    _id: ObjectId,
    id: { type: Types.String, index: { unique: true, dropDups: true } },
    data: Types.Object
  });

  db.models[tongue] = mongoose.model(tongue, TongueSchema);
};

db.registerCourses = function registerTongue() {
  const CourseSchema = new Schema({
    _id: ObjectId,
    id: { type: Types.String, index: { unique: true, dropDups: true } },
    type: { type: Types.String },
    description: { type: Types.String },
    options: Types.Object,
    tags: [{ type: Types.String }],
    content: [
      {
        tongue: { type: Types.String },
        id: { type: Types.String }
        // todo: change schema to: type, options
      }
    ]
  });

  db.models.course = mongoose.model('Course', CourseSchema);
};

db._getModel = function getModel(tongue) {
  return db.getConnection()
    .then(_ => db.models[tongue]);
};

db.getConnection = function getConnection() {
  if (db._connectionPromise) {
    return db._connectionPromise;
  } else {
    return db._connectionPromise = new Promise((resolve, reject) => {
      mongoose.connect('mongodb://localhost:27017/tonguarium', { useMongoClient: true }, (err) => {
        if (err) {
          console.log(`Connection error ${err}`);
          reject(err);
          return;
        }

        console.log('Connected to mongodb');
        resolve();
      });
    });
  }
};

db.get = function get(tongue, id) {
  if (typeof tongue !== 'string') throw new Error(`tongue must be string, instead: ${typeof tongue}`);
  if (tongue === '') throw new Error('tongue must not be empty');
  if (typeof id !== 'string') throw new Error(`id must be string, instead: ${typeof id}`);
  if (id === '') throw new Error('id must not be empty');

  return new Promise((resolve, reject) => {
    db._getModel(tongue)
      .then(Model => {
        Model.findOne({ id }, (err, doc) => {
          if (err) reject(err);
          if (doc === null) reject({ error: 'not found', data: { tongue, id } });

          resolve(doc);
        });
      });
  });
};

db.getAll = function getAll(collection) {
  return new Promise((resolve, reject) => {
    db._getModel(collection)
      .then(Model => {
        Model.find({}, (err, docs) => {
          if (err) reject(err);

          resolve(docs.map(doc => doc.id));
        });
      });
  });
};

db.put = function put(tongue, id, data) {
  if (typeof tongue !== 'string') throw new Error(`tongue must be string, instead: ${typeof tongue}`);
  if (tongue === '') throw new Error('tongue must not be empty');
  if (typeof id !== 'string') throw new Error(`id must be string, instead: ${typeof id}`);
  if (id === '') throw new Error('id must not be empty');
  if (typeof data !== 'object') throw new Error('data must be object');

  return new Promise((resolve, reject) => {
    db._getModel(tongue)
      .then(Model => {
        const doc = new Model(
          Object.assign(
            { _id: mongoose.Types.ObjectId() },
            Object.assign({ id: id }, data)
          )
        );

        doc.save((err, doc) => {
          if (err) reject(err);

          resolve(doc);
        });
      });

  });
};

db.createOrUpdate = function createOrUpdate(tongue, id, data) {
  if (typeof tongue !== 'string') throw new Error(`tongue must be string, instead: ${typeof tongue}`);
  if (tongue === '') throw new Error('tongue must not be empty');
  if (typeof id !== 'string') throw new Error(`id must be string, instead: ${typeof id}`);
  if (id === '') throw new Error('id must not be empty');
  if (typeof data !== 'object') throw new Error('data must be object');

  return new Promise((resolve, reject) => {
    db.get(tongue, id)
      .then(doc => {
        if (!doc) {
          db
            .put(tongue, id, data)
            .then(resolve, reject);

          return;
        }

        Object.assign(doc, data); // todo: check deepClone here

        doc.save((err, doc) => {
          if (err) reject(err);

          resolve(doc);
        });
      })
      .catch(err => {
          if (err.error === 'not found') {
            db
              .put(tongue, id, data)
              .then(resolve, reject);

          } else {
            reject(err);
          }
      });
  });
};


db.delete = function dbDelete(tongue, id) {
  if (typeof tongue !== 'string') throw new Error(`tongue must be string, instead: ${typeof tongue}`);
  if (tongue === '') throw new Error('tongue must not be empty');
  if (typeof id !== 'string') throw new Error(`id must be string, instead: ${typeof id}`);
  if (id === '') throw new Error('id must not be empty');

  return new Promise((resolve, reject) => {
    db._getModel(tongue)
      .then(Model =>
        Model.deleteOne({ id }, (error) => {
          if (error) {
            console.log('err', error);
            reject(resolve);
            return;
          }

          resolve();
        })
      );
  })
};
