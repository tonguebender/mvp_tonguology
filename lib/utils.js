function flatten(arr) {
  return arr.reduce((res, item) => {
    if (Array.isArray(item)) return [...res, ...flatten(item)];
    if (item) return [...res, item];

    return res;
  }, []);
}

module.exports = {
  flatten
};
