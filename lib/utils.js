function flatten(arr) {
  return arr.reduce((res, item) => {
    if (Array.isArray(item)) return [...res, ...flatten(item)];
    if (item) return [...res, item];

    return res;
  }, []);
}

function smartCut(str = '', maxLength = 250, delimiter = '.') {
  if (str.length > maxLength) {
    const maxLengthString = str.substring(0, maxLength);
    let pos;
    for (let del of [delimiter, '.', ' ', '']) {
      pos = maxLengthString.lastIndexOf(del);
      if (pos !== -1) break;
    }

    return {
      left: str.substring(0, pos + 1),
      right: str.substring(pos + 1),
    };
  }
  {
    return {
      left: str,
    };
  }
}

function cleanMessage(message = '') {
  return message.replace(/`/gi, "'");
}

function getRandomSubArray(array = [], n = 10) {
  const result = [];
  const indexes = [];
  const len = array.length;

  while (result.length < n) {
    let index = getRandom(len - 1);

    if (!indexes.includes(index)) {
      indexes.push(index);
      result.push(array[index]);
    }
  }

  return result;
}

function getRandom(max) {
  return Math.round(Math.random() * max);
}

module.exports = {
  flatten,
  smartCut,
  cleanMessage,
  getRandom,
  getRandomSubArray,
};
