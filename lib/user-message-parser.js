const { readFileSync } = require('fs');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

const MESSAGE_CATEGORIES = {
  REQUEST: 'REQUEST',
  DEFINITION: 'DEFINITION',
  IMAGE: 'IMAGE',
  AUDIO: 'AUDIO',
  TRANSLATE: 'TRANSLATE',
  EXAMPLE: 'EXAMPLE',
  SYNONYMS: 'SYNONYMS',
  IPA: 'IPA',
  COURSES: 'COURSES',
  QUIZZES: 'QUIZZES',
  QUIZ: 'QUIZ',
  NEXT: 'NEXT',
  SKIP: 'SKIP',
  MORE: 'MORE',
  PING: 'PING',
  HI: 'HI',
  NO: 'NO',
  STOP: 'STOP',
  SUBSCRIPTION: 'SUBSCRIPTION',
  SUBSCRIBE: 'SUBSCRIBE',
};

const STOP_WORDS = readFileSync('./data/en-stop-words')
  .toString()
  .split('\n');

function messageToCategory(message) {
  const tokens = tokenizer.tokenize(message);
  const filteredTokens = filterStopWords(tokens);

  return extractCategory(filteredTokens);
}

function extractCategory(tokens) {
  const token0 = tokens[0];
  const category = getCategory(token0);

  switch (category) {
    case undefined: {
      return;
    }
    case MESSAGE_CATEGORIES.REQUEST:
      return extractCategory(tokens.slice(1));

    default:
      return {
        category,
        text: tokens.slice(1).join(' '),
      };
  }
}

function getCategory(token = '') {
  const stem = natural.PorterStemmer.stem(token).toLowerCase();

  switch (stem) {
    case 'give':
    case 'provid':
    case 'know':
      return MESSAGE_CATEGORIES.REQUEST;
    case 'def':
    case 'defin':
    case 'definit':
    case 'mean':
    case 'explan':
    case 'explain':
      return MESSAGE_CATEGORIES.DEFINITION;
    case 'show':
    case 'imag':
    case 'pictur':
      return MESSAGE_CATEGORIES.IMAGE;
    case 'audio':
    case 'sai':
    case 'pronunci':
      return MESSAGE_CATEGORIES.AUDIO;
    case 'syn':
    case 'synonym':
    case 'similar':
      return MESSAGE_CATEGORIES.SYNONYMS;
    case 'exampl':
    case 'us':
    case 'usag':
      return MESSAGE_CATEGORIES.EXAMPLE;
    case 'ipa':
    case 'transcript':
    case 'phonet':
    case 'phone':
      return MESSAGE_CATEGORIES.IPA;
    case 'translat':
      return MESSAGE_CATEGORIES.TRANSLATE;
    case 'cours':
      return MESSAGE_CATEGORIES.COURSES;
    case 'quizz':
    case 'test':
      return MESSAGE_CATEGORIES.QUIZZES;
    case 'quiz':
      return MESSAGE_CATEGORIES.QUIZ;
    case 'subscript':
      return MESSAGE_CATEGORIES.SUBSCRIPTION;
    case 'subscrib':
      return MESSAGE_CATEGORIES.SUBSCRIBE;
    case 'more':
    case 'rest':
      return MESSAGE_CATEGORIES.MORE;
    case 'next':
    case 'skip':
      return MESSAGE_CATEGORIES.SKIP;
    case 'ping':
      return MESSAGE_CATEGORIES.PING;
    case 'hi':
    case 'hei':
    case 'hello':
      return MESSAGE_CATEGORIES.HI;
    case 'no':
      return MESSAGE_CATEGORIES.NO;
    case 'stop':
    case 'end':
    case 'unsubscrib':
      return MESSAGE_CATEGORIES.STOP;
  }
}

function filterStopWords(tokens = []) {
  return tokens.filter(token => !STOP_WORDS.includes(token.toLowerCase()));
}

module.exports = {
  messageToCategory,
  MESSAGE_CATEGORIES,
};
