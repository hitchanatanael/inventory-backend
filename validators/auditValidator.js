const forbiddenAuditFields = [
  'created_by',
  'updated_by',
  'created_at',
  'updated_at',
];

const findForbiddenAuditFields = (body = {}) => {
  return forbiddenAuditFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(body, field)
  );
};

module.exports = {
  findForbiddenAuditFields,
};
