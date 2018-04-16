const httpTransport = require('./http-transport');

const TONGUARIUM_URL = process.env.TONGUARIUM_URL;
const COURSES_URL = `${TONGUARIUM_URL}/courses`;
const COURSE_URL = `${TONGUARIUM_URL}/course`;

function getCourseUrl(courseId) {
  return `${COURSE_URL}/${courseId}`;
}

function get(courseId) {
  return httpTransport.get(getCourseUrl(courseId));
}

function getAll() {
  return httpTransport.get(COURSES_URL);
}

module.exports = {
  get,
  getAll,
};
