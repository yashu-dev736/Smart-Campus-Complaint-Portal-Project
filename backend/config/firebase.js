const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin'); // <-- Required so admin is defined!
const serviceAccount = require('./serviceAccountKey.json');

let db;

try {
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  
  db = getFirestore();
  console.log('Firebase Firestore Connected Successfully & Ready!');
} catch (error) {
  console.error('FATAL Firebase Setup Error:', error.message);
}

module.exports = { db, admin };