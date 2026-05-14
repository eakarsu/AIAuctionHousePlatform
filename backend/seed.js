require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { pool } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();

  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS consignors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        commission_rate DECIMAL(5,2) DEFAULT 15.00,
        contract_status VARCHAR(50) DEFAULT 'active',
        total_consigned INTEGER DEFAULT 0,
        total_sold DECIMAL(12,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        consignor_id INTEGER REFERENCES consignors(id),
        lot_number VARCHAR(50),
        dimensions VARCHAR(200),
        medium VARCHAR(200),
        condition VARCHAR(50),
        provenance TEXT,
        reserve_price DECIMAL(12,2),
        estimate_low DECIMAL(12,2),
        estimate_high DECIMAL(12,2),
        hammer_price DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'cataloged',
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS auctions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        auction_type VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'upcoming',
        total_lots INTEGER DEFAULT 0,
        total_sold INTEGER DEFAULT 0,
        total_revenue DECIMAL(12,2) DEFAULT 0,
        buyer_premium_rate DECIMAL(5,2) DEFAULT 25.00,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bidders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        paddle_number VARCHAR(50),
        verification_status VARCHAR(50) DEFAULT 'pending',
        deposit_amount DECIMAL(12,2) DEFAULT 0,
        total_purchases DECIMAL(12,2) DEFAULT 0,
        preferred_categories TEXT,
        bidding_limit DECIMAL(12,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS live_bids (
        id SERIAL PRIMARY KEY,
        auction_id INTEGER REFERENCES auctions(id),
        item_id INTEGER REFERENCES items(id),
        bidder_id INTEGER REFERENCES bidders(id),
        bid_amount DECIMAL(12,2) NOT NULL,
        bid_type VARCHAR(50) DEFAULT 'live',
        is_winning BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        bidder_id INTEGER REFERENCES bidders(id),
        auction_id INTEGER REFERENCES auctions(id),
        subtotal DECIMAL(12,2),
        buyer_premium DECIMAL(12,2),
        tax DECIMAL(12,2),
        total DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'pending',
        due_date TIMESTAMP,
        paid_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS shipping (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id),
        item_id INTEGER REFERENCES items(id),
        bidder_id INTEGER REFERENCES bidders(id),
        carrier VARCHAR(100),
        tracking_number VARCHAR(200),
        shipping_method VARCHAR(100),
        shipping_cost DECIMAL(12,2),
        insurance_value DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'pending',
        pickup_date TIMESTAMP,
        delivery_date TIMESTAMP,
        destination_address TEXT,
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS condition_reports (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id),
        inspector_name VARCHAR(255),
        overall_condition VARCHAR(50),
        structural_integrity VARCHAR(50),
        surface_condition VARCHAR(50),
        damage_description TEXT,
        restoration_history TEXT,
        recommendations TEXT,
        report_date TIMESTAMP DEFAULT NOW(),
        images TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS storage (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id),
        location VARCHAR(200),
        zone VARCHAR(50),
        shelf VARCHAR(50),
        bin_number VARCHAR(50),
        storage_type VARCHAR(100),
        temperature_controlled BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'stored',
        intake_date TIMESTAMP DEFAULT NOW(),
        expected_release_date TIMESTAMP,
        special_requirements TEXT,
        daily_rate DECIMAL(8,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS compliance_checks (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id),
        check_type VARCHAR(100),
        database_checked VARCHAR(200),
        result VARCHAR(50),
        details TEXT,
        checked_by VARCHAR(255),
        check_date TIMESTAMP DEFAULT NOW(),
        expiry_date TIMESTAMP,
        certificate_number VARCHAR(200),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS photography_schedule (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id),
        photographer VARCHAR(255),
        studio_location VARCHAR(200),
        scheduled_date TIMESTAMP,
        duration_minutes INTEGER DEFAULT 60,
        shoot_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS catalog_entries (
        id SERIAL PRIMARY KEY,
        auction_id INTEGER REFERENCES auctions(id),
        item_id INTEGER REFERENCES items(id),
        lot_sequence INTEGER,
        page_number INTEGER,
        catalog_text TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id SERIAL PRIMARY KEY,
        auction_id INTEGER REFERENCES auctions(id),
        campaign_name VARCHAR(255) NOT NULL,
        campaign_type VARCHAR(100),
        target_audience TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        budget DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'planned',
        channels TEXT,
        metrics TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id),
        bidder_id INTEGER REFERENCES bidders(id),
        amount DECIMAL(12,2),
        payment_method VARCHAR(100),
        transaction_id VARCHAR(200),
        status VARCHAR(50) DEFAULT 'pending',
        payment_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS unsold_lots (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id),
        auction_id INTEGER REFERENCES auctions(id),
        reason VARCHAR(200),
        action_taken VARCHAR(100) DEFAULT 'pending_review',
        reoffer_auction_id INTEGER REFERENCES auctions(id),
        buy_now_price DECIMAL(12,2),
        return_to_consignor BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS appraisals (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id),
        appraiser_name VARCHAR(255),
        appraisal_type VARCHAR(100),
        appraised_value DECIMAL(12,2),
        appraisal_date TIMESTAMP DEFAULT NOW(),
        purpose VARCHAR(200),
        status VARCHAR(50) DEFAULT 'pending',
        report_text TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS estate_sales (
        id SERIAL PRIMARY KEY,
        estate_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        estate_address TEXT,
        total_items INTEGER DEFAULT 0,
        estimated_value DECIMAL(12,2),
        sale_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'consultation',
        assigned_specialist VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        feature VARCHAR(100) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        prompt_summary TEXT,
        result JSONB NOT NULL DEFAULT '{}'::jsonb,
        model VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ai_results_feature ON ai_results (feature);
      CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results (user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_results_entity ON ai_results (entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results (created_at DESC);
    `);

    console.log('Tables created successfully.');

    // Seed admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
      ['admin@auction.com', hashedPassword, 'Admin User', 'admin']
    );
    console.log('Admin user seeded.');

    // Seed consignors
    const consignors = [
      ['The Whitfield Estate', 'whitfield@estates.com', '212-555-0101', '42 East 75th Street, New York, NY 10021', 12.00, 'active', 34, 1250000.00, 'Major estate with Impressionist collection'],
      ['Margaret Chen Collection', 'mchen@artcollector.com', '415-555-0202', '1800 Pacific Avenue, San Francisco, CA 94109', 15.00, 'active', 18, 780000.00, 'Specializes in Asian Art and Contemporary'],
      ['Robert Blackwell III', 'rblackwell@gmail.com', '310-555-0303', '900 Wilshire Blvd, Beverly Hills, CA 90210', 10.00, 'active', 45, 3200000.00, 'Long-standing client, Old Masters and Impressionism'],
      ['Smithson Gallery Closure', 'admin@smithsongallery.com', '617-555-0404', '200 Newbury Street, Boston, MA 02116', 18.00, 'active', 120, 5600000.00, 'Gallery liquidation - mixed inventory'],
      ['Isabella Rossi-Ferraro', 'isabella.rf@yahoo.com', '305-555-0505', '2100 Collins Avenue, Miami, FL 33139', 15.00, 'active', 8, 420000.00, 'Italian Decorative Arts specialist'],
      ['The Harrington Trust', 'trust@harringtonfamily.org', '202-555-0606', '1250 Connecticut Ave NW, Washington, DC 20036', 12.00, 'active', 55, 4100000.00, 'Multi-generational collection, American furniture and silver'],
      ['David Park Automotive', 'dpark@luxurycars.com', '248-555-0707', '3300 Woodward Ave, Detroit, MI 48201', 8.00, 'active', 12, 2800000.00, 'Classic and vintage automobiles'],
      ['Chateau Montrose Estate', 'wine@chateaumontrose.fr', '+33-1-5555-0808', '15 Rue de Rivoli, Paris, France 75001', 20.00, 'active', 200, 950000.00, 'Fine wine collection, Bordeaux and Burgundy'],
      ['Dr. Sarah Kim', 'skim@northwestern.edu', '312-555-0909', '680 N Lake Shore Dr, Chicago, IL 60611', 15.00, 'active', 22, 610000.00, 'Jewelry and watches collector'],
      ['Thornton & Associates', 'info@thorntonart.com', '713-555-1010', '4400 Post Oak Blvd, Houston, TX 77027', 14.00, 'active', 30, 1800000.00, 'Contemporary Art advisory, curated collections'],
      ['Lord Ashford Collection', 'ashford@manor.co.uk', '+44-20-5555-1111', 'Ashford Manor, Kent, England CT25 4AB', 10.00, 'active', 65, 8500000.00, 'English country house collection, Old Masters, furniture'],
      ['Yamamoto Family Trust', 'trust@yamamoto.co.jp', '+81-3-5555-1212', '1-2-3 Ginza, Chuo-ku, Tokyo 104-0061', 12.00, 'active', 15, 920000.00, 'Japanese ceramics and screens'],
      ['Morales Modern Art Fund', 'contact@moralesart.com', '646-555-1313', '520 West 28th Street, New York, NY 10001', 15.00, 'active', 28, 2100000.00, 'Post-war and Contemporary Art fund'],
      ['Eleanor Fitzgerald', 'efitz@aol.com', '860-555-1414', '85 Prospect St, Hartford, CT 06103', 15.00, 'active', 10, 380000.00, 'Books, manuscripts, and maps'],
      ['Pacific Rim Antiquities', 'info@pacrimantiques.com', '808-555-1515', '2270 Kalakaua Ave, Honolulu, HI 96815', 16.00, 'active', 40, 1400000.00, 'Southeast Asian and Oceanic art'],
    ];

    for (const c of consignors) {
      await client.query(
        `INSERT INTO consignors (name, email, phone, address, commission_rate, contract_status, total_consigned, total_sold, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        c
      );
    }
    console.log('Consignors seeded.');

    // Seed items
    const items = [
      ['Claude Monet - Water Lilies, 1906', 'Oil on canvas depicting the artist\'s beloved water garden at Giverny. Rich palette of blues, greens, and purples with characteristic loose brushwork. Exhibited at Durand-Ruel Gallery, 1909.', 'Fine Art', 1, 'LOT-001', '89.5 x 100.3 cm (35.2 x 39.5 in)', 'Oil on canvas', 'Excellent', 'Private collection, Paris; Acquired from Durand-Ruel, 1910; Whitfield family since 1952', 2000000.00, 2500000.00, 3500000.00, 3200000.00, 'sold'],
      ['Art Deco Diamond & Platinum Ring, c.1925', 'A magnificent Art Deco ring featuring a 4.52-carat emerald-cut diamond, D color, VVS1 clarity, flanked by calibre-cut sapphires and diamond baguettes in platinum mounting.', 'Jewelry', 9, 'LOT-002', 'Ring size 6.5, diamond 4.52ct', 'Platinum, diamond, sapphire', 'Very Good', 'Cartier, Paris, special order 1925; Private collection, Geneva', 150000.00, 180000.00, 250000.00, 220000.00, 'sold'],
      ['Ming Dynasty Blue and White Porcelain Vase', 'A rare Yongle period (1403-1424) blue and white porcelain meiping vase decorated with scrolling lotus blossoms. Bears six-character Yongle reign mark on base.', 'Asian Art', 2, 'LOT-003', 'Height: 36.8 cm (14.5 in)', 'Porcelain with cobalt blue underglaze', 'Good', 'Private collection, Hong Kong; Christie\'s London, 1998; Margaret Chen Collection since 2005', 800000.00, 1000000.00, 1500000.00, null, 'cataloged'],
      ['1961 Ferrari 250 GT SWB Berlinetta', 'Chassis no. 2917GT. One of 165 steel-bodied SWB Berlinettas produced. Matching numbers engine. Classiche certified. Comprehensive restoration by Ferrari specialists in Modena, 2018.', 'Vehicles', 7, 'LOT-004', '4070mm L x 1720mm W x 1320mm H', 'Steel body, aluminium panels', 'Excellent', 'First owned by Count Vittorio Marzotto; Racing history at Monza 1962; Three documented owners since', 7000000.00, 8000000.00, 10000000.00, null, 'cataloged'],
      ['Château Lafite Rothschild 1982, 12 bottles OWC', 'Twelve bottles in original wooden case. Pristine labels, excellent fill levels (all high-shoulder or better). Provenance from château release. Stored in professional wine storage since purchase.', 'Wine & Spirits', 8, 'LOT-005', '12 x 750ml bottles in OWC', 'Red Bordeaux, Pauillac', 'Excellent', 'Purchased on release from château; Professional storage, constant 55°F', 35000.00, 40000.00, 60000.00, 52000.00, 'sold'],
      ['Patek Philippe Ref. 5711/1A Nautilus, 2020', 'Final production year of the iconic reference. Stainless steel case, blue-black gradient dial, integrated bracelet. Complete with box, papers, and certificate of origin dated November 2020.', 'Watches', 9, 'LOT-006', '40mm diameter, 8.3mm thickness', 'Stainless steel', 'Mint', 'Authorized dealer purchase, November 2020; Single owner', 100000.00, 120000.00, 160000.00, 145000.00, 'sold'],
      ['George III Mahogany Breakfront Bookcase, c.1780', 'A fine George III mahogany breakfront bookcase attributed to Thomas Chippendale the Younger. Architectural pediment above four glazed doors enclosing adjustable shelves, lower section with paneled doors.', 'Furniture', 11, 'LOT-007', '274 x 244 x 56 cm (108 x 96 x 22 in)', 'Mahogany, oak secondary wood', 'Good', 'Ashford Manor, Kent; By descent in the Ashford family since c.1785', 80000.00, 100000.00, 150000.00, null, 'cataloged'],
      ['Auguste Rodin - The Thinker (Le Penseur), Bronze Reduction', 'Posthumous bronze cast authorized by Musée Rodin, numbered 8/12. Rich dark brown patina with green accents. Foundry mark: Susse Fondeur, Paris.', 'Sculptures', 3, 'LOT-008', '37.5 x 20 x 28 cm (14.8 x 7.9 x 11 in)', 'Bronze with brown patina', 'Very Good', 'Susse Fondeur cast, c.1965; Galerie de l\'Art, Paris; Private collection, New York', 150000.00, 200000.00, 300000.00, 280000.00, 'sold'],
      ['Jean-Michel Basquiat - Untitled (Skull), 1982', 'Mixed media on paper. A powerful example of Basquiat\'s neo-expressionist style featuring his iconic skull motif rendered in oil stick, acrylic, and spray paint with handwritten text fragments.', 'Contemporary Art', 13, 'LOT-009', '76.2 x 55.9 cm (30 x 22 in)', 'Oil stick, acrylic, spray paint on paper', 'Good', 'Annina Nosei Gallery, New York, 1983; Private collection, Los Angeles; Morales Modern Art Fund, 2015', 3000000.00, 4000000.00, 6000000.00, null, 'cataloged'],
      ['Peter Paul Rubens - Study of a Horse, c.1615', 'Oil on oak panel. A masterful anatomical study characteristic of Rubens\' preparatory works. Warm earth tones with assured fluid brushwork revealing the artist\'s deep understanding of equine form.', 'Old Masters', 11, 'LOT-010', '45.7 x 61.0 cm (18 x 24 in)', 'Oil on oak panel', 'Fair', 'Collection of Sir Joshua Reynolds; Christie\'s London, 1842; Ashford family collection since 1850', 500000.00, 600000.00, 900000.00, null, 'cataloged'],
      ['Pair of Meissen Porcelain Swan Service Tureens, c.1740', 'A rare pair of Meissen Swan Service covered tureens modeled by Johann Joachim Kändler. Each with swan-form handles and applied water plants, crossed swords marks in underglaze blue.', 'Decorative Arts', 5, 'LOT-011', 'Each: 28 x 38 x 22 cm (11 x 15 x 8.7 in)', 'Hard-paste porcelain', 'Very Good', 'From the service created for Count Heinrich von Brühl; Private collection, Florence', 120000.00, 150000.00, 200000.00, 175000.00, 'sold'],
      ['Paul Storr George III Sterling Silver Candelabra Set, 1814', 'A magnificent pair of five-light candelabra by Paul Storr, London 1814. Richly decorated with acanthus leaves, lion masks, and palmettes. Fully hallmarked with maker\'s mark PS.', 'Silver', 6, 'LOT-012', 'Height: 66 cm (26 in) each, combined weight 12,450g', 'Sterling silver', 'Excellent', 'The Harrington family dining service; Continuously in family since original purchase', 60000.00, 80000.00, 120000.00, null, 'cataloged'],
      ['Japanese Satsuma Ware Vase, Meiji Period, c.1880', 'A large and impressive Satsuma earthenware vase of baluster form, finely painted with a procession of samurai warriors and court ladies amid clouds and chrysanthemums, with heavy gilt enrichments.', 'Ceramics', 12, 'LOT-013', 'Height: 62 cm (24.4 in)', 'Satsuma earthenware with gilt and enamel', 'Good', 'Purchased in Kyoto, c.1890; European private collection; Yamamoto Family Trust since 2010', 25000.00, 35000.00, 50000.00, 42000.00, 'sold'],
      ['First Edition - Charles Darwin, On the Origin of Species, 1859', 'John Murray, London, 1859. First edition, first issue. Original green publisher\'s cloth. Folding lithographed diagram present. A fine copy with only minor foxing to preliminary leaves.', 'Books & Manuscripts', 14, 'LOT-014', '20 x 13 cm (7.9 x 5.1 in)', 'Printed book, cloth binding', 'Very Good', 'Maggs Bros., London, 1935; Private library, Connecticut; Eleanor Fitzgerald Collection', 200000.00, 250000.00, 400000.00, null, 'cataloged'],
      ['Khmer Sandstone Torso of Vishnu, 11th Century', 'A carved sandstone torso of Vishnu from the Baphuon period. The deity depicted with characteristic crown and serene expression. Museum-quality example with excellent surface preservation.', 'Asian Art', 15, 'LOT-015', 'Height: 82 cm (32.3 in)', 'Grey sandstone', 'Fair', 'Acquired in Phnom Penh, 1960s; European private collection; Pacific Rim Antiquities since 2008', 60000.00, 80000.00, 120000.00, 95000.00, 'sold'],
      ['Andy Warhol - Campbell\'s Soup Can (Tomato), 1962', 'Screenprint on paper, signed and numbered 142/250 in pencil on verso. Published by Factory Additions, New York. Authenticated by the Andy Warhol Authentication Board.', 'Contemporary Art', 10, 'LOT-016', '88.9 x 58.4 cm (35 x 23 in)', 'Screenprint on paper', 'Excellent', 'Leo Castelli Gallery, 1968; Private collection, Dallas; Thornton & Associates, 2019', 500000.00, 600000.00, 800000.00, null, 'cataloged'],
      ['Louis XV Ormolu-Mounted Kingwood Commode, c.1755', 'Attributed to Jean-Pierre Latz. Serpentine bombe form with exquisite floral marquetry panels, original Brèche d\'Alep marble top. Fine quality chased ormolu mounts.', 'Furniture', 11, 'LOT-017', '87 x 130 x 62 cm (34.3 x 51.2 x 24.4 in)', 'Kingwood, tulipwood, ormolu, marble', 'Good', 'Ashford Manor, Kent; Believed acquired during Grand Tour, c.1770', 150000.00, 200000.00, 300000.00, 265000.00, 'sold'],
    ];

    for (const item of items) {
      await client.query(
        `INSERT INTO items (title, description, category, consignor_id, lot_number, dimensions, medium, condition, provenance, reserve_price, estimate_low, estimate_high, hammer_price, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        item
      );
    }
    console.log('Items seeded.');

    // Seed auctions
    const auctions = [
      ['Impressionist & Modern Art Evening Sale', 'live', 'Fine Art', '2026-04-15 19:00:00', '2026-04-15 22:00:00', 'Main Salesroom, New York', 'upcoming', 45, 0, 0, 25.00, 'Premier evening sale featuring masterworks of Impressionism and Modern Art'],
      ['Fine Jewelry & Watches', 'live', 'Jewelry', '2026-04-18 10:00:00', '2026-04-18 16:00:00', 'Salon A, New York', 'upcoming', 120, 0, 0, 28.00, 'Curated selection of important jewelry and timepieces from private collections'],
      ['Asian Art Week', 'live', 'Asian Art', '2026-04-22 10:00:00', '2026-04-23 17:00:00', 'Main Salesroom, New York', 'upcoming', 200, 0, 0, 25.00, 'Comprehensive sale of Chinese, Japanese, Korean, and Southeast Asian art'],
      ['Collector Cars - Monterey', 'live', 'Vehicles', '2026-08-15 17:00:00', '2026-08-16 20:00:00', 'Monterey Conference Center, CA', 'upcoming', 85, 0, 0, 12.00, 'Annual Monterey Car Week auction featuring exceptional collector automobiles'],
      ['Fine Wine & Spirits', 'online', 'Wine & Spirits', '2026-05-01 09:00:00', '2026-05-08 21:00:00', 'Online', 'upcoming', 350, 0, 0, 22.00, 'Online auction of rare and fine wines from distinguished cellars'],
      ['Old Masters & British Paintings', 'live', 'Old Masters', '2026-04-10 14:00:00', '2026-04-10 18:00:00', 'King Street, London', 'upcoming', 65, 0, 0, 25.00, 'Important paintings from the Renaissance to the 19th century'],
      ['Contemporary Art Day Sale', 'live', 'Contemporary Art', '2026-04-16 10:00:00', '2026-04-16 17:00:00', 'Main Salesroom, New York', 'upcoming', 180, 0, 0, 25.00, 'Post-war and Contemporary art from emerging and established artists'],
      ['English & European Furniture', 'live', 'Furniture', '2026-05-12 10:00:00', '2026-05-12 16:00:00', 'King Street, London', 'upcoming', 150, 0, 0, 25.00, 'Period furniture, decorative objects, and works of art from notable collections'],
      ['Important Silver', 'live', 'Silver', '2026-05-14 14:00:00', '2026-05-14 17:00:00', 'King Street, London', 'upcoming', 90, 0, 0, 25.00, 'Fine English and Continental silver spanning four centuries'],
      ['Rare Books & Manuscripts', 'live', 'Books & Manuscripts', '2026-06-05 10:00:00', '2026-06-05 16:00:00', 'Rockefeller Center, New York', 'upcoming', 110, 0, 0, 25.00, 'Fine printed books, important manuscripts, and historical documents'],
      ['Decorative Arts & Design', 'online', 'Decorative Arts', '2026-05-20 09:00:00', '2026-05-27 21:00:00', 'Online', 'upcoming', 220, 0, 0, 22.00, 'Ceramics, glass, textiles, and decorative objects from the 17th to 20th century'],
      ['March Impressionist & Modern Art Sale', 'live', 'Fine Art', '2026-03-10 19:00:00', '2026-03-10 22:00:00', 'Main Salesroom, New York', 'completed', 50, 42, 28500000.00, 25.00, 'Spring evening sale of Impressionist and Modern masterworks'],
      ['Winter Jewelry Sale', 'live', 'Jewelry', '2026-02-20 10:00:00', '2026-02-20 16:00:00', 'Salon A, New York', 'completed', 100, 88, 4200000.00, 28.00, 'Winter sale of fine jewelry and watches'],
      ['February Wine Auction', 'online', 'Wine & Spirits', '2026-02-01 09:00:00', '2026-02-08 21:00:00', 'Online', 'completed', 300, 275, 1850000.00, 22.00, 'Online auction featuring Burgundy, Bordeaux, and California wines'],
      ['Sculpture & Works of Art', 'live', 'Sculptures', '2026-03-18 14:00:00', '2026-03-18 17:00:00', 'Rockefeller Center, New York', 'completed', 75, 60, 5600000.00, 25.00, 'European sculpture from the Renaissance to the 20th century'],
    ];

    for (const a of auctions) {
      await client.query(
        `INSERT INTO auctions (title, auction_type, category, start_date, end_date, location, status, total_lots, total_sold, total_revenue, buyer_premium_rate, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        a
      );
    }
    console.log('Auctions seeded.');

    // Seed bidders
    const bidders = [
      ['Alexander Morrison', 'amorrison@morrisoncap.com', '212-555-2001', '740 Park Avenue, New York, NY 10021', 'P-101', 'verified', 500000.00, 4500000.00, 'Fine Art, Old Masters', 10000000.00, 'VIP client, top collector'],
      ['Victoria Langley', 'vlangley@gmail.com', '310-555-2002', '1200 Bel Air Road, Los Angeles, CA 90077', 'P-102', 'verified', 250000.00, 1200000.00, 'Contemporary Art, Sculptures', 5000000.00, 'Active buyer, prefers evening sales'],
      ['Dr. James Wu', 'jwu@stanfordmed.edu', '650-555-2003', '3400 Hillview Ave, Palo Alto, CA 94304', 'P-103', 'verified', 100000.00, 890000.00, 'Asian Art, Ceramics', 2000000.00, 'Scholarly collector, publishes on Chinese porcelain'],
      ['Contessa Maria di Savoia', 'maria@disavoia.it', '+39-06-555-2004', 'Via Condotti 15, Rome, Italy 00187', 'P-104', 'verified', 300000.00, 2800000.00, 'Old Masters, Decorative Arts, Furniture', 8000000.00, 'European nobility, buying for family palazzo'],
      ['Richard Sterling', 'rsterling@sterlingholdings.com', '312-555-2005', '401 N Michigan Ave, Chicago, IL 60611', 'P-105', 'verified', 200000.00, 950000.00, 'Watches, Jewelry', 3000000.00, 'Corporate collection and personal'],
      ['Yuki Tanaka', 'ytanaka@softbank.co.jp', '+81-3-555-2006', '1-7-1 Roppongi, Minato-ku, Tokyo 106-6108', 'P-106', 'verified', 400000.00, 3200000.00, 'Contemporary Art, Asian Art', 15000000.00, 'Tech entrepreneur collector'],
      ['Margaret Beaumont', 'mbeaumont@christies.edu', '212-555-2007', '20 Rockefeller Plaza, New York, NY 10020', 'P-107', 'verified', 50000.00, 320000.00, 'Books & Manuscripts, Fine Art', 1000000.00, 'Museum curator, buying for institutional collection'],
      ['Hassan Al-Rashid', 'halrashid@emirates.ae', '+971-4-555-2008', 'Gate Village, DIFC, Dubai, UAE', 'P-108', 'verified', 1000000.00, 7500000.00, 'Jewelry, Watches, Fine Art', 25000000.00, 'Major collector, builds private museum'],
      ['Catherine Devereux', 'cdevereux@devereuxfoundation.org', '617-555-2009', '200 Clarendon St, Boston, MA 02116', 'P-109', 'verified', 150000.00, 680000.00, 'Silver, Furniture, Decorative Arts', 2000000.00, 'Foundation buying, tax-exempt status'],
      ['Pierre-Louis Dumont', 'pldumont@domaines.fr', '+33-1-555-2010', '8 Place Vendôme, Paris, France 75001', 'P-110', 'verified', 100000.00, 520000.00, 'Wine & Spirits', 1500000.00, 'French wine merchant and collector'],
      ['Sarah & Michael O\'Brien', 'obrien.collect@me.com', '203-555-2011', '55 Harbor Drive, Greenwich, CT 06830', 'P-111', 'verified', 200000.00, 1400000.00, 'Fine Art, Contemporary Art', 4000000.00, 'Young collectors, attend all previews'],
      ['Baron Klaus von Wetzlar', 'kvw@vonwetzlar.de', '+49-69-555-2012', 'Goethestraße 28, Frankfurt, Germany 60313', 'P-112', 'verified', 350000.00, 2100000.00, 'Old Masters, Vehicles', 6000000.00, 'German industrialist, old master paintings and classic cars'],
      ['Amelia Torres-Garcia', 'atorres@artmiami.com', '305-555-2013', '2901 Collins Ave, Miami Beach, FL 33140', 'P-113', 'verified', 75000.00, 440000.00, 'Contemporary Art, Sculptures', 1500000.00, 'Miami gallery owner'],
      ['William Chen-Nakamura', 'wcn@pacific.net', '808-555-2014', '1001 Bishop St, Honolulu, HI 96813', 'P-114', 'verified', 80000.00, 350000.00, 'Asian Art, Ceramics, Decorative Arts', 1000000.00, 'Hawaii-based collector of Pacific Rim art'],
      ['Duchess of Pembroke', 'pembroke@wiltonhouse.co.uk', '+44-1722-555-2015', 'Wilton House, Salisbury, Wiltshire SP2 0BJ', 'P-115', 'verified', 500000.00, 4800000.00, 'Old Masters, Furniture, Silver', 12000000.00, 'Historical estate collection enhancement'],
    ];

    for (const b of bidders) {
      await client.query(
        `INSERT INTO bidders (name, email, phone, address, paddle_number, verification_status, deposit_amount, total_purchases, preferred_categories, bidding_limit, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        b
      );
    }
    console.log('Bidders seeded.');

    // Seed live_bids (reference auction_ids 12-15 which are completed, item_ids 1-17, bidder_ids 1-15)
    const liveBids = [
      [12, 1, 1, 2800000.00, 'live', false],
      [12, 1, 6, 3000000.00, 'live', false],
      [12, 1, 1, 3200000.00, 'live', true],
      [13, 2, 5, 180000.00, 'live', false],
      [13, 2, 8, 200000.00, 'live', false],
      [13, 2, 5, 220000.00, 'live', true],
      [14, 5, 10, 45000.00, 'online', false],
      [14, 5, 10, 52000.00, 'online', true],
      [15, 8, 2, 250000.00, 'live', false],
      [15, 8, 4, 270000.00, 'live', false],
      [15, 8, 2, 280000.00, 'live', true],
      [13, 6, 8, 130000.00, 'live', false],
      [13, 6, 5, 145000.00, 'live', true],
      [12, 17, 4, 240000.00, 'live', false],
      [12, 17, 15, 265000.00, 'live', true],
      [15, 11, 4, 160000.00, 'live', false],
      [15, 11, 9, 175000.00, 'live', true],
      [12, 13, 3, 38000.00, 'live', false],
      [12, 13, 14, 42000.00, 'live', true],
      [15, 15, 14, 85000.00, 'live', false],
      [15, 15, 3, 95000.00, 'live', true],
    ];

    for (const lb of liveBids) {
      await client.query(
        `INSERT INTO live_bids (auction_id, item_id, bidder_id, bid_amount, bid_type, is_winning) VALUES ($1,$2,$3,$4,$5,$6)`,
        lb
      );
    }
    console.log('Live bids seeded.');

    // Seed invoices
    const invoices = [
      ['INV-2026-001', 1, 12, 3200000.00, 800000.00, 320000.00, 4320000.00, 'paid', '2026-03-24', '2026-03-20', 'Monet Water Lilies purchase'],
      ['INV-2026-002', 5, 13, 220000.00, 61600.00, 22528.00, 304128.00, 'paid', '2026-03-06', '2026-03-04', 'Art Deco Diamond Ring'],
      ['INV-2026-003', 10, 14, 52000.00, 11440.00, 5075.20, 68515.20, 'paid', '2026-02-22', '2026-02-20', 'Château Lafite 1982 case'],
      ['INV-2026-004', 2, 15, 280000.00, 70000.00, 28000.00, 378000.00, 'paid', '2026-04-01', '2026-03-28', 'Rodin Bronze Thinker'],
      ['INV-2026-005', 8, 13, 145000.00, 40600.00, 14848.80, 200448.80, 'paid', '2026-03-06', '2026-03-05', 'Patek Philippe Nautilus'],
      ['INV-2026-006', 15, 12, 265000.00, 66250.00, 26500.00, 357750.00, 'pending', '2026-03-24', null, 'Louis XV Commode'],
      ['INV-2026-007', 4, 15, 175000.00, 43750.00, 17500.00, 236250.00, 'paid', '2026-04-01', '2026-03-29', 'Meissen Swan Tureens pair'],
      ['INV-2026-008', 9, 15, 4800000.00, 1200000.00, 480000.00, 6480000.00, 'pending', '2026-04-01', null, 'Multiple lots - Duchess of Pembroke'],
      ['INV-2026-009', 14, 12, 42000.00, 10500.00, 4200.00, 56700.00, 'paid', '2026-03-24', '2026-03-22', 'Satsuma Vase'],
      ['INV-2026-010', 3, 15, 95000.00, 23750.00, 9500.00, 128250.00, 'paid', '2026-04-01', '2026-03-30', 'Khmer Sandstone Vishnu'],
      ['INV-2026-011', 6, 12, 3200000.00, 800000.00, 320000.00, 4320000.00, 'overdue', '2026-03-17', null, 'Impressionist sale - lot grouping'],
      ['INV-2026-012', 11, 13, 88000.00, 24640.00, 9011.20, 121651.20, 'paid', '2026-03-06', '2026-03-03', 'Winter jewelry miscellaneous lots'],
      ['INV-2026-013', 12, 12, 150000.00, 37500.00, 15000.00, 202500.00, 'pending', '2026-03-24', null, 'Impressionist sale - additional lots'],
      ['INV-2026-014', 7, 13, 65000.00, 18200.00, 6656.00, 89856.00, 'paid', '2026-03-06', '2026-03-04', 'Winter jewelry supplemental'],
      ['INV-2026-015', 13, 14, 125000.00, 27500.00, 12200.00, 164700.00, 'paid', '2026-02-22', '2026-02-21', 'February wine - premium lots'],
    ];

    for (const inv of invoices) {
      await client.query(
        `INSERT INTO invoices (invoice_number, bidder_id, auction_id, subtotal, buyer_premium, tax, total, status, due_date, paid_date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        inv
      );
    }
    console.log('Invoices seeded.');

    // Seed shipping
    const shippingRecords = [
      [1, 1, 1, 'Cadogan Tate Fine Art', 'CT-2026-88451', 'White glove delivery', 4500.00, 3200000.00, 'delivered', '2026-03-22', '2026-03-25', '740 Park Avenue, New York, NY 10021', 'Climate-controlled vehicle required. Museum-grade packing.'],
      [2, 2, 5, 'Brinks Secure Logistics', 'BRK-2026-77342', 'Insured secure transport', 350.00, 220000.00, 'delivered', '2026-03-05', '2026-03-06', '2100 Collins Avenue, Miami, FL 33139', 'Jewelry secure transport, signature required.'],
      [3, 5, 10, 'JF Hillebrand Wine Logistics', 'JFH-2026-55123', 'Temperature-controlled', 280.00, 52000.00, 'delivered', '2026-02-21', '2026-02-24', '8 Place Vendôme, Paris, France 75001', 'Maintain 55°F. Do not store upright.'],
      [4, 8, 2, 'Cadogan Tate Fine Art', 'CT-2026-88467', 'White glove delivery', 2800.00, 280000.00, 'in_transit', '2026-03-30', null, '520 West 28th Street, New York, NY 10001', 'Bronze sculpture - heavy item. Requires two handlers minimum.'],
      [5, 6, 8, 'Brinks Secure Logistics', 'BRK-2026-77389', 'Insured secure transport', 250.00, 145000.00, 'delivered', '2026-03-06', '2026-03-07', '1-7-1 Roppongi, Minato-ku, Tokyo 106-6108', 'Watch in secure display case.'],
      [6, 17, 15, 'Gander & White', 'GW-2026-44210', 'Specialist art shipping', 3200.00, 265000.00, 'pending', null, null, 'Wilton House, Salisbury, Wiltshire SP2 0BJ', 'Antique furniture - custom crate required. Climate controlled.'],
      [7, 11, 4, 'Masterpiece International', 'MI-2026-33891', 'Museum shuttle', 1800.00, 175000.00, 'delivered', '2026-03-30', '2026-04-02', 'Via Condotti 15, Rome, Italy 00187', 'Fragile porcelain - double boxing required.'],
      [8, 13, 14, 'JF Hillebrand Wine Logistics', 'JFH-2026-55167', 'Temperature-controlled', 420.00, 42000.00, 'delivered', '2026-03-23', '2026-03-26', '2270 Kalakaua Ave, Honolulu, HI 96815', 'Wine lots - maintain temperature chain.'],
      [9, 15, 3, 'Cadogan Tate Fine Art', 'CT-2026-88490', 'White glove delivery', 3500.00, 95000.00, 'in_transit', '2026-03-31', null, 'Wilton House, Salisbury, Wiltshire SP2 0BJ', 'Ancient sculpture - vibration dampening required.'],
      [10, 1, 6, 'Cosdel International', 'COS-2026-22187', 'Air freight - art', 5800.00, 3200000.00, 'pending', null, null, '1-7-1 Roppongi, Minato-ku, Tokyo 106-6108', 'High-value shipment. Armed courier required.'],
      [11, 2, 5, 'FedEx Custom Critical', 'FCC-2026-99012', 'Priority secure', 180.00, 88000.00, 'delivered', '2026-03-04', '2026-03-05', '2100 Collins Avenue, Miami, FL 33139', 'Additional jewelry lots.'],
      [12, 17, 4, 'Hedley\'s Humpers', 'HH-2026-11567', 'Fine art packing & shipping', 2200.00, 265000.00, 'pending', null, null, 'Via Condotti 15, Rome, Italy 00187', 'French commode - bespoke crate, no stacking.'],
      [13, 5, 10, 'DHL Express', 'DHL-2026-66789', 'Express international', 150.00, 52000.00, 'delivered', '2026-02-22', '2026-02-25', '8 Place Vendôme, Paris, France 75001', 'Additional wine accessories.'],
      [14, 8, 2, 'Atelier 4 Fine Art Services', 'A4-2026-44321', 'Local art delivery', 450.00, 280000.00, 'pending', null, null, '20 Rockefeller Plaza, New York, NY 10020', 'Gallery delivery - loading dock access required.'],
      [15, 11, 9, 'Ship My Porcelain', 'SMP-2026-77001', 'Specialist ceramics', 650.00, 175000.00, 'delivered', '2026-03-31', '2026-04-03', '200 Clarendon St, Boston, MA 02116', 'Fragile Meissen tureens - individual wrapping.'],
    ];

    for (const s of shippingRecords) {
      await client.query(
        `INSERT INTO shipping (invoice_id, item_id, bidder_id, carrier, tracking_number, shipping_method, shipping_cost, insurance_value, status, pickup_date, delivery_date, destination_address, special_instructions) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        s
      );
    }
    console.log('Shipping seeded.');

    // Seed condition reports
    const conditionReports = [
      [1, 'Dr. Elena Vasquez', 'Excellent', 'Sound', 'Clean', null, 'Relined in 1978 by Restorer Guillaume, Paris', 'Maintain stable humidity 45-55%. No treatment needed.', '2026-03-01'],
      [2, 'Thomas Whitmore, GIA', 'Very Good', 'Intact', 'Minor wear', 'Light scratching to platinum band consistent with age', 'No evidence of repair', 'Polish platinum band. Clean diamond ultrasonically.', '2026-02-15'],
      [3, 'Prof. Liu Wei', 'Good', 'Sound', 'Stable glaze', 'Minor rim chip (2mm) on interior lip', 'None apparent', 'Stabilize rim chip. Display with chip to rear.', '2026-03-10'],
      [4, 'Marco Bellini, Auto Historian', 'Excellent', 'Sound', 'Restored paint', 'Minor stone chips to lower panels', 'Full restoration 2018 by Carrozzeria Zanasi, Modena', 'Maintain in climate-controlled garage. Annual mechanical service.', '2026-03-05'],
      [5, 'Pierre Dumont MW', 'Excellent', 'Sound', 'Pristine labels', null, 'N/A - wine', 'Store horizontally at 55°F. Check corks at 5-year intervals.', '2026-01-28'],
      [6, 'Hiroshi Tanaka, Horologist', 'Mint', 'Perfect', 'Flawless', null, 'None - new production', 'Service movement every 5 years. Avoid magnetic fields.', '2026-02-10'],
      [7, 'Amanda Forsythe', 'Good', 'Minor issues', 'Age-appropriate patina', 'Small repair to cornice molding, left side. Minor veneer lifting on right door.', 'Cornice repair c.1920. Otherwise original.', 'Stabilize veneer. Do not refinish - original surface.', '2026-03-08'],
      [8, 'Dr. Sophie Martin', 'Very Good', 'Sound', 'Rich patina', 'Minor casting flaw on base, as made', 'None', 'Wax patina annually. Do not clean with abrasives.', '2026-03-12'],
      [9, 'Dr. Richard Fields', 'Good', 'Paper stable', 'Minor foxing edges', 'Slight foxing to lower margin. Small crease upper right corner.', 'Floated and matted by Lowy, New York, 2016', 'Conservation framing with UV glass. Monitor for foxing spread.', '2026-03-14'],
      [10, 'Prof. Charles Hampton', 'Fair', 'Panel stable', 'Varnish discolored', 'Old varnish yellowed. Small paint loss lower left (1.5 cm area). Crazing throughout.', 'Previous cleaning c.1900. Panel cradled.', 'Professional cleaning to remove yellowed varnish. Inpaint loss area.', '2026-03-06'],
      [11, 'Dr. Maria Schmidt', 'Very Good', 'Sound', 'Minor wear to gilt', 'Light rubbing to gilt on handle terminals', 'None documented', 'Touch up gilt wear areas. Handle with cotton gloves.', '2026-03-11'],
      [12, 'James Blackburn, Silver Expert', 'Excellent', 'Sound', 'Fine patina', null, 'None - original condition throughout', 'Professional silver polish. Do not remove hall marks patina.', '2026-03-09'],
      [13, 'Prof. Kenji Nishimura', 'Good', 'Sound', 'Minor gilt loss', 'Gilt rubbing to raised areas. Hairline crack to base (stable).', 'Professional repair to handle, c.1920', 'Stabilize base crack. Accept gilt wear as age-appropriate.', '2026-03-07'],
      [14, 'Sarah Mitchell, Book Conservator', 'Very Good', 'Binding solid', 'Clean cloth', 'Minor foxing to preliminary leaves. Light bumping to corners.', 'Rebacked in matching cloth, spine preserved, c.1950', 'Store upright in custom clamshell box. Avoid direct light.', '2026-03-13'],
      [15, 'Dr. Chanda Patel', 'Fair', 'Minor losses', 'Weathered surface', 'Loss to both arms (as expected for period). Surface erosion to left shoulder area.', 'No modern restoration', 'Mount on vibration-dampening base. Do not attempt surface cleaning.', '2026-03-04'],
    ];

    for (const cr of conditionReports) {
      await client.query(
        `INSERT INTO condition_reports (item_id, inspector_name, overall_condition, structural_integrity, surface_condition, damage_description, restoration_history, recommendations, report_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        cr
      );
    }
    console.log('Condition reports seeded.');

    // Seed storage
    const storageRecords = [
      [1, 'Fine Art Vault A', 'A', 'A-12', 'FA-001', 'Climate-controlled vault', true, 'released', '2026-03-01', '2026-03-22', 'Maintain 68°F, 45% RH', 25.00],
      [2, 'Jewelry Vault', 'S', 'S-01', 'JV-002', 'High-security vault', true, 'released', '2026-02-10', '2026-03-05', 'Locked display case', 15.00],
      [3, 'Asian Art Gallery Storage', 'B', 'B-04', 'AA-003', 'Padded shelving', true, 'stored', '2026-03-08', '2026-04-25', 'Bubble wrap base. Do not stack.', 18.00],
      [4, 'Vehicle Storage Bay', 'V', 'V-01', 'VS-004', 'Enclosed garage bay', true, 'stored', '2026-03-01', '2026-08-20', 'Battery tender connected. Cover in place.', 50.00],
      [5, 'Wine Cellar B', 'W', 'W-03', 'WC-005', 'Temperature-controlled cellar', true, 'released', '2026-01-25', '2026-02-21', '55°F constant. Horizontal storage.', 8.00],
      [6, 'Watch Safe Room', 'S', 'S-02', 'WS-006', 'High-security safe', true, 'released', '2026-02-05', '2026-03-06', 'Individual watch winder', 12.00],
      [7, 'Furniture Warehouse C', 'C', 'C-08', 'FW-007', 'Large item storage', false, 'stored', '2026-03-05', '2026-05-15', 'Padded blankets. No stacking.', 22.00],
      [8, 'Sculpture Court', 'A', 'A-20', 'SC-008', 'Open display storage', true, 'stored', '2026-03-10', '2026-04-05', 'Secure pedestal mount', 20.00],
      [9, 'Works on Paper Room', 'D', 'D-02', 'WP-009', 'Flat file storage', true, 'stored', '2026-03-12', '2026-04-20', 'Acid-free interleaving. Flat storage only.', 10.00],
      [10, 'Old Masters Vault', 'A', 'A-05', 'OM-010', 'Climate-controlled vault', true, 'stored', '2026-03-04', '2026-04-12', 'Face-out on padded rack', 25.00],
      [11, 'Decorative Arts Room', 'B', 'B-10', 'DA-011', 'Padded shelving', true, 'released', '2026-03-08', '2026-03-30', 'Individual felt-lined compartments', 15.00],
      [12, 'Silver Vault', 'S', 'S-05', 'SV-012', 'Anti-tarnish storage', true, 'stored', '2026-03-06', '2026-05-16', 'Pacific Silvercloth wrapping', 12.00],
      [13, 'Ceramics Room', 'B', 'B-15', 'CR-013', 'Vibration-free shelving', true, 'released', '2026-03-05', '2026-03-23', 'Individual foam cradles', 14.00],
      [14, 'Rare Book Vault', 'D', 'D-05', 'RB-014', 'Climate-controlled vault', true, 'stored', '2026-03-10', '2026-06-08', 'Clamshell box provided. 65°F, 35% RH.', 10.00],
      [15, 'Asian Art Gallery Storage', 'B', 'B-06', 'AA-015', 'Padded shelving', true, 'stored', '2026-03-02', '2026-04-25', 'Custom mount base. Vibration isolation.', 18.00],
    ];

    for (const s of storageRecords) {
      await client.query(
        `INSERT INTO storage (item_id, location, zone, shelf, bin_number, storage_type, temperature_controlled, status, intake_date, expected_release_date, special_requirements, daily_rate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        s
      );
    }
    console.log('Storage seeded.');

    // Seed compliance checks
    const complianceChecks = [
      [1, 'Provenance verification', 'Art Loss Register', 'clear', 'No matches found in stolen art databases', 'Dr. Elena Vasquez', '2026-03-01', '2027-03-01', 'ALR-2026-88451', 'Annual renewal required'],
      [2, 'Gemstone certification', 'GIA Laboratory', 'clear', 'Diamond certified D/VVS1, 4.52ct. Natural diamond confirmed.', 'Thomas Whitmore', '2026-02-15', '2028-02-15', 'GIA-2267891234', 'Permanent certification'],
      [3, 'Export license check', 'China Cultural Heritage', 'pending', 'Awaiting export clearance from Chinese cultural authorities', 'Prof. Liu Wei', '2026-03-10', null, null, 'May require 90-day review period'],
      [4, 'Vehicle title verification', 'Ferrari Classiche', 'clear', 'Matching numbers confirmed. Red Book certification.', 'Marco Bellini', '2026-03-05', '2031-03-05', 'FERCLASS-2917GT', 'Five-year validity'],
      [5, 'Alcohol import compliance', 'TTB / HMRC', 'clear', 'Import duties assessed and paid. Proper documentation.', 'Pierre Dumont', '2026-01-28', '2026-07-28', 'TTB-IMP-2026-5521', 'Six-month validity window'],
      [6, 'Watch authenticity', 'Patek Philippe Archives', 'clear', 'Extract from archives confirming production Nov 2020. Ref 5711/1A.', 'Hiroshi Tanaka', '2026-02-10', '2029-02-10', 'PP-ARCH-2026-1189', 'Three-year validity'],
      [7, 'Provenance verification', 'Art Loss Register', 'clear', 'No matches. Clear provenance from Ashford Manor documented.', 'Amanda Forsythe', '2026-03-08', '2027-03-08', 'ALR-2026-88467', 'Annual renewal'],
      [8, 'Provenance verification', 'Art Loss Register, INTERPOL', 'clear', 'Clear on all databases. Susse Fondeur cast authenticated.', 'Dr. Sophie Martin', '2026-03-12', '2027-03-12', 'ALR-2026-88470', 'Annual renewal'],
      [9, 'Authentication review', 'Basquiat Authentication Committee', 'clear', 'Included in forthcoming catalogue raisonné. JMBA stamp on verso.', 'Dr. Richard Fields', '2026-03-14', null, 'JMBA-2026-CR-442', 'Permanent authentication'],
      [10, 'Provenance verification', 'Art Loss Register, LOOT database', 'clear', 'No matches. Documented provenance to 1842 Christie\'s sale.', 'Prof. Charles Hampton', '2026-03-06', '2027-03-06', 'ALR-2026-88455', 'Annual renewal'],
      [11, 'Export license', 'UK Arts Council', 'clear', 'Export license granted. Below Waverley criteria threshold.', 'Dr. Maria Schmidt', '2026-03-11', '2026-09-11', 'UKAC-EXP-2026-3321', 'Six-month window to export'],
      [12, 'Hallmark verification', 'London Assay Office', 'clear', 'All hallmarks verified authentic. Paul Storr maker\'s mark confirmed.', 'James Blackburn', '2026-03-09', null, 'LAO-2026-PS-8814', 'Permanent verification'],
      [13, 'Cultural property check', 'Japan Agency for Cultural Affairs', 'clear', 'Not designated as Important Cultural Property. Free to trade.', 'Prof. Kenji Nishimura', '2026-03-07', '2027-03-07', 'JACA-2026-1156', 'Annual renewal'],
      [14, 'Provenance verification', 'Rare Book Hub, ABPC', 'clear', 'Auction history verified. Copy matches known census of first editions.', 'Sarah Mitchell', '2026-03-13', null, 'RBH-2026-DARWIN-01', 'Permanent record'],
      [15, 'Cultural property check', 'Cambodia APSARA Authority, UNESCO', 'review', 'Under review for potential cultural patrimony claim. Legal counsel advising.', 'Dr. Chanda Patel', '2026-03-04', null, null, 'Hold sale pending legal review. Buyer informed.'],
    ];

    for (const cc of complianceChecks) {
      await client.query(
        `INSERT INTO compliance_checks (item_id, check_type, database_checked, result, details, checked_by, check_date, expiry_date, certificate_number, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        cc
      );
    }
    console.log('Compliance checks seeded.');

    // Seed photography schedule
    const photographySchedule = [
      [1, 'Marcus Webb', 'Studio A - Fine Art', '2026-03-01 09:00:00', 90, 'catalog_hero', 'completed', 'High-res for catalog cover. Monet Water Lilies.'],
      [2, 'Lisa Chang', 'Studio B - Jewelry', '2026-02-12 10:00:00', 45, 'macro_detail', 'completed', 'Macro shots of diamond ring. Multiple angles.'],
      [3, 'Marcus Webb', 'Studio A - Fine Art', '2026-03-09 09:00:00', 60, 'catalog_standard', 'completed', 'Ming vase - turntable shots, detail of reign mark.'],
      [4, 'Roberto Diaz', 'Vehicle Bay - Offsite', '2026-03-04 08:00:00', 180, 'vehicle_full', 'completed', 'Ferrari 250 GT SWB. Exterior, interior, engine bay, undercarriage.'],
      [5, 'Lisa Chang', 'Studio C - Small Objects', '2026-01-26 14:00:00', 30, 'catalog_standard', 'completed', 'Wine case photography. Label closeups.'],
      [6, 'Lisa Chang', 'Studio B - Jewelry', '2026-02-08 11:00:00', 60, 'macro_detail', 'completed', 'Patek Philippe Nautilus. Dial, caseback, bracelet details.'],
      [7, 'Marcus Webb', 'Studio D - Large Objects', '2026-03-06 09:00:00', 120, 'furniture_full', 'completed', 'George III bookcase. Full front, open doors, detail of pediment.'],
      [8, 'Marcus Webb', 'Studio A - Fine Art', '2026-03-11 10:00:00', 60, 'sculpture_360', 'completed', 'Rodin Thinker bronze. 360-degree turntable sequence.'],
      [9, 'Marcus Webb', 'Studio A - Fine Art', '2026-03-13 09:00:00', 90, 'catalog_hero', 'completed', 'Basquiat Skull. Raking light for texture. Detail of text fragments.'],
      [10, 'Marcus Webb', 'Studio A - Fine Art', '2026-03-05 14:00:00', 60, 'catalog_standard', 'completed', 'Rubens horse study. UV and infrared imaging included.'],
      [11, 'Lisa Chang', 'Studio C - Small Objects', '2026-03-10 09:00:00', 45, 'catalog_standard', 'completed', 'Meissen swan tureens pair. Individual and together.'],
      [12, 'Lisa Chang', 'Studio C - Small Objects', '2026-03-08 14:00:00', 45, 'catalog_standard', 'completed', 'Paul Storr candelabra set. Detail of hallmarks.'],
      [13, 'Akiko Sato', 'Studio C - Small Objects', '2026-03-06 11:00:00', 45, 'catalog_standard', 'completed', 'Satsuma vase. Gilt detail shots under controlled lighting.'],
      [14, 'Sarah Mitchell', 'Studio E - Books', '2026-03-12 10:00:00', 60, 'book_special', 'completed', 'Darwin Origin of Species. Title page, binding, folding diagram.'],
      [15, 'Marcus Webb', 'Studio A - Fine Art', '2026-03-03 09:00:00', 90, 'sculpture_360', 'completed', 'Khmer Vishnu torso. Multiple angles, detail of crown.'],
      [16, 'Marcus Webb', 'Studio A - Fine Art', '2026-04-01 09:00:00', 60, 'catalog_hero', 'scheduled', 'Warhol Soup Can. Color calibration critical.'],
      [17, 'Marcus Webb', 'Studio D - Large Objects', '2026-04-02 09:00:00', 120, 'furniture_full', 'scheduled', 'Louis XV commode. Marquetry detail shots needed.'],
    ];

    for (const ps of photographySchedule) {
      await client.query(
        `INSERT INTO photography_schedule (item_id, photographer, studio_location, scheduled_date, duration_minutes, shoot_type, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        ps
      );
    }
    console.log('Photography schedule seeded.');

    // Seed catalog entries
    const catalogEntries = [
      [12, 1, 1, 12, 'Lot 1. Claude Monet (1840-1926). Water Lilies, 1906. Oil on canvas. 89.5 x 100.3 cm. Estimate: $2,500,000-3,500,000.', 'published'],
      [12, 17, 2, 18, 'Lot 2. Louis XV Ormolu-Mounted Kingwood Commode, c.1755. Attributed to Jean-Pierre Latz. Estimate: $200,000-300,000.', 'published'],
      [12, 13, 3, 22, 'Lot 3. Japanese Satsuma Ware Vase, Meiji Period, c.1880. Height: 62 cm. Estimate: $35,000-50,000.', 'published'],
      [13, 2, 1, 8, 'Lot 1. Art Deco Diamond & Platinum Ring, c.1925. 4.52-carat D/VVS1 emerald-cut. Estimate: $180,000-250,000.', 'published'],
      [13, 6, 2, 12, 'Lot 2. Patek Philippe Ref. 5711/1A Nautilus, 2020. Final production year. Estimate: $120,000-160,000.', 'published'],
      [14, 5, 1, 6, 'Lot 1. Chateau Lafite Rothschild 1982, 12 bottles OWC. Pristine condition. Estimate: $40,000-60,000.', 'published'],
      [15, 8, 1, 10, 'Lot 1. Auguste Rodin (1840-1917). The Thinker (Le Penseur). Bronze, numbered 8/12. Estimate: $200,000-300,000.', 'published'],
      [15, 11, 2, 16, 'Lot 2. Pair of Meissen Porcelain Swan Service Tureens, c.1740. By J.J. Kandler. Estimate: $150,000-200,000.', 'published'],
      [15, 15, 3, 20, 'Lot 3. Khmer Sandstone Torso of Vishnu, 11th Century. Baphuon period. Estimate: $80,000-120,000.', 'published'],
      [1, 1, 1, 10, 'Lot 1. Claude Monet (1840-1926). Water Lilies, 1906. Oil on canvas. Estimate: $2,500,000-3,500,000.', 'draft'],
      [3, 3, 1, 8, 'Lot 1. Ming Dynasty Blue and White Porcelain Vase, Yongle Period. Estimate: $1,000,000-1,500,000.', 'draft'],
      [4, 4, 1, 12, 'Lot 1. 1961 Ferrari 250 GT SWB Berlinetta. Chassis 2917GT. Estimate: $8,000,000-10,000,000.', 'draft'],
      [6, 10, 1, 14, 'Lot 1. Peter Paul Rubens (1577-1640). Study of a Horse, c.1615. Oil on oak panel. Estimate: $600,000-900,000.', 'draft'],
      [7, 9, 1, 10, 'Lot 1. Jean-Michel Basquiat (1960-1988). Untitled (Skull), 1982. Mixed media on paper. Estimate: $4,000,000-6,000,000.', 'draft'],
      [8, 7, 1, 8, 'Lot 1. George III Mahogany Breakfront Bookcase, c.1780. Attributed to Chippendale the Younger. Estimate: $100,000-150,000.', 'draft'],
      [10, 14, 1, 6, 'Lot 1. Charles Darwin. On the Origin of Species, 1859. First edition, first issue. Estimate: $250,000-400,000.', 'draft'],
    ];

    for (const ce of catalogEntries) {
      await client.query(
        `INSERT INTO catalog_entries (auction_id, item_id, lot_sequence, page_number, catalog_text, status) VALUES ($1,$2,$3,$4,$5,$6)`,
        ce
      );
    }
    console.log('Catalog entries seeded.');

    // Seed marketing campaigns
    const marketingCampaigns = [
      [1, 'Impressionist Evening Sale - Global Campaign', 'digital', 'HNW art collectors, museum patrons', '2026-03-15 00:00:00', '2026-04-15 00:00:00', 85000.00, 'active', 'Email, Instagram, Art publications, Google Ads', 'Opens: 42%, CTR: 8.5%, Registrations: 156', 'Flagship sale campaign. Monet Water Lilies as hero image.'],
      [2, 'Fine Jewelry Spring Preview', 'multi-channel', 'Jewelry collectors, luxury consumers', '2026-03-18 00:00:00', '2026-04-18 00:00:00', 45000.00, 'active', 'Email, Instagram, Vogue, WSJ', 'Opens: 38%, CTR: 6.2%, Registrations: 89', 'Focus on Art Deco ring and Patek Philippe.'],
      [3, 'Asian Art Week Promotion', 'digital', 'Asian art collectors, museum curators', '2026-03-22 00:00:00', '2026-04-22 00:00:00', 55000.00, 'active', 'Email, WeChat, Instagram, Asian art journals', 'Opens: 35%, CTR: 7.1%, Registrations: 112', 'Ming vase as centerpiece. Multilingual campaign.'],
      [4, 'Monterey Car Week - Collector Cars', 'event', 'Classic car collectors, automotive enthusiasts', '2026-06-01 00:00:00', '2026-08-15 00:00:00', 120000.00, 'planned', 'Email, Car magazines, Event sponsorship, Social media', null, 'Ferrari 250 GT SWB as headline lot. Partner with Pebble Beach.'],
      [5, 'Online Wine Auction Launch', 'digital', 'Wine collectors, sommeliers, restaurants', '2026-04-15 00:00:00', '2026-05-08 00:00:00', 25000.00, 'planned', 'Email, Wine Spectator, Decanter, Instagram', null, 'Highlight Lafite 1982 case. Tasting notes video series.'],
      [6, 'Old Masters London Sale', 'print', 'Old Masters collectors, European museums', '2026-03-10 00:00:00', '2026-04-10 00:00:00', 65000.00, 'active', 'Burlington Magazine, Apollo, Country Life, Email', 'Opens: 29%, CTR: 5.4%, Registrations: 67', 'Rubens study featured. London preview event.'],
      [7, 'Contemporary Art Day Sale', 'social_media', 'Young collectors, art advisors, galleries', '2026-03-16 00:00:00', '2026-04-16 00:00:00', 35000.00, 'active', 'Instagram, TikTok, Artnet, Email', 'Followers gained: 2.3K, Engagement: 12%', 'Basquiat and Warhol dual promotion. Video content focus.'],
      [8, 'English Furniture & Silver Combined', 'multi-channel', 'Antiques collectors, interior designers', '2026-04-12 00:00:00', '2026-05-14 00:00:00', 40000.00, 'planned', 'Antiques Trade Gazette, Country Life, Email, Instagram', null, 'Chippendale bookcase and Storr candelabra featured.'],
      [9, 'Rare Books Spring Sale', 'targeted_email', 'Book collectors, rare book dealers, libraries', '2026-05-05 00:00:00', '2026-06-05 00:00:00', 20000.00, 'planned', 'Email, ABAA newsletter, Fine Books Magazine', null, 'Darwin Origin of Species as hero lot.'],
      [10, 'March Sale Results PR', 'pr', 'Press, general public, potential consignors', '2026-03-11 00:00:00', '2026-03-25 00:00:00', 15000.00, 'completed', 'Press releases, Social media, Website', 'Media mentions: 45, Impressions: 2.1M', 'Post-sale press coverage for completed March auctions.'],
      [11, 'Sculpture & Works of Art Highlights', 'digital', 'Sculpture collectors, decorative arts enthusiasts', '2026-02-18 00:00:00', '2026-03-18 00:00:00', 30000.00, 'completed', 'Email, Instagram, Artnet, Art publications', 'Opens: 33%, CTR: 6.8%, Registrations: 78', 'Rodin Thinker featured prominently.'],
      [12, 'VIP Client Preview Events', 'event', 'Top 100 clients, museum directors', '2026-04-01 00:00:00', '2026-04-14 00:00:00', 95000.00, 'planned', 'Personal invitations, Private viewings, Cocktail events', null, 'New York and London preview receptions.'],
      [13, 'Decorative Arts Online Sale', 'digital', 'Decorative arts collectors, interior designers', '2026-05-06 00:00:00', '2026-05-27 00:00:00', 18000.00, 'planned', 'Email, Instagram, 1stDibs partnership', null, 'Meissen tureens as featured lot.'],
      [14, 'Winter Jewelry Results Announcement', 'pr', 'Press, luxury consumers', '2026-02-21 00:00:00', '2026-03-05 00:00:00', 8000.00, 'completed', 'Press releases, Social media', 'Media mentions: 28, Impressions: 890K', 'Record prices achieved in winter jewelry sale.'],
      [15, 'February Wine Results Newsletter', 'email', 'Wine collectors, trade buyers', '2026-02-09 00:00:00', '2026-02-15 00:00:00', 5000.00, 'completed', 'Email newsletter', 'Opens: 45%, CTR: 11.2%', 'Strong results summary for February wine auction.'],
    ];

    for (const mc of marketingCampaigns) {
      await client.query(
        `INSERT INTO marketing_campaigns (auction_id, campaign_name, campaign_type, target_audience, start_date, end_date, budget, status, channels, metrics, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        mc
      );
    }
    console.log('Marketing campaigns seeded.');

    // Seed payments
    const paymentsData = [
      [1, 1, 4320000.00, 'wire_transfer', 'WT-2026-Morrison-001', 'completed', '2026-03-20', 'Full payment for Monet Water Lilies'],
      [2, 5, 304128.00, 'wire_transfer', 'WT-2026-Sterling-002', 'completed', '2026-03-04', 'Art Deco Diamond Ring payment'],
      [3, 10, 68515.20, 'wire_transfer', 'WT-2026-Dumont-003', 'completed', '2026-02-20', 'Chateau Lafite 1982 payment'],
      [4, 2, 378000.00, 'wire_transfer', 'WT-2026-Langley-004', 'completed', '2026-03-28', 'Rodin Thinker bronze payment'],
      [5, 8, 200448.80, 'credit_card', 'CC-2026-AlRashid-005', 'completed', '2026-03-05', 'Patek Philippe Nautilus payment'],
      [6, 15, 200000.00, 'wire_transfer', 'WT-2026-Pembroke-006', 'pending', null, 'Partial payment for Louis XV Commode'],
      [7, 4, 236250.00, 'wire_transfer', 'WT-2026-Savoia-007', 'completed', '2026-03-29', 'Meissen Swan Tureens payment'],
      [8, 15, 3000000.00, 'wire_transfer', 'WT-2026-Pembroke-008', 'pending', null, 'Partial payment - Duchess multiple lots'],
      [9, 14, 56700.00, 'wire_transfer', 'WT-2026-ChenNakamura-009', 'completed', '2026-03-22', 'Satsuma Vase payment'],
      [10, 3, 128250.00, 'wire_transfer', 'WT-2026-Pembroke-010', 'completed', '2026-03-30', 'Khmer Vishnu torso payment'],
      [11, 6, 1000000.00, 'wire_transfer', 'WT-2026-Tanaka-011', 'failed', '2026-03-15', 'Payment returned - insufficient funds'],
      [12, 11, 121651.20, 'credit_card', 'CC-2026-Torres-012', 'completed', '2026-03-03', 'Winter jewelry lots payment'],
      [13, 12, 100000.00, 'check', 'CHK-2026-Morrison-013', 'pending', null, 'Partial payment - Impressionist lots'],
      [14, 7, 89856.00, 'wire_transfer', 'WT-2026-AlRashid-014', 'completed', '2026-03-04', 'Winter jewelry supplemental payment'],
      [15, 13, 164700.00, 'wire_transfer', 'WT-2026-Dumont-015', 'completed', '2026-02-21', 'February wine premium lots payment'],
    ];

    for (const p of paymentsData) {
      await client.query(
        `INSERT INTO payments (invoice_id, bidder_id, amount, payment_method, transaction_id, status, payment_date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        p
      );
    }
    console.log('Payments seeded.');

    // Seed unsold lots
    const unsoldLots = [
      [3, 12, 'Below reserve', 'reoffer', 3, null, false, 'Ming vase did not meet reserve. Reoffering in Asian Art Week.'],
      [4, 12, 'No bidders registered', 'reoffer', 4, null, false, 'Ferrari to be offered at Monterey Car Week instead.'],
      [7, 12, 'Below reserve', 'pending_review', null, 120000.00, false, 'Chippendale bookcase. Consider private sale at reduced estimate.'],
      [9, 12, 'Withdrawn - legal issue', 'pending_review', null, null, false, 'Basquiat withdrawn pending authentication review.'],
      [10, 12, 'Below reserve', 'reoffer', 6, null, false, 'Rubens study to be reoffered in Old Masters London sale.'],
      [12, 12, 'No bids', 'private_sale', null, 90000.00, false, 'Storr candelabra - offer private sale to known silver collectors.'],
      [14, 12, 'Below reserve', 'reoffer', 10, null, false, 'Darwin first edition reoffered in Rare Books sale.'],
      [16, 7, 'Below reserve', 'pending_review', null, 650000.00, false, 'Warhol Soup Can. Private sale or reoffer in Contemporary Day Sale.'],
      [3, 13, 'Export restriction', 'return_to_consignor', null, null, true, 'Previous attempt failed due to Chinese export restrictions.'],
      [7, 15, 'Below reserve', 'buy_now', null, 110000.00, false, 'Listed on website with buy-now price.'],
      [10, 15, 'No registered bidders', 'reoffer', 1, null, false, 'Moving to Impressionist evening sale with broader audience.'],
      [12, 9, 'Below reserve', 'private_sale', null, 85000.00, false, 'Approached Duchess of Pembroke for private acquisition.'],
      [14, 13, 'Below reserve', 'pending_review', null, 280000.00, false, 'Book collector interest noted. May reduce reserve.'],
      [16, 11, 'Condition concern', 'return_to_consignor', null, null, true, 'Buyer expressed condition concerns. Returned to consignor for restoration.'],
      [9, 7, 'Authentication delay', 'pending_review', null, null, false, 'Basquiat authentication committee review in progress.'],
    ];

    for (const ul of unsoldLots) {
      await client.query(
        `INSERT INTO unsold_lots (item_id, auction_id, reason, action_taken, reoffer_auction_id, buy_now_price, return_to_consignor, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        ul
      );
    }
    console.log('Unsold lots seeded.');

    // Seed appraisals
    const appraisals = [
      [1, 'Dr. Elena Vasquez', 'insurance', 3500000.00, '2026-03-01', 'Insurance coverage', 'completed', 'Monet Water Lilies, 1906. Authenticated and in excellent condition. Market value supported by recent comparable sales at major auction houses.', 'Annual insurance valuation'],
      [2, 'Thomas Whitmore, GIA', 'fair_market', 250000.00, '2026-02-15', 'Pre-sale estimate', 'completed', 'Art Deco platinum and diamond ring. 4.52ct D/VVS1 emerald-cut center stone. Comparable Cartier pieces selling $200K-280K.', 'GIA grading report attached'],
      [3, 'Prof. Liu Wei', 'fair_market', 1200000.00, '2026-03-10', 'Pre-sale estimate', 'completed', 'Ming Dynasty Yongle period meiping vase. Authentic reign mark. Comparable pieces at $800K-1.5M in recent years.', 'Pending export clearance may affect value'],
      [4, 'Marco Bellini', 'insurance', 9000000.00, '2026-03-05', 'Insurance coverage', 'completed', 'Ferrari 250 GT SWB Berlinetta. Matching numbers, Classiche certified. Recent comparable: $8.1M at RM Sothebys 2025.', 'Includes full mechanical inspection report'],
      [5, 'Pierre Dumont MW', 'fair_market', 55000.00, '2026-01-28', 'Pre-sale estimate', 'completed', 'Chateau Lafite Rothschild 1982, 12 bottles OWC. Perfect provenance and storage. Current market very strong for 1982 Bordeaux.', 'Master of Wine valuation'],
      [6, 'Hiroshi Tanaka', 'replacement', 160000.00, '2026-02-10', 'Insurance replacement', 'completed', 'Patek Philippe 5711/1A Nautilus 2020. Discontinued reference commands significant premium. Replacement cost above retail.', 'Market premium 2-3x retail for discontinued model'],
      [7, 'Amanda Forsythe', 'fair_market', 130000.00, '2026-03-08', 'Pre-sale estimate', 'completed', 'George III breakfront bookcase attributed to Chippendale the Younger. Good condition with documented provenance. English furniture market soft.', 'Conservative estimate given market conditions'],
      [8, 'Dr. Sophie Martin', 'insurance', 300000.00, '2026-03-12', 'Insurance coverage', 'completed', 'Rodin Thinker bronze reduction, 8/12 Susse Fondeur cast. Excellent provenance and patina. Strong market for Rodin bronzes.', 'Authenticated by Comite Rodin'],
      [9, 'Dr. Richard Fields', 'fair_market', 5000000.00, '2026-03-14', 'Pre-sale estimate', 'completed', 'Basquiat Untitled (Skull) 1982. Key period work with strong exhibition history. Comparable works $4M-8M at auction.', 'Subject to authentication board confirmation'],
      [10, 'Prof. Charles Hampton', 'fair_market', 750000.00, '2026-03-06', 'Pre-sale estimate', 'completed', 'Rubens Study of a Horse. Panel in fair condition requiring cleaning. Strong provenance from Reynolds collection adds value.', 'Condition issues factored into estimate'],
      [11, 'Dr. Maria Schmidt', 'insurance', 200000.00, '2026-03-11', 'Insurance coverage', 'completed', 'Pair Meissen Swan Service tureens by Kandler. Rare and desirable. Comparable pairs sold $150K-220K.', 'Pair value significantly exceeds individual pieces'],
      [12, 'James Blackburn', 'fair_market', 100000.00, '2026-03-09', 'Pre-sale estimate', 'completed', 'Paul Storr George III candelabra pair. Exceptional quality and weight. Storr premium on silver market.', 'Fully hallmarked, excellent condition'],
      [13, 'Prof. Kenji Nishimura', 'fair_market', 40000.00, '2026-03-07', 'Pre-sale estimate', 'completed', 'Satsuma Meiji period vase. Good quality painting and gilt. Market for Satsuma has been stable.', 'Handle repair noted in condition report'],
      [14, 'Sarah Mitchell', 'replacement', 350000.00, '2026-03-13', 'Insurance replacement', 'completed', 'Darwin Origin of Species first edition first issue. Fine copy. Only ~1,250 copies printed. Replacement cost rising annually.', 'Census copy, well-documented provenance'],
      [15, 'Dr. Chanda Patel', 'fair_market', 90000.00, '2026-03-04', 'Pre-sale estimate', 'pending', 'Khmer Vishnu torso, Baphuon period. Museum quality but subject to cultural patrimony review. Value contingent on clear title.', 'Legal review may impact salability'],
    ];

    for (const a of appraisals) {
      await client.query(
        `INSERT INTO appraisals (item_id, appraiser_name, appraisal_type, appraised_value, appraisal_date, purpose, status, report_text, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        a
      );
    }
    console.log('Appraisals seeded.');

    // Seed estate sales
    const estateSales = [
      ['The Whitfield Estate', 'Jonathan Whitfield', 'jwhitfield@estates.com', '212-555-3001', '42 East 75th Street, New York, NY 10021', 34, 4500000.00, '2026-04-15 10:00:00', 'in_progress', 'Dr. Elena Vasquez', 'Major Impressionist collection. Multiple auction sessions planned.'],
      ['Smithson Gallery Liquidation', 'Mark Smithson', 'mark@smithsongallery.com', '617-555-3002', '200 Newbury Street, Boston, MA 02116', 120, 8500000.00, '2026-05-20 10:00:00', 'cataloging', 'Amanda Forsythe', 'Complete gallery inventory. Mixed periods and media.'],
      ['Lord Ashford Manor Collection', 'Edward Ashford', 'ashford@manor.co.uk', '+44-20-555-3003', 'Ashford Manor, Kent, England CT25 4AB', 65, 12000000.00, '2026-06-10 10:00:00', 'in_progress', 'Prof. Charles Hampton', 'English country house sale. Old Masters, furniture, silver.'],
      ['Beverly Hills Modernist Estate', 'Patricia Owens', 'powens@lawfirm.com', '310-555-3004', '1200 Benedict Canyon, Beverly Hills, CA 90210', 85, 6200000.00, '2026-07-15 10:00:00', 'consultation', 'Dr. Richard Fields', 'Mid-century modern art and design. Executor sale.'],
      ['Newport Mansion Contents', 'The Newport Trust', 'trust@newportmansion.org', '401-555-3005', '450 Bellevue Avenue, Newport, RI 02840', 200, 15000000.00, '2026-09-01 10:00:00', 'consultation', 'Amanda Forsythe', 'Gilded Age mansion contents. Major undertaking.'],
      ['Palm Beach Jewelry Collection', 'Diana Rothman', 'drothman@gmail.com', '561-555-3006', '300 South Ocean Blvd, Palm Beach, FL 33480', 45, 3800000.00, '2026-04-18 10:00:00', 'cataloging', 'Thomas Whitmore', 'Significant jewelry collection. Art Deco and contemporary pieces.'],
      ['Chicago Wine Cellar Estate', 'Robert Keller III', 'rkeller@kellerfunds.com', '312-555-3007', '1500 N Astor St, Chicago, IL 60610', 500, 2200000.00, '2026-05-01 09:00:00', 'cataloging', 'Pierre Dumont', 'Exceptional wine cellar. Burgundy and Bordeaux focus.'],
      ['Tokyo Art Collection Dispersal', 'Kenji Yamamoto', 'kyamamoto@yamamoto.co.jp', '+81-3-555-3008', '1-2-3 Ginza, Chuo-ku, Tokyo 104-0061', 40, 5500000.00, '2026-06-20 10:00:00', 'in_progress', 'Prof. Kenji Nishimura', 'Japanese ceramics and screens. Some Western paintings.'],
      ['Connecticut Library Estate', 'Eleanor Fitzgerald Jr.', 'efitzjr@aol.com', '860-555-3009', '85 Prospect St, Hartford, CT 06103', 800, 4000000.00, '2026-06-05 10:00:00', 'cataloging', 'Sarah Mitchell', 'Vast library of rare books and manuscripts. Multi-session sale.'],
      ['Scottsdale Automotive Collection', 'James Parker', 'jparker@parkerauto.com', '480-555-3010', '7500 E Doubletree Ranch Rd, Scottsdale, AZ 85258', 25, 18000000.00, '2026-08-15 10:00:00', 'consultation', 'Marco Bellini', 'Premium classic car collection. Ferrari, Porsche, Mercedes.'],
      ['London Silver Collection', 'Sir Hugh Pemberton', 'pemberton@silversmith.co.uk', '+44-20-555-3011', '15 Old Bond Street, London W1S 4AX', 90, 2800000.00, '2026-05-14 14:00:00', 'in_progress', 'James Blackburn', 'Significant English silver collection spanning 300 years.'],
      ['Miami Contemporary Art Estate', 'Carlos Morales', 'cmorales@moralesart.com', '305-555-3012', '2901 Collins Ave, Miami Beach, FL 33140', 55, 9500000.00, '2026-04-16 10:00:00', 'cataloging', 'Dr. Richard Fields', 'Post-war and contemporary collection. Several blue-chip artists.'],
      ['Paris Decorative Arts Collection', 'Isabelle Dupont', 'idupont@antiquaires.fr', '+33-1-555-3013', '15 Rue de Rivoli, Paris 75001', 75, 4200000.00, '2026-05-20 10:00:00', 'consultation', 'Dr. Maria Schmidt', 'French decorative arts. Porcelain, furniture, textiles.'],
      ['Honolulu Asian Art Estate', 'David Chen-Nakamura', 'dcn@pacific.net', '808-555-3014', '2270 Kalakaua Ave, Honolulu, HI 96815', 60, 3100000.00, '2026-04-22 10:00:00', 'in_progress', 'Prof. Liu Wei', 'Southeast Asian and Chinese art. Some Oceanic pieces.'],
      ['Washington DC Political Memorabilia', 'Senator James Harrington', 'jharrington@harringtonfamily.org', '202-555-3015', '1250 Connecticut Ave NW, Washington, DC 20036', 150, 2500000.00, '2026-07-04 10:00:00', 'consultation', 'Sarah Mitchell', 'Historical documents, political memorabilia, American furniture.'],
    ];

    for (const es of estateSales) {
      await client.query(
        `INSERT INTO estate_sales (estate_name, contact_person, contact_email, contact_phone, estate_address, total_items, estimated_value, sale_date, status, assigned_specialist, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        es
      );
    }
    console.log('Estate sales seeded.');

    console.log('\n=== Database seeded successfully! ===');
    console.log('Admin login: admin@auction.com / admin123');

  } catch (err) {
    console.error('Seeding error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
