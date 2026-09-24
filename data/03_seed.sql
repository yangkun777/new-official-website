-- ============================================================================
-- DEGSON 全栈试点 M0.3：播种（从旧库底料 degson_legacy 生成新模型数据）
--
-- 前置：
--   1) 旧库底料在 degson_legacy（hr_article / hr_category）
--   2) 新模型已由 cms/snapshot.yaml 建立（10 个集合）
--   3) Directus 11 已 bootstrap
--
-- 用法：mysql -h127.0.0.1 -P3307 -uroot -p < data/03_seed.sql
-- 需要 MySQL 8.0（窗口函数）；可重复执行
--
-- 设计要点：
--   * 语言无关字段进主表，可翻译字段进 *_translations（name/slug/描述/SEO）
--   * 只播 en 翻译行；zh 故意留空 → 用于验证「缺翻译回退 en」机制
--   * 语言码统一 en / zh（不再用 en-US / zh-CN）
--
-- 预期结果：
--   category 5 / category_translations 5
--   series 60 / series_translations 60
--   product 378 / product_translations 378
--   news 1 / news_translations 2
--   site_settings 1 / languages 2
-- ============================================================================
USE degson_pilot;
SET NAMES utf8mb4;

-- ---------- 清空（外键逆序），保证可重复执行 ----------
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE product_translations;
TRUNCATE TABLE product;
TRUNCATE TABLE series_translations;
TRUNCATE TABLE series;
TRUNCATE TABLE category_translations;
TRUNCATE TABLE category;
TRUNCATE TABLE news_translations;
TRUNCATE TABLE news;
TRUNCATE TABLE site_settings;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- ① category 主表：先父后子（一级 547 + 二级 548），再三级 549
-- ============================================================================
INSERT INTO category (id, level, parent_id, image, sort, status)
SELECT id,
       CASE catid WHEN 547 THEN 1 WHEN 548 THEN 2 ELSE 3 END,
       NULLIF(relationid, 0),
       NULLIF(thumb, ''),
       listorder,
       'published'
FROM degson_legacy.hr_article
WHERE language = 'en' AND status = 1 AND id IN (231579, 231580)
ORDER BY catid;                              -- 231579 Terminal Blocks 先于 231580

INSERT INTO category (id, level, parent_id, image, sort, status)
SELECT id, 3, NULLIF(relationid, 0), NULLIF(thumb, ''), listorder, 'published'
FROM degson_legacy.hr_article
WHERE language = 'en' AND status = 1 AND id IN (231582, 231583, 231584)
ORDER BY id;                                 -- PCB Plug / PCB Socket / DIN-Rail-Panel Mounting

-- ============================================================================
-- ② category_translations（en）
-- ============================================================================
INSERT INTO category_translations (language, category_id, name, slug, short_description)
SELECT 'en', id,
       title,
       LOWER(REPLACE(REPLACE(REPLACE(title, '/', '-'), ' ', '-'), '&', 'and')),
       NULLIF(description, '')
FROM degson_legacy.hr_article
WHERE language = 'en' AND status = 1
  AND id IN (231579, 231580, 231582, 231583, 231584);

-- ============================================================================
-- ③ series 主表：3 个三级分类各取 20 个
--    先按 matecode 去重（取 id 最小行）；实测 classify=231583 有 3 个重复 matecode
-- ============================================================================
INSERT INTO series (id, matecode, category_id, image, sort, status)
SELECT id, matecode, CAST(classify AS UNSIGNED), NULLIF(thumb, ''), listorder, 'published'
FROM (
  SELECT t2.*, ROW_NUMBER() OVER (PARTITION BY t2.classify ORDER BY t2.listorder DESC, t2.id) AS rn
  FROM (
    SELECT a.id, a.matecode, a.classify, a.thumb, a.listorder,
           ROW_NUMBER() OVER (PARTITION BY a.matecode ORDER BY a.id) AS mrn
    FROM degson_legacy.hr_article a
    WHERE a.catid = 550 AND a.language = 'en' AND a.status = 1
      AND a.classify IN ('231582', '231583', '231584')
  ) t2
  WHERE t2.mrn = 1
) t3
WHERE t3.rn <= 20;

-- ============================================================================
-- ④ series_translations（en）—— 按 id 关联（数字键，避开跨库 collation）
-- ============================================================================
INSERT INTO series_translations (language, series_id, name, slug, short_description)
SELECT 'en', s.id,
       COALESCE(NULLIF(a.title, ''), s.matecode),
       LOWER(REPLACE(REPLACE(REPLACE(COALESCE(NULLIF(a.title, ''), s.matecode), '/', '-'), ' ', '-'), '&', 'and')),
       COALESCE(NULLIF(a.description3, ''), NULLIF(a.description, ''))
