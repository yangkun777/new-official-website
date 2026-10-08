-- DEGSON 新模型自检（Directus 11 / MySQL 8）
-- 用法：mysql --host=127.0.0.1 --port=3307 --user=root --password degson_pilot < 99_verify.sql
USE degson_pilot;

-- 1) 业务行数总览（demo 基线：category=5 / series=60 / product=378）
SELECT (SELECT COUNT(*) FROM category) AS categories,
       (SELECT COUNT(*) FROM series) AS series,
       (SELECT COUNT(*) FROM product) AS products,
       (SELECT COUNT(*) FROM site_settings) AS settings;

-- 2) 翻译行总览与语言分布
SELECT 'category' AS entity, language, COUNT(*) AS rows_count FROM category_translations GROUP BY language
UNION ALL
SELECT 'series', language, COUNT(*) FROM series_translations GROUP BY language
UNION ALL
SELECT 'product', language, COUNT(*) FROM product_translations GROUP BY language
UNION ALL
SELECT 'news', language, COUNT(*) FROM news_translations GROUP BY language
ORDER BY entity, language;

-- 3) 分类树和翻译可用性
SELECT c.id, c.level, c.parent_id, c.status, t.language, t.name, t.slug
FROM category c
LEFT JOIN category_translations t ON t.category_id = c.id
ORDER BY c.level, c.id, t.language;

-- 4) 每个三级分类下的系列数
SELECT c.id, c.level, COUNT(s.id) AS series_count
FROM category c
LEFT JOIN series s ON s.category_id = c.id
WHERE c.level = 3
GROUP BY c.id, c.level
ORDER BY c.id;

-- 5) 变体数分布
SELECT MIN(v) AS min_variants, MAX(v) AS max_variants, ROUND(AVG(v), 1) AS avg_variants
FROM (SELECT series_id, COUNT(*) AS v FROM product GROUP BY series_id) counts;

-- 6) 订货号和系列码唯一性
SELECT COUNT(*) AS products, COUNT(DISTINCT order_no) AS unique_order_no FROM product;
SELECT COUNT(*) AS series, COUNT(DISTINCT matecode) AS unique_matecode FROM series;

-- 7) 空壳系列和孤立翻译行
SELECT COUNT(*) AS empty_series
FROM series s LEFT JOIN product p ON p.series_id = s.id
WHERE p.id IS NULL;

SELECT 'category_translations' AS collection, COUNT(*) AS orphan_rows
FROM category_translations t LEFT JOIN category c ON c.id = t.category_id WHERE c.id IS NULL
UNION ALL
SELECT 'series_translations', COUNT(*) FROM series_translations t LEFT JOIN series s ON s.id = t.series_id WHERE s.id IS NULL
UNION ALL
SELECT 'product_translations', COUNT(*) FROM product_translations t LEFT JOIN product p ON p.id = t.product_id WHERE p.id IS NULL
UNION ALL
SELECT 'news_translations', COUNT(*) FROM news_translations t LEFT JOIN news n ON n.id = t.news_id WHERE n.id IS NULL;

-- 8) 约束是否已落库
SELECT table_name, index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS index_columns
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND index_name LIKE 'uq\\_%'
GROUP BY table_name, index_name
ORDER BY table_name, index_name;
