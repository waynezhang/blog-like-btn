'use strict';

const whitelist = [ 'http://lhzhang.com' ];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
const cors = require('cors')(corsOptions);

const uuid = require('uuid');
const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

function onCount(req, res) {
  const identifier = req.query.identifier;
  if (!identifier) {
    return res.status(400).send('Bad Request');
  }

  const ref = '/entries/' + identifier;

  admin.database()
    .ref(ref)
    .once('value')
    .then((snapshot) => {
      let ret = {
        liked: false,
        count: 0,
        user: req.query.user ? req.query.user : uuid.v4()
      };

      let val = snapshot.val();
      if (!val) {
        return res.status(200).json(ret);
      }

      ret.count = val.users.length;
      ret.liked = val.users.indexOf(ret.user) >= 0;
      res.status(200).json(ret);
    });
}

function onLike(req, res) {
  const { shortname, identifier, name, link, user } = req.body;
  if (!shortname || ! identifier || !name || !link || !user) {
    return res.status(400).send('Bad Request');
  }

  const ref = '/entries/' + identifier;

  admin.database().ref(ref)
    .once('value')
    .then((snapshot) => {
      let val = snapshot.val();
      if (!val) {
        val = {
          shortname: shortname,
          title: name,
          url: link,
          users: [ ]
        };
      }

      let idx = val.users.indexOf(user);
      if (idx >= 0) {
        val.users.splice(idx, 1);
      } else {
        val.users.push(user);
      }

      let ret = {
        liked: idx < 0,
        count: val.users.length,
        user: user
      };

      admin.database().ref(ref)
        .set(val)
        .then(() => {
          res.status(200).json(ret);
        });
    });
}

exports.count = functions.https.onRequest((req, res) => {
  cors(req, res, () => { onCount(req, res); });
});

exports.like = functions.https.onRequest((req, res) => {
  cors(req, res, () => { onLike(req, res); });
});