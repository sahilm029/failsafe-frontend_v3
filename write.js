const fs = require('fs'); fs.writeFileSync('lib/api.ts', require('child_process').execSync('cat write-content.txt').toString()); 
