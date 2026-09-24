-- ============================================================================
-- DEGSON 全栈试点：自检（期望值来自 2026-09-23 生产库实测）
-- 用法：mysql -h 127.0.0.1 -P 3307 -u root -p degson_pilot < 99_verify.sql
-- ============================================================================
USE degson_pilot;

-- 1) 行数总览：期望 categories=5 / series=60 / products=378 / settings=1
SELECT (SELECT COUNT(*) FROM category)      AS categories,
       (SELECT COUNT(*) FROM series)        AS series,
       (SELECT COUNT(*) FROM product)       AS products,
       (SELECT COUNT(*) FROM site_settings) AS settings;

-- 2) 底料是否完整：期望 17245 / 183
SELECT (SELECT COUNT(*) FROM hr_article)  AS hr_article_rows,
       (SELECT COUNT(*) FROM hr_category) AS hr_category_rows;

-- 3) 分类树：期望 1 个 level=1、1 个 level=2、3 个 level=3
SELECT id, name, slug, level, parent_id FROM category ORDER BY level, id;

-- 4) 每个三级分类下的系列数：期望各 20
SELECT c.id, c.name, COUNT(s.id) AS series_count
FROM category c LEFT JOIN series s ON s.category_id = c.id
WHERE c.level = 3 GROUP BY c.id, c.name ORDER BY c.id;

-- 5) 变体数分布：期望 min=1 / max=18 / 平均约 6.3
SELECT MIN(v) AS min_variants, MAX(v) AS max_variants, ROUND(AVG(v),1) AS avg_variants
FROM (SELECT series_id, COUNT(*) v FROM product GROUP BY series_id) t;

-- 6) 订货号唯一性：期望 378 / 378（无重复）
SELECT COUNT(*) AS products, COUNT(DISTINCT order_no) AS unique_order_no FROM product;

-- 7) 空壳系列检查：期望 0
SELECT COUNT(*) AS empty_series
FROM series s LEFT JOIN product p ON p.series_id = s.id
WHERE p.id IS NULL;

-- 8) 抽查样例（用于前端验收）：期望 10020003101 → 9EDGK-5.0（PCB Plug 下）
SELECT s.id, s.name, s.matecode, s.category_id, COUNT(p.id) AS variants
FROM series s LEFT JOIN product p ON p.series_id = s.id
GROUP BY s.id ORDER BY s.id LIMIT 5;
