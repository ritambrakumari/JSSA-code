const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/jssa').then(async () => {
  const Employee = mongoose.model('Employee', new mongoose.Schema({}, {strict: false}), 'employees');
  const zc = await Employee.findOne({name: /DEEKSHA/i});
  console.log('ZC districts:', zc.workingDistrict);
  const myDistricts = (zc.workingDistrict || '').split(',').map(d => d.trim()).filter(Boolean);
  
  // Using original logic
  const filterOriginal = {
    $or: myDistricts.map(d => ({ workingDistrict: { $regex: new RegExp('^'+d, 'i') } }))
  };
  const empsOriginal = await Employee.find(filterOriginal).select('name role designation workingDistrict');
  console.log('Original Logic Match:', empsOriginal.length);

  // Using split logic
  const filterSplit = {
    $or: myDistricts.map(d => ({ workingDistrict: { $regex: new RegExp('^'+d.split('/')[0].trim(), 'i') } }))
  };
  const empsSplit = await Employee.find(filterSplit).select('name role designation workingDistrict');
  console.log('Split Logic Match:', empsSplit.length);
  empsSplit.forEach(e => console.log(e.name, e.role, e.workingDistrict));

  process.exit(0);
});
