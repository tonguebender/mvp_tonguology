const mongoose = require('mongoose');
const schemas = require('./db-schemas');

mongoose.Promise = global.Promise;

const db = module.exports;

db.models = {};
db.mongoose = mongoose;

db.models.user = mongoose.model('User', schemas.user);
db.models.message = mongoose.model('Message', schemas.message);

db.getConnection = function getConnection() {
  if (db._connectionPromise) {
    return db._connectionPromise;
  } else {
    return db._connectionPromise = new Promise((resolve, reject) => {
      mongoose.connect(process.env.MONGO_URL, { useMongoClient: true }, (err, connection) => {
        if (err) {
          console.log(`Connection error ${err}`);
          reject(err);
          return;
        }

        console.log('Connected to mongodb');
        resolve(connection);
      });
    });
  }
};

db.closeConnection = function dbClose(callback) {
  db.getConnection()
    .then(connection => {
      connection.close(callback)
    });
};

db._getModel = function getModel(collection) {
  return db.getConnection()
    .then(() => db.models[collection]);
};

db.get = function get(collection, id) {
  if (typeof collection !== 'string') throw new Error(`collection must be a string, instead: ${typeof collection}`);
  if (collection === '') throw new Error('collection must not be empty');
  if (typeof id !== 'string') throw new Error(`id must be a string, instead: ${typeof id}`);
  if (id === '') throw new Error('id must not be empty');

  return new Promise((resolve, reject) => {
    db._getModel(collection)
      .then(Model => {
        Model.findOne({ id }, (err, doc) => {
          if (err) reject(err);
          if (doc === null) reject({ error: 'not found', data: { collection, id } });

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

db.findAll = function getAll(collection, conditions) {
  return new Promise((resolve, reject) => {
    db._getModel(collection)
      .then(Model => {
        Model.find(conditions || {}, (err, docs) => {
          if (err) reject(err);

          resolve(docs);
        });
      });
  });
};

db.findByIds = function (collection, ids) {
  return new Promise((resolve, reject) => {
    db._getModel(collection)
      .then(Model => {
        Model.find({ _id: { $in: ids } }, (err, docs) => {
          if (err) reject(err);

          resolve(docs);
        });
      });
  });
};

db.put = function put(collection, id, data) {
  if (typeof collection !== 'string') throw new Error(`collection must be a string, instead: ${typeof collection}`);
  if (collection === '') throw new Error('collection must not be empty');
  if (typeof id !== 'string') throw new Error(`id must be a string, instead: ${typeof id}`);
  if (id === '') throw new Error('id must not be empty');
  if (typeof data !== 'object') throw new Error('data must be an object');

  return new Promise((resolve, reject) => {
    db._getModel(collection)
      .then(Model => {
        const doc = new Model(
          Object.assign(
            { _id: mongoose.Types.ObjectId() },
            Object.assign({ id: id }, data),
          )
        );

        doc.save((err, doc) => {
          if (err) reject(err);

          resolve(doc);
        });
      });

  });
};

db.push = function push(collection, data) {
  if (typeof collection !== 'string') throw new Error(`collection must be a string, instead: ${typeof collection}`);
  if (collection === '') throw new Error('collection must not be empty');
  if (typeof data !== 'object') throw new Error('data must be an object');

  return new Promise((resolve, reject) => {
    db._getModel(collection)
      .then(Model => {
        const doc = new Model(
          Object.assign(
            { _id: mongoose.Types.ObjectId() },
            data
          )
        );

        doc.save((err, doc) => {
          if (err) reject(err);

          resolve(doc);
        });
      });

  });
};

db.createOrUpdate = function createOrUpdate(collection, id, data) {
  if (typeof collection !== 'string') throw new Error(`collection must be a string, instead: ${typeof collection}`);
  if (collection === '') throw new Error('collection must not be empty');
  if (typeof id !== 'string') throw new Error(`id must be a string, instead: ${typeof id}`);
  if (id === '') throw new Error('id must not be empty');
  if (typeof data !== 'object') throw new Error('data must be an object');

  return new Promise((resolve, reject) => {
    db.get(collection, id)
      .then(doc => {
        if (!doc) {
          db
            .put(collection, id, data)
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
              .put(collection, id, data)
              .then(resolve, reject);

          } else {
            reject(err);
          }
      });
  });
};

db.delete = function dbDelete(collection, id) {
  if (typeof collection !== 'string') throw new Error(`collection must be a string, instead: ${typeof collection}`);
  if (collection === '') throw new Error('collection must not be empty');
  if (typeof id !== 'string') throw new Error(`id must be a string, instead: ${typeof id}`);
  if (id === '') throw new Error('id must not be empty');

  return new Promise((resolve, reject) => {
    db._getModel(collection)
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
