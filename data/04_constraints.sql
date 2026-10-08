-- DEGSON 内容身份约束（MySQL 8）
-- 执行前必须先运行 verify_constraints.mjs 和业务重复数据裁决。

SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'category_translations' AND index_name = 'uq_category_translations_parent_language') = 0, 'ALTER TABLE category_translations ADD UNIQUE KEY uq_category_translations_parent_language (category_id, language)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'series_translations' AND index_name = 'uq_series_translations_parent_language') = 0, 'ALTER TABLE series_translations ADD UNIQUE KEY uq_series_translations_parent_language (series_id, language)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'product_translations' AND index_name = 'uq_product_translations_parent_language') = 0, 'ALTER TABLE product_translations ADD UNIQUE KEY uq_product_translations_parent_language (product_id, language)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'news_translations' AND index_name = 'uq_news_translations_parent_language') = 0, 'ALTER TABLE news_translations ADD UNIQUE KEY uq_news_translations_parent_language (news_id, language)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'category_translations' AND index_name = 'uq_category_translations_language_slug') = 0, 'ALTER TABLE category_translations ADD UNIQUE KEY uq_category_translations_language_slug (language, slug)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'series_translations' AND index_name = 'uq_series_translations_language_slug') = 0, 'ALTER TABLE series_translations ADD UNIQUE KEY uq_series_translations_language_slug (language, slug)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'product_translations' AND index_name = 'uq_product_translations_language_slug') = 0, 'ALTER TABLE product_translations ADD UNIQUE KEY uq_product_translations_language_slug (language, slug)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'news_translations' AND index_name = 'uq_news_translations_language_slug') = 0, 'ALTER TABLE news_translations ADD UNIQUE KEY uq_news_translations_language_slug (language, slug)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
