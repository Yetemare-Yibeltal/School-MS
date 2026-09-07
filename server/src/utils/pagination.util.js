// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// PAGINATION UTILITY
// kat-school/server/src/utils/pagination.util.js
// ============================================

'use strict';

// ─── Build Pagination Meta ────────────────────
const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));

  return {
    total,
    page: currentPage,
    limit,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    previousPage: currentPage > 1 ? currentPage - 1 : null,
    from: total === 0 ? 0 : (currentPage - 1) * limit + 1,
    to: Math.min(currentPage * limit, total),
  };
};

// ─── Build Paginated Response ─────────────────
const paginatedResponse = (data, total, page, limit, message = 'Data fetched successfully') => {
  const pagination = buildPaginationMeta(total, page, limit);

  return {
    success: true,
    message,
    data,
    pagination,
  };
};

// ─── Parse Pagination Params ──────────────────
const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

// ─── Build Sort Object ────────────────────────
const buildSortObject = (sortField = 'createdAt', sortOrder = 'desc', allowedFields = []) => {
  const order = sortOrder === 'asc' ? 1 : -1;

  // Validate sort field if allowed fields provided
  if (allowedFields.length > 0 && !allowedFields.includes(sortField)) {
    return { createdAt: -1 };
  }

  return { [sortField]: order };
};

// ─── Build Search Query ───────────────────────
const buildSearchQuery = (searchTerm, searchFields) => {
  if (!searchTerm || !searchFields || searchFields.length === 0) {
    return {};
  }

  return {
    $or: searchFields.map((field) => ({
      [field]: {
        $regex: searchTerm.trim(),
        $options: 'i',
      },
    })),
  };
};

// ─── Build Date Range Filter ──────────────────
const buildDateRangeFilter = (startDate, endDate, dateField = 'createdAt') => {
  if (!startDate && !endDate) return {};

  const filter = {};
  const dateFilter = {};

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    dateFilter.$gte = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }

  if (Object.keys(dateFilter).length > 0) {
    filter[dateField] = dateFilter;
  }

  return filter;
};

// ─── Build Filter Object ──────────────────────
// Removes undefined/null values from filter
const buildFilterObject = (rawFilter) => {
  const filter = {};

  Object.entries(rawFilter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      filter[key] = value;
    }
  });

  return filter;
};

// ─── Paginate Mongoose Query ──────────────────
const paginate = async (Model, filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
    populate = null,
    select = null,
    lean = true,
  } = options;

  const skip = (page - 1) * limit;

  let query = Model.find(filter).sort(sort).skip(skip).limit(limit);

  if (select) query = query.select(select);

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach((p) => {
        query = query.populate(p);
      });
    } else {
      query = query.populate(populate);
    }
  }

  if (lean) query = query.lean();

  const [data, total] = await Promise.all([query, Model.countDocuments(filter)]);

  return {
    data,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

// ─── Aggregate Paginate ───────────────────────
const aggregatePaginate = async (Model, pipeline = [], page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [countResult, data] = await Promise.all([
    Model.aggregate([...pipeline, { $count: 'total' }]),
    Model.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
  ]);

  const total = countResult[0]?.total || 0;

  return {
    data,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

// ─── Format Response ──────────────────────────
const formatResponse = (success, message, data = null, statusCode = 200, extras = {}) => {
  const response = {
    success,
    message,
    ...extras,
  };

  if (data !== null) {
    response.data = data;
  }

  return { response, statusCode };
};

// ─── Success Response ─────────────────────────
const successResponse = (res, message, data = null, statusCode = 200, pagination = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;

  return res.status(statusCode).json(response);
};

// ─── Error Response ───────────────────────────
const errorResponse = (res, message, statusCode = 400, errors = null, code = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) response.errors = errors;
  if (code) response.code = code;

  return res.status(statusCode).json(response);
};

module.exports = {
  buildPaginationMeta,
  paginatedResponse,
  parsePaginationParams,
  buildSortObject,
  buildSearchQuery,
  buildDateRangeFilter,
  buildFilterObject,
  paginate,
  aggregatePaginate,
  formatResponse,
  successResponse,
  errorResponse,
};
