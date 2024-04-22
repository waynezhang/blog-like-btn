'use strict';

const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const whitelist = ['https://lhzhang.com'];
const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');
const serviceAccount = require("./account_key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://like-btn.firebaseio.com"
});

const db = admin.database();

async function onCount(req, res) {
  const { identifier, shortname } = req.query;
  if (!identifier || !shortname) {
    return res.status(400).send('Bad Request');
  }

  const ret = {
    liked: false,
    count: 0,
    user: req.query.user || uuidv4()
  };

  const ref = [shortname, 'entries', identifier, 'users'].join('/');
  const val = (await db.ref(ref).once('value')).val();
  if (!val) {
    return res.status(200).json(ret);
  }

  ret.count = val.length;
  ret.liked = val.indexOf(ret.user) >= 0;

  res.status(200).json(ret);
}

async function onLike(req, res) {
  const { shortname, identifier, name, link, user } = req.body;
  if (!shortname || !identifier || !name || !link || !user) {
    return res.status(400).send('Bad Request');
  }

  const ref = [shortname, 'entries', identifier].join('/');
  const val = (await db.ref(ref).once('value')).val() || {
    title: name,
    url: link
  };
  val.users = val.users || [];

  const idx = val.users.indexOf(user);
  if (idx >= 0) {
    val.users.splice(idx, 1);
  } else {
    val.users.push(user);
  }
  const liked = idx < 0;

  await db.ref(ref).set(val);
  await log(shortname, (liked ? 'Liked' : 'Unliked') + ' ' + name);

  res.status(200).json({
    user: user,
    liked: liked,
    count: val.users.length
  });
}

function log(shortname, msg) {
  const ref = [shortname, 'logs'].join('/');
  return db.ref(ref).push(moment().format() + ' ' + msg);
}

exports.count = functions.https.onRequest(
  { cors: whitelist },
  async (req, res) => { await onCount(req, res); }
);

exports.like = functions.https.onRequest(
  { cors: whitelist },
  (req, res) => { onLike(req, res); }
);
