const axios = require('axios');

function get(url) {
  return axios.get(url)
    .then(res => {
      return res.data.data;
    }, err => {
      return Promise.reject(err.response && err.response.data && err.response.data.error);
    });
}

function post(url, data) {
  return axios.post(url, data)
    .then(res => {
      return res.data.data;
    }, err => {
      return Promise.reject(err.response && err.response.data && err.response.data.error);
    });
}

module.exports = {
  get,
  post
};
