import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const db = mongoose.connection.db;
    
    // Change the role of the user '9232505522' to 'cardHolder'
    const result = await db.collection('users').updateOne(
      { phone: '9232505522' },
      { $set: { role: 'cardHolder' } }
    );
    
    console.log('Updated 9232505522 role to cardHolder. Result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
