-- ============================================================
--  Danson Portfolio — full data export
--  Generated: 2026-06-27
--  Portable SQL (tested against SQLite / MySQL / PostgreSQL).
--  Run order matters: schema first, then data (FKs enforced).
-- ============================================================

-- ----------------------------------------------------------------
--  DROP (idempotent re-import)
-- ----------------------------------------------------------------
DROP TABLE IF EXISTS project_images;
DROP TABLE IF EXISTS project_tags;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS stats;
DROP TABLE IF EXISTS profile;

-- ----------------------------------------------------------------
--  SCHEMA
-- ----------------------------------------------------------------
CREATE TABLE profile (
  id            INTEGER PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  heading       VARCHAR(150)  NOT NULL,   -- about-section title
  bio_1         TEXT          NOT NULL,   -- first paragraph
  bio_2         TEXT          NOT NULL,   -- second paragraph
  email         VARCHAR(150),
  location      VARCHAR(100)
);

CREATE TABLE stats (
  id            INTEGER PRIMARY KEY,
  label         VARCHAR(60)   NOT NULL,
  value         INTEGER       NOT NULL,
  suffix        VARCHAR(10),
  sort_order    INTEGER       NOT NULL DEFAULT 0
);

CREATE TABLE skills (
  id            INTEGER PRIMARY KEY,
  name          VARCHAR(80)   NOT NULL,
  icon          VARCHAR(120),             -- logo file or icon key
  icon_type     VARCHAR(20)   NOT NULL,   -- 'brand' = real logo, 'line' = drawn icon
  sort_order    INTEGER       NOT NULL DEFAULT 0
);

CREATE TABLE projects (
  id             INTEGER PRIMARY KEY,
  slug           VARCHAR(80)   NOT NULL UNIQUE,  -- data-lightbox id (NULL-ish for placeholders)
  title          VARCHAR(120)  NOT NULL,
  category       VARCHAR(20)   NOT NULL,         -- web | design | app
  description    TEXT          NOT NULL,
  cover_image    VARCHAR(200),                   -- card thumbnail
  external_url   VARCHAR(255),                   -- live site / play link
  external_label VARCHAR(60),                    -- button text
  has_gallery    INTEGER       NOT NULL DEFAULT 0,
  sort_order     INTEGER       NOT NULL DEFAULT 0
);

