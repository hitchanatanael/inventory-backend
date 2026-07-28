const DEFAULT_LIMIT = 20;
const ALLOWED_LIMITS = [20, 50, 100];

const parsePositiveInteger = (value) => {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0
    ? numberValue
    : null;
};

const validatePaginationQuery = (query, options = {}) => {
  const { optional = false } = options;
  const hasPage = query.page !== undefined && query.page !== '';
  const hasLimit = query.limit !== undefined && query.limit !== '';

  if (optional && !hasPage && !hasLimit) {
    return {
      enabled: false,
    };
  }

  const page = hasPage ? parsePositiveInteger(query.page) : 1;
  const limit = hasLimit ? parsePositiveInteger(query.limit) : DEFAULT_LIMIT;

  if (!page) {
    return {
      error: 'Page harus berupa angka positif',
    };
  }

  if (!limit) {
    return {
      error: 'Limit harus berupa angka positif',
    };
  }

  if (!ALLOWED_LIMITS.includes(limit)) {
    return {
      error: `Limit hanya boleh: ${ALLOWED_LIMITS.join(', ')}`,
    };
  }

  return {
    enabled: true,
    pagination: {
      page,
      limit,
      offset: (page - 1) * limit,
    },
  };
};

module.exports = {
  DEFAULT_LIMIT,
  ALLOWED_LIMITS,
  validatePaginationQuery,
};
