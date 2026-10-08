/**
 * Legacy database -> new content model contract.
 *
 * This module deliberately does not connect to the source database. A later
 * extractor can feed rows from a read-only export into mapLegacyBatch(), while
 * keeping normalization and identity checks identical across dry runs.
 */

export const LEGACY_FIELD_MAP = {
  category: {
    id: "catid",
    parent_id: "parentid",
    name: "engname / en_catname / catname",
    image: "image",
  },
  series: {
    id: "id",
    category_id: "classify",
    matecode: "matecode",
    name: "title",
    image: "thumb",
    description: "description",
  },
  product: {
    id: "id",
    series_matecode: "matecode",
    order_no: "text",
    title: "title",
    pitch: "text1",
    poles: "text2",
    image: "thumb",
    description: "description",
  },
};

export function normalizeText(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).replace(/\s+/g, " ").trim();
  return normalized || null;
}

export function normalizeIdentity(value) {
  return normalizeText(value);
}

function normalizeNumber(value, field, errors, legacyId) {
  const normalized = normalizeText(value);
  if (normalized === null) return null;
  const number = Number(normalized);
  if (!Number.isFinite(number)) {
    errors.push(`invalid ${field} for legacy row ${legacyId}: ${normalized}`);
    return null;
  }
  return number;
}

function mapCategory(row, language) {
  return {
    legacy_id: row.catid,
    parent_legacy_id: row.parent_id ?? row.parentid ?? row.relationid ?? null,
    name: normalizeText(row.name ?? row.engname ?? row.en_catname ?? row.catname ?? row.title ?? row.classify),
    image: normalizeText(row.image ?? row.thumb),
    language,
  };
}

function mapSeries(row, language) {
  return {
    legacy_id: row.id,
    category_legacy_id: row.category_id ?? row.classify ?? row.catid,
    matecode: normalizeIdentity(row.matecode),
    name: normalizeText(row.name ?? row.title ?? row.classify ?? row.matecode),
    image: normalizeText(row.thumb),
    language,
  };
}

function mapProduct(row, language, errors) {
  const orderNo = normalizeIdentity(row.text);
  const seriesMatecode = normalizeIdentity(row.matecode);
  if (!orderNo) errors.push(`missing product.order_no for legacy row ${row.id}`);
  if (!seriesMatecode) errors.push(`missing product.series_matecode for legacy row ${row.id}`);

  return {
    legacy_id: row.id,
    series_matecode: seriesMatecode,
    order_no: orderNo,
    title: normalizeText(row.title),
    pitch: normalizeNumber(row.text1, "product.pitch", errors, row.id),
    poles: normalizeNumber(row.text2, "product.poles", errors, row.id),
    image: normalizeText(row.thumb),
    description: normalizeText(row.description),
    language,
  };
}

export function mapLegacyBatch({ language = "en", categories = [], series = [], products = [] }) {
  const errors = [];
  const mapped = {
    language,
    categories: categories.map((row) => mapCategory(row, language)),
    series: series.map((row) => mapSeries(row, language)),
    products: products.map((row) => mapProduct(row, language, errors)),
    errors,
  };
  return mapped;
}

export function validateMigrationBatch(batch) {
  const errors = [...(batch.errors ?? [])];
  const warnings = [];
  const seriesCodes = new Map();
  const orderNumbers = new Map();
  const seriesIds = new Set(batch.series.map((row) => row.matecode).filter(Boolean));

  for (const row of batch.series) {
    if (!row.matecode) errors.push(`missing series.matecode for legacy row ${row.legacy_id}`);
    if (row.matecode && seriesCodes.has(row.matecode)) {
      errors.push(`duplicate series.matecode: ${row.matecode}`);
    }
    if (row.matecode) seriesCodes.set(row.matecode, row.legacy_id);
    if (!row.name) warnings.push(`blank series name for legacy row ${row.legacy_id}`);
  }

  for (const row of batch.products) {
    if (row.order_no && orderNumbers.has(row.order_no)) {
      errors.push(`duplicate product.order_no: ${row.order_no}`);
    }
    if (row.order_no) orderNumbers.set(row.order_no, row.legacy_id);
    if (row.series_matecode && !seriesIds.has(row.series_matecode)) {
      errors.push(`orphan product.series_matecode: ${row.series_matecode}`);
    }
    if (!row.title) warnings.push(`blank product title for legacy row ${row.legacy_id}`);
  }

  return { errors, warnings };
}
