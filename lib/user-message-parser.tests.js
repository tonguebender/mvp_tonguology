const { messageToCategory } = require('./user-message-parser');

console.log(messageToCategory('Give me definition of happiness.'));
console.log(messageToCategory('Can you provide me definition of happiness.'));
console.log(messageToCategory('Definition of happiness.'));
console.log(messageToCategory('What is definition of happiness.'));
console.log(messageToCategory('Definition for happiness.'));
console.log(messageToCategory('define happiness.'));
console.log(messageToCategory('Meaning of happiness.'));