FROM series s
JOIN degson_legacy.hr_article a ON a.id = s.id;

-- ============================================================================
-- ⑤ product 主表（订货号 = 变体）
-- ============================================================================
INSERT INTO product (id, title, order_no, series_id, poles, pitch, combined_title, status)
SELECT a.id, a.title, a.text, s.id,
       NULLIF(a.text2, ''), NULLIF(a.text1, ''), NULLIF(a.combined_title, ''),
       'published'
FROM degson_legacy.hr_article a
JOIN series s ON s.matecode = a.matecode
WHERE a.catid = 552 AND a.language = 'en' AND a.status = 1
  AND a.text IS NOT NULL AND a.text <> ''
ORDER BY a.id;

-- ============================================================================
-- ⑥ product_translations（en）
--    ★ 只播 en，zh 故意留空 —— 用于验证「缺翻译回退 en」与「不生成空壳页」
-- ============================================================================
INSERT INTO product_translations (language, product_id, name, slug)
SELECT 'en', p.id,
       COALESCE(NULLIF(p.combined_title, ''), p.title),
       p.order_no
FROM product p;

-- ============================================================================
-- ⑦ news 主表 + news_translations（en / zh）
--    内容来自 M0.2 界面录入的种子（见 data/_backup_degson_pilot_m02.sql）
--    cover_image 原为旧库 Directus file UUID，新库无此文件 → 置 NULL
-- ============================================================================
INSERT INTO news (id, cover_image, publish_date, sort, status)
VALUES (1, NULL, '2026-09-23', 0, 'published');

INSERT INTO news_translations (language, news_id, name, slug, short_description, description) VALUES
('en', 1,
 'DEGSON Launches New Terminal Blocks',
 'degson-launches-new-terminal-blocks',
 'DEGSON introduces a new generation of PCB terminal blocks for more applications.',
 '<p>DEGSON today announced a new generation of PCB terminal blocks with improved current capacity, reliability and ease of installation for industrial control and power electronics.</p><p>The series supports multiple poles and pitch options to meet diverse customer requirements.</p>'),
('zh', 1,
 '德昌发布新一代接线端子',
 'degson-xin-yidai-jie-xian-duan-zi',
 '德昌电子推出新一代 PCB 接线端子系列，覆盖更多应用场景。',
 '<p>德昌电子今日正式发布新一代 PCB 接线端子系列。新产品在载流能力、可靠性与安装便捷性上全面升级，广泛适用于工业控制、电力电子等领域。</p><p>本次发布的产品支持多种极数与节距选择，可满足不同客户的定制需求。</p>');

-- ============================================================================
-- ⑧ site_settings（单例）
-- ============================================================================
INSERT INTO site_settings (id, site_name, site_description, hero_title, hero_subtitle, footer_text, contact_email)
VALUES (1, 'DEGSON', 'Connect with confidence',
        'Connect with confidence',
        'Terminal blocks, connectors and industrial components',
        '© DEGSON. All rights reserved.',
        'info@degson.com');

-- ============================================================================
-- ⑨ 自检：期望 5/5, 60/60, 378/378, 1/2, 1
-- ============================================================================
SELECT
  (SELECT COUNT(*) FROM category)              AS cat,
  (SELECT COUNT(*) FROM category_translations) AS cat_tr,
  (SELECT COUNT(*) FROM series)                AS ser,
  (SELECT COUNT(*) FROM series_translations)   AS ser_tr,
  (SELECT COUNT(*) FROM product)               AS prod,
  (SELECT COUNT(*) FROM product_translations)  AS prod_tr,
  (SELECT COUNT(*) FROM news)                  AS news,
  (SELECT COUNT(*) FROM news_translations)     AS news_tr,
  (SELECT COUNT(*) FROM site_settings)         AS settings,
  (SELECT COUNT(*) FROM languages)             AS langs;

-- 翻译语言分布（应：全是 en，zh 为 0 → 验证回退机制）
SELECT 'category' AS entity, language, COUNT(*) n FROM category_translations GROUP BY language
UNION ALL SELECT 'series',  language, COUNT(*) FROM series_translations  GROUP BY language
UNION ALL SELECT 'product', language, COUNT(*) FROM product_translations GROUP BY language
UNION ALL SELECT 'news',    language, COUNT(*) FROM news_translations    GROUP BY language;

-- 完整性：订货号唯一 + 无空壳系列
SELECT COUNT(*) AS products,
       COUNT(DISTINCT order_no) AS unique_order_no,
       (SELECT COUNT(*) FROM series s LEFT JOIN product p ON p.series_id = s.id WHERE p.id IS NULL) AS empty_series
FROM product;
