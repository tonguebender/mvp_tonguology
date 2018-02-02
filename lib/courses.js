const axios = require('axios');

const TONGUARIUM_URL = 'http://localhost:9090';
const COURSES_URL = `${TONGUARIUM_URL}/courses`;
const COURSE_URL = `${TONGUARIUM_URL}/course`;

function getCourseUrl(courseId) {
  return `${COURSE_URL}/${courseId}`;
}

function get(courseId) {
  return axios.get(getCourseUrl(courseId))
    .then(res => {
      return res.data.data;
    }, err => {
      return Promise.reject(err.response && err.response.data && err.response.data.error);
    });
}

function getAll() {
  return axios.get(COURSES_URL)
    .then(res => {
      return res.data.data;
    }, err => {
      return Promise.reject(err.response && err.response.data && err.response.data.error);
    });
}

function getTasks(courseId) {
  return get(courseId)
    .then(course => {
      return course.content.map(courseItem => {
        return {
          type: 'LEARN',
          course: courseId,
          tongue: courseItem.tongue,
          entity: courseItem.id,
        }
      })
    });
}

module.exports = {
  get,
  getAll,
  getTasks
};
