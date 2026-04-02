const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('LearnWeb@2026', 10);
console.log(hash);
