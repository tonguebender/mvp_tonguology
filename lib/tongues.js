const httpTransport = require('./http-transport');

const TONGUARIUM_URL = process.env.TONGUARIUM_URL;
const SEARCH_URL = `${TONGUARIUM_URL}/search`;
const DEF_URL = `${TONGUARIUM_URL}/tongue/en-gb-def`;

function getSearchUrl(id) {
  return `${SEARCH_URL}/${id}`;
}

function getImageUrl(id) {
  return `${TONGUARIUM_URL}/image/${id}`;
}

function getDefinitionUrl(id) {
  return `${DEF_URL}/${id}`;
}

function getAudioUrl(id) {
  return `${TONGUARIUM_URL}/audio/${id}`;
}

function getSynonymsUrl(id) {
  return `${TONGUARIUM_URL}/tongue/en-synonyms/${id}`;
}

function getIPAUrl(id) {
  return `${TONGUARIUM_URL}/tongue/en-ipa/${id}`;
}

function getExamplesUrl(id) {
  return `${TONGUARIUM_URL}/examples/${id}`;
}

function getTranslationUrl(id) {
  return `${TONGUARIUM_URL}/translation/${id}`;
}


function getDefinition(id) {
  return httpTransport.get(getDefinitionUrl(id))
    .then(data => {
      if (data) {
        const meanings = data.data.meanings
          .map(meaning => `_(${meaning.speech_part})_ ${meaning.def}`)
          .join(';\n');

        return `*${data.id}*\n\n${meanings}`;
      }
    });
}

function getExamples(id) {
  return httpTransport.get(getExamplesUrl(id))
    .then(data => {
      return data && `*${id}*\n_examples_: ${data.map(expl => `"${expl}"`).join(' ')}`;
    }, () => {
      return;
    });
}

function getSynonyms(id) {
  return httpTransport.get(getSynonymsUrl(id))
    .then(data => {
      if (data) {
        return `*${id}*\n_synonyms_: ${data.data.synonyms.join(', ')}`;
      }
    });
}

function getIPA(id) {
  return httpTransport.get(getIPAUrl(id))
    .then(data => {
      if (data) {
        return data.data.ipa;
      }
    });
}

function getTranslation(id) {
  return httpTransport.get(getTranslationUrl(id))
    .then(data => {
      if (data) {
        return `*${id}*: ${data.join(', ')}`;
      }
    });
}

function getImage(id) {
  return httpTransport.get(getImageUrl(id));
}

function getAudio(id) {
  return httpTransport.get(getAudioUrl(id));
}

function search(id) {
  return httpTransport.get(getSearchUrl(id));
}

module.exports = {
  getImage,
  getAudio,
  getDefinition,
  getExamples,
  getSynonyms,
  getIPA,
  getTranslation,
  search
};
