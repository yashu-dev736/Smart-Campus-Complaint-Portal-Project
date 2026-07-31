const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

let db;

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

db = getFirestore();

console.log("Firebase Firestore Connected Successfully!");

module.exports = { db };