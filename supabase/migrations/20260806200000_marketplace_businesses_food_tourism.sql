-- ── Marketplace listings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID REFERENCES auth.users NOT NULL,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  price       DECIMAL(12,2),
  currency    TEXT DEFAULT 'USD',
  category    TEXT NOT NULL DEFAULT 'Other',
  condition   TEXT DEFAULT 'good',
  governorate TEXT,
  image_url   TEXT,
  status      TEXT DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketplace_select"  ON marketplace_listings;
DROP POLICY IF EXISTS "marketplace_insert"  ON marketplace_listings;
DROP POLICY IF EXISTS "marketplace_update"  ON marketplace_listings;
DROP POLICY IF EXISTS "marketplace_delete"  ON marketplace_listings;
CREATE POLICY "marketplace_select" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "marketplace_insert" ON marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "marketplace_update" ON marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "marketplace_delete" ON marketplace_listings FOR DELETE USING (auth.uid() = seller_id);

-- ── Businesses ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID REFERENCES auth.users,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT DEFAULT '',
  governorate TEXT,
  phone       TEXT,
  website     TEXT,
  logo_url    TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "businesses_select" ON businesses;
DROP POLICY IF EXISTS "businesses_insert" ON businesses;
DROP POLICY IF EXISTS "businesses_update" ON businesses;
CREATE POLICY "businesses_select" ON businesses FOR SELECT USING (true);
CREATE POLICY "businesses_insert" ON businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "businesses_update" ON businesses FOR UPDATE USING (auth.uid() = owner_id);

