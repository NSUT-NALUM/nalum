const DELETED_USER_PLACEHOLDER = {
  _id: null,
  name: "Deleted User",
  role: "alumni",
  profile_picture: null,
};

function safeAuthor(docOrArray) {
  if (!docOrArray) return docOrArray;

  const normalize = (item) => {
    if (!item) return item;
    const obj = item.toObject ? item.toObject() : item;
    if (obj.userId === null || obj.userId === undefined) {
      obj.userId = DELETED_USER_PLACEHOLDER;
    }
    return obj;
  };

  return Array.isArray(docOrArray) ? docOrArray.map(normalize) : normalize(docOrArray);
}

module.exports = { safeAuthor, DELETED_USER_PLACEHOLDER };