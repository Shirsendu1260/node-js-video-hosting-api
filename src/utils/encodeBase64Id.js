// node encodeBase64Id.js exampleid

// process.argv[0]: Node executable path
// process.argv[1]: The script's path
// process.argv[2]: The first user argument (e.g., "exampleid")

// Access the user provided MongoDB id
const myArg = process.argv[2];
console.log(Buffer.from(myArg).toString('base64url'));
