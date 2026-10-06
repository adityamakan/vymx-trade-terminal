const fs = require('fs');

let nav = fs.readFileSync('src/components/Navbar.tsx', 'utf8');
nav = nav.replace("import { Asset } from '../types';", "import { Asset } from '../types';\nimport { motion } from 'motion/react';");
fs.writeFileSync('src/components/Navbar.tsx', nav);
console.log("Patched Navbar import.");
