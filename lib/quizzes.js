const httpTransport = require('./http-transport');

const TONGUARIUM_URL = process.env.TONGUARIUM_URL;
const QUIZZES_URL = `${TONGUARIUM_URL}/quizzes`;
const QUIZ_URL = `${TONGUARIUM_URL}/quiz`;

function getQuizUrl(quizId) {
  return `${QUIZ_URL}/${quizId}`;
}

function get(quizId) {
  return httpTransport.get(getQuizUrl(quizId));
}

function getAll() {
  return httpTransport.get(QUIZZES_URL);
}

module.exports = {
  get,
  getAll
};