CREATE TABLE project_tags (
  id            INTEGER PRIMARY KEY,
  project_id    INTEGER       NOT NULL,
  tag           VARCHAR(60)   NOT NULL,
  sort_order    INTEGER       NOT NULL DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE project_images (
  id            INTEGER PRIMARY KEY,
  project_id    INTEGER       NOT NULL,
  image_path    VARCHAR(200)  NOT NULL,
  alt_text      VARCHAR(150),
  sort_order    INTEGER       NOT NULL DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- ----------------------------------------------------------------
--  DATA — profile
-- ----------------------------------------------------------------
INSERT INTO profile (id, name, heading, bio_1, bio_2, email, location) VALUES
(1, 'Danson', '3D Designer & AI Developer',
 'I''m a 3D designer and AI developer with a passion for creating bold, immersive, and visually striking digital experiences. I love blending 3D design with intelligent technology to build products that feel alive.',
 'From modeling and rendering in 3D to building AI-powered tools and applications, I bring ideas to life through thoughtful execution, creative experimentation, and obsessive attention to detail.',
 'hello@danson.dev', 'Malaysia');

-- ----------------------------------------------------------------
--  DATA — stats
-- ----------------------------------------------------------------
INSERT INTO stats (id, label, value, suffix, sort_order) VALUES
(1, 'Projects',  50, '+', 1),
(2, 'Clients',   30, '+', 2),
(3, 'Years Exp.', 5, '+', 3);

-- ----------------------------------------------------------------
--  DATA — skills ("What I Do")
-- ----------------------------------------------------------------
INSERT INTO skills (id, name, icon, icon_type, sort_order) VALUES
(1,  '3D Modeling',       'cube',                       'line',  1),
(2,  'Maya',              'images/logos/autodeskmaya.svg',     'brand', 2),
(3,  'Substance Painter', 'brush',                      'line',  3),
(4,  '3D Rendering',      'sun',                        'line',  4),
(5,  'AI Development',     'cpu',                        'line',  5),
(6,  'Web Development',    'code',                       'line',  6),
(7,  'React',             'images/logos/react.svg',            'brand', 7),
(8,  'JavaScript',        'images/logos/javascript.svg',       'brand', 8),
(9,  'UI/UX Design',      'layout',                     'line',  9),
(10, 'Figma',             'images/logos/figma.svg',            'brand', 10),
(11, 'Photoshop',         'images/logos/adobephotoshop.svg',   'brand', 11),
(12, 'Illustrator',       'images/logos/adobeillustrator.svg', 'brand', 12);

-- ----------------------------------------------------------------
--  DATA — projects
-- ----------------------------------------------------------------
INSERT INTO projects (id, slug, title, category, description, cover_image, external_url, external_label, has_gallery, sort_order) VALUES
(1, 'alien-vs-malaysian', 'Alien Vs Malaysian', 'web',
   'A fun web-based game where Malaysians defend their homeland against alien invaders. Features 4 unique game modes — shoot, throw, kick, and target practice. Supports 1 & 2 players.',
   'images/alien-vs-malaysian/game-1.png', 'https://dansonhar.github.io/Alien_VS_Malaysia_Web/', 'Play Game', 1, 1),
(2, '3d-house', '3D Wooden House', 'design',
   'A detailed 3D wooden house, modeled in Maya, textured in Substance Painter, and rendered for a warm, realistic finish. A study in materials, lighting, and architectural form.',
   'images/3d-house/house-1.png', NULL, NULL, 1, 2),
(3, '3d-rube-goldberg', '3D Rube Goldberg', 'design',
   'A 3D Rube Goldberg machine — a deliberately over-engineered chain-reaction contraption, modeled in Maya, textured in Substance Painter, and rendered.',
   'images/3d-rube-goldberg/rube-goldberg-1.png', NULL, NULL, 1, 3),
(4, 'brand-identity', 'Brand Identity Design', 'design',
   'Complete visual identity system with logo and brand guidelines.',
   NULL, NULL, NULL, 0, 4),
(5, 'qpos', 'Qbot Support Center', 'web',
   'A help desk and knowledge base portal built for SUPERPOS POS users. Users can browse help articles by category, read step-by-step guides, and find solutions instantly — reducing reliance on direct support.',
   'images/qpos/qbot-home.png', 'https://support.qbot.now', 'Visit Website', 1, 5),
(6, 'qparking', 'QParking', 'web',
   'An online parking management platform built at parking.qbot.now. Users can book and manage parking spaces, view rates, and handle reservations seamlessly across desktop and mobile.',
   'images/qparking/park1.png', 'https://parking.qbot.now', 'Visit Website', 1, 6),
(7, 'marketing-campaign', 'Marketing Campaign', 'design',
   'Multi-channel campaign design with social media assets.',
   NULL, NULL, NULL, 0, 7),
(8, 'self-service-kiosk', 'Self-Service Kiosk', 'app',
   'Touch-friendly kiosk interface for self-checkout ordering.',
   NULL, NULL, NULL, 0, 8);

-- ----------------------------------------------------------------
--  DATA — project_tags
-- ----------------------------------------------------------------
INSERT INTO project_tags (id, project_id, tag, sort_order) VALUES
(1,  1, 'Web Game', 1), (2, 1, 'JavaScript', 2), (3, 1, '2D', 3), (4, 1, 'Multiplayer', 4),
(5,  2, '3D Design', 1), (6, 2, 'Maya', 2), (7, 2, 'Substance Painter', 3), (8, 2, 'Render', 4),
(9,  3, '3D Design', 1), (10, 3, 'Maya', 2), (11, 3, 'Substance Painter', 3), (12, 3, 'Render', 4),
(13, 4, 'Brand Identity', 1), (14, 4, 'Graphic Design', 2),
(15, 5, 'Web App', 1), (16, 5, 'Support System', 2), (17, 5, 'SUPERPOS', 3),
(18, 6, 'Web App', 1), (19, 6, 'Parking System', 2), (20, 6, 'QBOT', 3),
(21, 7, 'Marketing', 1), (22, 7, 'Graphic Design', 2),
(23, 8, 'Kiosk', 1), (24, 8, 'UI Design', 2);

-- ----------------------------------------------------------------
--  DATA — project_images (gallery slides)
-- ----------------------------------------------------------------
INSERT INTO project_images (id, project_id, image_path, alt_text, sort_order) VALUES
-- Alien Vs Malaysian
(1,  1, 'images/alien-vs-malaysian/game-1.png', 'Main Menu',       1),
(2,  1, 'images/alien-vs-malaysian/game-2.png', 'Gameplay',        2),
(3,  1, 'images/alien-vs-malaysian/game-3.png', 'Baldi Airstrike', 3),
(4,  1, 'images/alien-vs-malaysian/game-4.png', 'Salah Tembak',    4),
(5,  1, 'images/alien-vs-malaysian/game-5.png', 'Soccer Game',     5),
-- 3D Wooden House
(6,  2, 'images/3d-house/house-1.png', 'View 1', 1),
(7,  2, 'images/3d-house/house-2.png', 'View 2', 2),
-- 3D Rube Goldberg
(8,  3, 'images/3d-rube-goldberg/rube-goldberg-1.png', 'Render', 1),
-- Qbot Support Center
(9,  5, 'images/qpos/qbot-home.png',     'Home',       1),
(10, 5, 'images/qpos/qbot-category.png', 'Categories', 2),
(11, 5, 'images/qpos/qbot-article.png',  'Article',    3),
-- QParking
(12, 6, 'images/qparking/park1.png',       'Screen 1',    1),
(13, 6, 'images/qparking/park2.png',       'Screen 2',    2),
(14, 6, 'images/qparking/park3.png',       'Screen 3',    3),
(15, 6, 'images/qparking/park4.png',       'Screen 4',    4),
(16, 6, 'images/qparking/park4_mobile.png','Mobile view', 5),
(17, 6, 'images/qparking/park5.png',       'Screen 5',    6);

-- ============================================================
--  END
-- ============================================================
