const axios = require('axios');
const tonguariumUrl = 'http://localhost:9090';
const courseUrl = `${tonguariumUrl}/course`;

function getCourseUrl(courseId) {
  return `${courseUrl}/${courseId}`;
}

function get(courseId) {
  return axios.get(getCourseUrl(courseId))
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
          type: 'learn',
          course: courseId,
          tongue: courseItem.tongue,
          entity: courseItem.id,
        }
      })
    });
}

module.exports = {
  get,
  getTasks
};
