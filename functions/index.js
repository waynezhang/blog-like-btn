'use strict';

const uuid = require('uuid');
const moment = require('moment');

const whitelist = [ 'https://lhzhang.com' ];
const cors = require('cors')({
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
});
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const db = admin.database();

function onCount(req, res) {
  const { identifier, shortname } = req.query;
  if (!identifier || !shortname) {
    return res.status(400).send('Bad Request');
  }

  const ref = [ shortname, 'entries', identifier, 'users' ].join('/');

  db.ref(ref)
    .once('value')
    .then((snapshot) => {
      const ret = {
        liked: false,
        count: 0,
        user: req.query.user || uuid.v4()
      };

      const val = snapshot.val();
      if (!val) {
        return res.status(200).json(ret);
      }

      ret.count = val.length;
      ret.liked = val.indexOf(ret.user) >= 0;
      res.status(200).json(ret);
    });
}

function onLike(req, res) {
  const { shortname, identifier, name, link, user } = req.body;
  if (!shortname || ! identifier || !name || !link || !user) {
    return res.status(400).send('Bad Request');
  }

  const ref = [ shortname, 'entries', identifier ].join('/');
  db.ref(ref)
    .once('value')
    .then((snapshot) => {
      let val = snapshot.val() || {
        title: name,
        url: link
      };
      val.users = val.users || [ ];

      return Promise.resolve(val);
    })
    .then((val) => {
      const idx = val.users.indexOf(user);
      if (idx >= 0) {
        val.users.splice(idx, 1);
      } else {
        val.users.push(user);
      }

      const liked = idx < 0;

      const retPromise = Promise.resolve({
        user: user,
        liked: liked,
        count: val.users.length
      });
      const savePromise = db.ref(ref).set(val);
      const logPromise = log(shortname, (liked ? 'Liked' : 'Unliked') + ' ' + name );

      return Promise.all([ retPromise, savePromise, logPromise ]);
    })
    .then(([ ret ]) => {
      res.status(200).json(ret);
    });
}

function log(shortname, msg) {
  const ref = [ shortname, 'logs' ].join('/');
  return db.ref(ref).push(moment().format() + ' ' + msg);
}

exports.count = functions.https.onRequest((req, res) => {
  cors(req, res, () => { onCount(req, res); });
});

exports.like = functions.https.onRequest((req, res) => {
  cors(req, res, () => { onLike(req, res); });
});
