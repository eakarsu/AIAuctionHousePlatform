/**
 * Backwards-compatible paginated list helper.
 *
 * - When ?page or ?limit are provided, returns
 *   { data, pagination: { page, limit, total, total_pages } }.
 * - When neither is provided, returns the raw array (preserving previous shape).
 *
 * `searchColumns` is an optional array of column names to ILIKE-match against ?search.
 */
async function paginatedList({ pool, table, alias = '', orderBy = 'created_at DESC', searchColumns = [], req, baseSelect, extraJoin = '', extraWhere = '', extraParams = [] }) {
  const usePagination = req.query.page != null || req.query.limit != null;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search).trim() : null;

  const params = [...extraParams];
  const conditions = [];
  if (extraWhere) conditions.push(extraWhere);
  if (search && searchColumns.length) {
    params.push(`%${search}%`);
    const idx = params.length;
    const fragment = searchColumns.map((c) => `${c} ILIKE $${idx}`).join(' OR ');
    conditions.push(`(${fragment})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const tableExpr = alias ? `${table} ${alias}` : table;
  const selectClause = baseSelect || `SELECT * FROM ${tableExpr} ${extraJoin}`;

  if (!usePagination) {
    const result = await pool.query(`${selectClause} ${whereClause} ORDER BY ${orderBy}`, params);
    return result.rows;
  }

  const countRes = await pool.query(`SELECT COUNT(*) FROM ${tableExpr} ${extraJoin} ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit);
  params.push(offset);
  const dataRes = await pool.query(
    `${selectClause} ${whereClause} ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: dataRes.rows,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

module.exports = { paginatedList };
