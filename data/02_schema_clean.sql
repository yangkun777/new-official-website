-- ============================================================================
-- DEGSON 全栈试点：清洁模型建表（DDL）
-- 目标库：本地 MySQL 8.0  degson_pilot
-- 用法：mysql -h 127.0.0.1 -P 3307 -u root -p < 02_schema_clean.sql
-- 可重复执行（先按外键顺序 DROP）
-- ============================================================================

CREATE DATABASE IF NOT EXISTS degson_pilot
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE degson_pilot;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS series;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS site_settings;
SET FOREIGN_KEY_CHECKS = 1;

-- ============ 1. 分类（一/二/三级共用一张表，用 level + parent_id 表达层级）============
CREATE TABLE category (
  id          INT UNSIGNED  NOT NULL COMMENT '沿用旧 article id，便于与旧站对照',
  name        VARCHAR(255)  NOT NULL,
  slug        VARCHAR(128)  NOT NULL,
  level       TINYINT       NOT NULL DEFAULT 3 COMMENT '1/2/3 级',
  parent_id   INT UNSIGNED  NULL,
  description TEXT          NULL,
  image       VARCHAR(512)  NULL COMMENT '先用 URL 字符串；正式版换 Directus Files 资产管理',
  sort        INT           NOT NULL DEFAULT 0,
  status      VARCHAR(16)   NOT NULL DEFAULT 'published' COMMENT 'published/draft',
  PRIMARY KEY (id),
  UNIQUE KEY uk_category_slug (slug),
  KEY idx_category_parent (parent_id),
  CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES category (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品分类';

-- ============ 2. 系列 ============
CREATE TABLE series (
  id          INT UNSIGNED  NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  matecode    VARCHAR(32)   NOT NULL COMMENT '系列码，旧库 matecode',
  category_id INT UNSIGNED  NULL COMMENT '所属三级分类',
  description TEXT          NULL,
  image       VARCHAR(512)  NULL,
  sort        INT           NOT NULL DEFAULT 0,
  status      VARCHAR(16)   NOT NULL DEFAULT 'published',
  PRIMARY KEY (id),
  UNIQUE KEY uk_series_matecode (matecode),
  KEY idx_series_category (category_id),
  CONSTRAINT fk_series_category FOREIGN KEY (category_id) REFERENCES category (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品系列';

-- ============ 3. 产品（订货号 = 变体）============
CREATE TABLE product (
  id             INT UNSIGNED NOT NULL,
  title          VARCHAR(255) NOT NULL COMMENT '型号',
  order_no       VARCHAR(64)  NOT NULL COMMENT '订货号，旧库 text 列',
  series_id      INT UNSIGNED NOT NULL,
  poles          VARCHAR(16)  NULL COMMENT '极数，旧库 text2，形如 03P',
  pitch          VARCHAR(16)  NULL COMMENT '节距，旧库 text1',
  combined_title VARCHAR(255) NULL COMMENT '完整型号',
  status         VARCHAR(16)  NOT NULL DEFAULT 'published',
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_order_no (order_no),
  KEY idx_product_series (series_id),
  CONSTRAINT fk_product_series FOREIGN KEY (series_id) REFERENCES series (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品变体';

-- ============ 4. 站点设置（单例，演示"配置项驱动全站"）============
CREATE TABLE site_settings (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  site_name        VARCHAR(128) NOT NULL DEFAULT 'DEGSON',
  site_description VARCHAR(512) NULL,
  hero_title       VARCHAR(255) NULL,
  hero_subtitle    VARCHAR(255) NULL,
  footer_text      VARCHAR(512) NULL,
  contact_email    VARCHAR(128) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站点设置（单例）';
