-- ============================================================================
-- DEGSON 全栈试点：播种（从原始表 hr_article 生成清洁模型数据）
-- 前置：02_schema_clean.sql 已执行；01_legacy_subset.sql 已导入（hr_article 17,245 行 / hr_category 183 行）
-- 用法：mysql -h 127.0.0.1 -P 3307 -u root -p degson_pilot < 03_seed.sql
-- 需要 MySQL 8.0（窗口函数）；可重复执行
-- 预期结果：category 5 / series 60 / product 378 / site_settings 1
-- ============================================================================
USE degson_pilot;
SET NAMES utf8mb4;

-- 清空（外键顺序），保证可重复执行
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE product;
TRUNCATE TABLE series;
TRUNCATE TABLE category;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------- ① 分类：一级 + 二级（先插父，保证外键成立）----------
INSERT INTO category (id, name, slug, level, parent_id, description, image, sort, status)
SELECT id, title,
       LOWER(REPLACE(REPLACE(REPLACE(title, '/', '-'), ' ', '-'), '&', 'and')),
       CASE catid WHEN 547 THEN 1 WHEN 548 THEN 2 ELSE 3 END,
       NULLIF(relationid, 0), NULLIF(description, ''), NULLIF(thumb, ''),
       listorder, 'published'
FROM hr_article
WHERE language='en' AND status=1 AND id IN (231579, 231580)
ORDER BY catid;                      -- 231579 'Terminal Blocks' 先于 231580

-- ---------- ② 分类：三个三级分类 ----------
INSERT INTO category (id, name, slug, level, parent_id, description, image, sort, status)
SELECT id, title,
       LOWER(REPLACE(REPLACE(REPLACE(title, '/', '-'), ' ', '-'), '&', 'and')),
       3, NULLIF(relationid, 0), NULLIF(description, ''), NULLIF(thumb, ''),
       listorder, 'published'
FROM hr_article
WHERE language='en' AND status=1 AND id IN (231582, 231583, 231584)
ORDER BY id;                         -- PCB Plug / PCB Socket / DIN-Rail-Panel Mounting Connector

-- ---------- ③ 系列：3 个三级分类各取 20 个 ----------
-- 先按 matecode 去重（取 id 最小行）——实测 classify=231583 有 3 个重复 matecode
-- 再按 (listorder DESC, id) 取每个分类前 20
INSERT INTO series (id, name, matecode, category_id, description, image, sort, status)
SELECT id, title, matecode, CAST(classify AS UNSIGNED),
       COALESCE(NULLIF(description3, ''), NULLIF(description, '')),
       NULLIF(thumb, ''), listorder, 'published'
FROM (
  SELECT t2.*, ROW_NUMBER() OVER (PARTITION BY t2.classify ORDER BY t2.listorder DESC, t2.id) AS rn
  FROM (
    SELECT a.id, a.title, a.matecode, a.classify, a.description, a.description3, a.thumb, a.listorder,
           ROW_NUMBER() OVER (PARTITION BY a.matecode ORDER BY a.id) AS mrn
    FROM hr_article a
    WHERE a.catid=550 AND a.language='en' AND a.status=1
      AND a.classify IN ('231582','231583','231584')
  ) t2
  WHERE t2.mrn = 1
) t3
WHERE t3.rn <= 20;

-- ---------- ④ 产品：挂在已播种的系列下（按 matecode 归系列）----------
INSERT INTO product (id, title, order_no, series_id, poles, pitch, combined_title, status)
SELECT a.id, a.title, a.text, s.id,
       NULLIF(a.text2, ''), NULLIF(a.text1, ''), NULLIF(a.combined_title, ''),
       'published'
FROM hr_article a
JOIN series s ON s.matecode = a.matecode
WHERE a.catid=552 AND a.language='en' AND a.status=1
  AND a.text IS NOT NULL AND a.text <> ''
ORDER BY a.id;

-- ---------- ⑤ 站点设置（单例）----------
INSERT INTO site_settings (id, site_name, site_description, hero_title, hero_subtitle, footer_text, contact_email)
VALUES (1, 'DEGSON', 'Connect with confidence',
        'Connect with confidence', 'Terminal blocks, connectors and industrial components',
        '© DEGSON. All rights reserved.', 'info@degson.com')
ON DUPLICATE KEY UPDATE site_name=VALUES(site_name);
