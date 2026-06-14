/**
 * Parse pagination, search, and sort from query string.
 */
export function parsePaginationQuery(query, defaultSort = 'createdAt') {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const sortBy = query.sortBy || defaultSort;
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort: { [sortBy]: sortOrder },
  };
}

export function buildPaginationResponse({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export function buildSearchFilter(search, fields) {
  if (!search?.trim()) return {};

  const term = search.trim();
  return {
    $or: fields.map((field) => ({
      [field]: { $regex: term, $options: 'i' },
    })),
  };
}

export default { parsePaginationQuery, buildPaginationResponse, buildSearchFilter };
