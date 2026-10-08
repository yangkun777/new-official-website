const REVIEW = new Set([
  "DUPLICATE_MATECODE",
  "DUPLICATE_ORDER_NO",
  "ORPHAN_SERIES",
  "MISSING_SERIES_MATECODE",
  "MISSING_SERIES_NAME",
  "MISSING_ORDER_NO",
  "MISSING_PRODUCT_TITLE",
  "UNKNOWN_CATEGORY",
  "SERIES_CATEGORY_REVIEW",
]);

function issue(kind, entity, row, message) {
  return {
    disposition: REVIEW.has(kind) ? "REVIEW" : "REJECT",
    reason_code: kind,
    entity,
    legacy_id: row.legacy_id ?? null,
    identity: row.matecode ?? row.order_no ?? null,
    message,
    row,
  };
}

function groups(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!value) continue;
    const list = result.get(value) ?? [];
    list.push(row);
    result.set(value, list);
  }
  return result;
}

export function summarizeCategoryGaps(batch) {
  const sourceCategoryIds = new Set(batch.categories.map((row) => String(row.legacy_id)).filter(Boolean));
  const productCountsBySeries = new Map();
  for (const product of batch.products) {
    if (!product.series_matecode) continue;
    productCountsBySeries.set(product.series_matecode, (productCountsBySeries.get(product.series_matecode) ?? 0) + 1);
  }

  const summary = new Map();
  for (const series of batch.series) {
    const categoryId = series.category_legacy_id == null ? null : String(series.category_legacy_id);
    const key = categoryId ?? "(empty)";
    const current = summary.get(key) ?? {
      category_legacy_id: categoryId,
      source_category_exists: categoryId !== null && sourceCategoryIds.has(categoryId),
      series_count: 0,
      product_count: 0,
    };
    current.series_count += 1;
    current.product_count += productCountsBySeries.get(series.matecode) ?? 0;
    summary.set(key, current);
  }
  return [...summary.values()].sort((left, right) => {
    if (left.source_category_exists !== right.source_category_exists) {
      return left.source_category_exists ? -1 : 1;
    }
    return String(left.category_legacy_id).localeCompare(String(right.category_legacy_id));
  });
}

export function partitionLegacyBatch(batch) {
  const review = [];
  const reject = [];
  const seriesByCode = groups(batch.series, "matecode");
  const productByOrder = groups(batch.products, "order_no");

  const readyCategories = [];
  for (const row of batch.categories) {
    if (!row.legacy_id || !row.name) {
      reject.push(issue("INVALID_CATEGORY", "category", row, "category legacy_id and name are required"));
      continue;
    }
    readyCategories.push(row);
  }
  const readyCategoryIds = new Set(readyCategories.map((row) => String(row.legacy_id)));

  const readySeries = [];
  const seriesReviewReasons = new Map();
  for (const row of batch.series) {
    if (!row.matecode) {
      review.push(issue("MISSING_SERIES_MATECODE", "series", row, "series matecode is empty"));
      seriesReviewReasons.set(row.matecode, "MISSING_SERIES_MATECODE");
    } else if ((seriesByCode.get(row.matecode)?.length ?? 0) > 1) {
      review.push(issue("DUPLICATE_MATECODE", "series", row, `matecode ${row.matecode} occurs more than once`));
      seriesReviewReasons.set(row.matecode, "DUPLICATE_MATECODE");
    } else if (!row.name) {
      review.push(issue("MISSING_SERIES_NAME", "series", row, "series name is empty"));
      seriesReviewReasons.set(row.matecode, "MISSING_SERIES_NAME");
    } else if (!readyCategoryIds.has(String(row.category_legacy_id))) {
      review.push(issue("UNKNOWN_CATEGORY", "series", row, `category ${row.category_legacy_id} is not active in the snapshot`));
      seriesReviewReasons.set(row.matecode, "SERIES_CATEGORY_REVIEW");
    } else {
      readySeries.push(row);
    }
  }

  const readySeriesCodes = new Set(readySeries.map((row) => row.matecode));
  const readyProducts = [];
  for (const row of batch.products) {
    if (!row.order_no) {
      review.push(issue("MISSING_ORDER_NO", "product", row, "product order_no is empty"));
    } else if ((productByOrder.get(row.order_no)?.length ?? 0) > 1) {
      review.push(issue("DUPLICATE_ORDER_NO", "product", row, `order_no ${row.order_no} occurs more than once`));
    } else if (!row.series_matecode || !seriesByCode.has(row.series_matecode)) {
      review.push(issue("ORPHAN_SERIES", "product", row, `series ${row.series_matecode ?? "(empty)"} does not exist in the series batch`));
    } else if (seriesReviewReasons.has(row.series_matecode)) {
      const reason = seriesReviewReasons.get(row.series_matecode);
      review.push(issue(reason === "DUPLICATE_MATECODE" ? "DUPLICATE_MATECODE" : "SERIES_CATEGORY_REVIEW", "product", row, `series ${row.series_matecode} is blocked by ${reason}`));
    } else if (!readySeriesCodes.has(row.series_matecode)) {
      review.push(issue("SERIES_CATEGORY_REVIEW", "product", row, `series ${row.series_matecode} is not a unique ready series`));
    } else if (!row.title) {
      review.push(issue("MISSING_PRODUCT_TITLE", "product", row, "product title is empty"));
    } else {
      readyProducts.push(row);
    }
  }

  return {
    ready: { categories: readyCategories, series: readySeries, products: readyProducts },
    review,
    reject,
    counts: {
      ready: { categories: readyCategories.length, series: readySeries.length, products: readyProducts.length },
      review: review.length,
      reject: reject.length,
    },
  };
}
