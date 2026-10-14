import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs'; // Just in case, though we just copy the hash
dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const db = mongoose.connection.db;

    // 1. Us User ko dhoondhte hain jisme dono applications hain (jo abhi Ajay ke naam se ho gaya hai)
    const sharedUser = await db.collection('users').findOne({ email: 'ajaysuryawashimyohar996@gmail.com' });
    
    if (!sharedUser) {
        console.log('User not found!');
        process.exit(1);
    }
    
    console.log('\n--- STEP 1: Reverting Sanjay\'s account ---');
    // Hum wapas is account ko Sanjay ka bana dete hain
    await db.collection('users').updateOne(
        { _id: sharedUser._id },
        { $set: { email: '9068182247sanjay@gmail.com', phone: '6389083413' } }
    );
    console.log('Sanjay ka account wapas pehle jaisa ho gaya: 9068182247sanjay@gmail.com / 6389083413');

    // 2. Ab Ajay ke liye ek NAYA alag account banate hain
    console.log('\n--- STEP 2: Creating Ajay\'s account ---');
    let ajayUser = await db.collection('users').findOne({ email: 'ajaysuryawashimyohar996@gmail.com' });
    if (!ajayUser) {
        const newUser = {
            email: 'ajaysuryawashimyohar996@gmail.com',
            phone: '9068182247',
            role: sharedUser.role || 'applicant',
            password: sharedUser.password, // Sanjay wala hi password rakh dete hain, wo log forgot password kar lenge
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const insertResult = await db.collection('users').insertOne(newUser);
        ajayUser = await db.collection('users').findOne({ _id: insertResult.insertedId });
        console.log('Ajay ke liye naya alag account ban gaya hai.');
    } else {
        console.log('Ajay ka account already ban gaya hai.');
    }

    // 3. Ajay ki Application (231409792) ko Ajay ke naye account se link karte hain
    console.log('\n--- STEP 3: Linking Ajay\'s application ---');
    const ajayApp = await db.collection('applications').findOne({ applicationNumber: '231409792' });
    if (ajayApp) {
        await db.collection('applications').updateOne(
            { _id: ajayApp._id },
            { $set: { createdBy: ajayUser._id } }
        );
        console.log('Ajay ki Application (231409792) ab Ajay ke naye account se link ho gayi hai.');
    } else {
        console.log('Ajay ki Application nahi mili.');
    }

    console.log('\n[SUCCESS] Sab kuch fix ho gaya hai! Dono applicants ke accounts ab alag hain aur sahi se linked hain.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