-- ── Food places ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_places (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  cuisine     TEXT NOT NULL DEFAULT 'Lebanese',
  description TEXT DEFAULT '',
  governorate TEXT,
  address     TEXT,
  phone       TEXT,
  price_range TEXT DEFAULT '$$',
  image_url   TEXT,
  rating      DECIMAL(2,1) DEFAULT 4.0,
  is_featured BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE food_places ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "food_select" ON food_places;
DROP POLICY IF EXISTS "food_insert" ON food_places;
CREATE POLICY "food_select" ON food_places FOR SELECT USING (true);
CREATE POLICY "food_insert" ON food_places FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── Tourism spots ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tourism_spots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Historical',
  description TEXT DEFAULT '',
  governorate TEXT,
  address     TEXT,
  image_url   TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tourism_spots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tourism_select" ON tourism_spots;
DROP POLICY IF EXISTS "tourism_insert" ON tourism_spots;
CREATE POLICY "tourism_select" ON tourism_spots FOR SELECT USING (true);
CREATE POLICY "tourism_insert" ON tourism_spots FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── Seed: food places ─────────────────────────────────────────────
INSERT INTO food_places (name, cuisine, description, governorate, price_range, rating, is_featured) VALUES
('Em Sherif', 'Lebanese', 'Award-winning fine dining restaurant celebrating authentic Lebanese cuisine and hospitality.', 'Beirut', '$$$', 4.9, true),
('Liza Beirut', 'Lebanese', 'Elegant Lebanese restaurant in a stunning 1930s heritage house with a beautiful courtyard garden.', 'Beirut', '$$$', 4.7, true),
('Tawlet', 'Lebanese', 'Farm-to-table concept celebrating regional Lebanese home cooking with a new menu every day.', 'Beirut', '$$', 4.6, true),
('Mayrig', 'Armenian', 'Celebrated Armenian restaurant preserving centuries-old recipes handed down through generations.', 'Beirut', '$$', 4.7, true),
('Barbar', 'Street Food', 'Iconic 24/7 Beirut institution serving the best shawarma, falafel and manakish since 1979.', 'Beirut', '$', 4.5, false),
('Leila', 'Lebanese', 'Stylish Lebanese dining experience with a focus on traditional recipes and fresh local ingredients.', 'Beirut', '$$$', 4.6, false),
('Centrale', 'Mediterranean', 'Upscale restaurant in the heart of Gemmayze with Mediterranean fusion cuisine in a heritage building.', 'Beirut', '$$$', 4.5, false),
('Abd El Wahab', 'Lebanese', 'Classic Lebanese meze and grills in an authentic setting in Achrafieh since 1990.', 'Beirut', '$$', 4.4, false),
('Zaatar w Zeit', 'Street Food', 'Popular chain serving manakish, kaak and Lebanese street food around the clock.', 'Beirut', '$', 4.2, false),
('Babel Bay', 'Lebanese', 'Seafront Lebanese restaurant in Jounieh with stunning views over the bay.', 'Mount Lebanon', '$$', 4.5, false),
('Kahwet Teta', 'Lebanese', 'Traditional home-style Lebanese cooking in a cozy grandmother-inspired setting in the mountains.', 'Mount Lebanon', '$', 4.3, false),
('Fakhreldine', 'Lebanese', 'Renowned fine-dining Lebanese restaurant with an iconic terrace overlooking downtown Beirut.', 'Beirut', '$$$', 4.6, false),
('Urbanista', 'Café', 'Trendy café chain with specialty coffee, brunch dishes and a great work atmosphere.', 'Beirut', '$$', 4.3, false),
('Paul Bakery', 'Café', 'French-inspired bakery and café offering fresh pastries, sandwiches and excellent coffee.', 'Beirut', '$$', 4.2, false),
('Ichiban', 'Japanese', 'Popular Japanese restaurant serving authentic sushi, ramen and bento boxes in Beirut.', 'Beirut', '$$', 4.4, false)
ON CONFLICT DO NOTHING;

-- ── Seed: tourism spots ───────────────────────────────────────────
INSERT INTO tourism_spots (name, category, description, governorate, is_featured) VALUES
('Jeita Grotto', 'Cave', 'One of the world''s most breathtaking cave systems — stunning stalactites, stalagmites and an underground river navigable by boat.', 'Mount Lebanon', true),
('Byblos (Jbeil)', 'Historical', 'One of the oldest continuously inhabited cities on Earth. Ancient Phoenician port, crusader castle, Roman ruins and lively souk.', 'North Lebanon', true),
('Baalbek Temples', 'Historical', 'The largest Roman temple complex ever built — the Temple of Jupiter and Bacchus are UNESCO World Heritage wonders.', 'Bekaa', true),
('Cedars of God', 'Nature', 'A sacred forest of ancient cedar trees, some over 3,000 years old, mentioned in the Bible. Breathtaking in every season.', 'North Lebanon', true),
('Pigeon Rocks (Raouche)', 'Nature', 'Beirut''s most iconic landmark — dramatic natural rock arches rising from the Mediterranean off the Raouche corniche.', 'Beirut', true),
('Harissa & Our Lady of Lebanon', 'Religious', 'A giant bronze statue of the Virgin Mary overlooking Jounieh Bay, accessible by cable car with panoramic coastal views.', 'Mount Lebanon', false),
('Beiteddine Palace', 'Historical', 'A magnificent 19th-century palace complex in the Chouf mountains — now a museum and summer venue for Lebanon''s president.', 'Mount Lebanon', false),
('Qadisha Valley', 'Nature', 'A UNESCO World Heritage gorge with monasteries carved into cliffsides, ancient hermitages and dramatic mountain scenery.', 'North Lebanon', false),
('Tyre (Sour)', 'Historical', 'Ancient Phoenician city with impressive Roman ruins — hippodrome, necropolis, colonnaded road — and pristine sandy beaches.', 'South Lebanon', false),
('Ehden & Horsh Ehden', 'Nature', 'A charming mountain town at 1,500m surrounded by cedar forests, waterfalls, apple orchards and the Horsh Ehden nature reserve.', 'North Lebanon', false),
('Mzaar Kfardebian', 'Ski', 'Lebanon''s largest ski resort with 42 runs at elevations up to 2,465m, with stunning views over the Mediterranean on clear days.', 'Mount Lebanon', false),
('Sidon Sea Castle', 'Historical', 'A 13th-century Crusader fortress built on a small island connected to the mainland — an iconic Sidon landmark.', 'South Lebanon', false),
('Deir el Qamar', 'Historical', 'The former capital of Mount Lebanon emirate — beautiful limestone architecture, a grand mosque converted from a church, and a charming square.', 'Mount Lebanon', false),
('Anfeh', 'Beach', 'A tranquil coastal village with crystal-clear turquoise waters, ancient salt flats, Roman ruins and some of the best swimming in Lebanon.', 'North Lebanon', false),
('Chouf Cedar Reserve', 'Nature', 'Lebanon''s largest nature reserve protecting the magnificent Chouf cedars, endemic wildlife and breathtaking mountain landscapes.', 'Mount Lebanon', false)
ON CONFLICT DO NOTHING;
