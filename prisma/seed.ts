import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: DB_URL });
const db = new PrismaClient({ adapter });

const PRODUCTS = [
  {
    id: "prod_001",
    name: "Chicken Shawarma",
    price: 599,
    sku: "WRAP-SHWRM-01",
    description: "Tender marinated chicken, garlic toum, pickles, and fresh vegetables wrapped in warm khubz bread.",
    category: "Wraps",
    imageEmoji: "🌯",
    imageUrl: "https://images.unsplash.com/photo-1662116765994-1e4200c43589?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.1.0",
    inStock: true,
  },
  {
    id: "prod_002",
    name: "Lamb Machboos",
    price: 1499,
    sku: "RICE-MCHBS-01",
    description: "Slow-cooked spiced lamb over fragrant saffron basmati rice with dried black limes and crispy onions.",
    category: "Rice",
    imageEmoji: "🍛",
    imageUrl: "https://www.unileverfoodsolutions.eg/dam/global-ufs/mcos/meps/arabia/calcmenu/recipes/EG-recipes/In-Development/lamb-machboos/main-header.jpg/jcr:content/renditions/cq5dam.thumbnail.desktop.jpeg",
    inStock: true,
  },
  {
    id: "prod_003",
    name: "Falafel Wrap",
    price: 499,
    sku: "WRAP-FALF-01",
    description: "Crispy golden chickpea falafel, tahini, pickled turnip, tomato and parsley in fresh pita.",
    category: "Wraps",
    imageEmoji: "🧆",
    imageUrl: "https://gourmandelle.com/wp-content/uploads/2018/02/falafel-wrap-falafel-la-lipie-reteta-1.jpg",
    inStock: true,
  },
  {
    id: "prod_004",
    name: "Hummus & Pita",
    price: 549,
    sku: "MEZZE-HUM-01",
    description: "Silky smooth hummus drizzled with extra virgin olive oil, paprika and fresh parsley. Served with warm pita.",
    category: "Mezze",
    imageEmoji: "🫙",
    imageUrl: "https://www.eitanbernath.com/wp-content/uploads/2018/05/LOW-RES-2-2.jpg",
    inStock: true,
  },
  {
    id: "prod_005",
    name: "Chicken Biryani",
    price: 1299,
    sku: "RICE-BIRYN-01",
    description: "Aromatic long-grain basmati rice layered with spiced chicken, caramelised onions, saffron and fresh mint.",
    category: "Rice",
    imageEmoji: "🍚",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=450&fit=crop&auto=format",
    inStock: true,
  },
  {
    id: "prod_006",
    name: "Samboosa (4 pcs)",
    price: 349,
    sku: "SNACK-SAMB-01",
    description: "Crispy golden pastry triangles stuffed with spiced minced lamb and pine nuts. Served with mint chutney.",
    category: "Snacks",
    imageEmoji: "🥟",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=450&fit=crop&auto=format",
    inStock: true,
  },
  {
    id: "prod_007",
    name: "Manousheh Za'atar",
    price: 399,
    sku: "BREAD-MNSH-01",
    description: "Freshly baked Levantine flatbread generously topped with za'atar herb blend, olive oil and sesame seeds.",
    category: "Breads",
    imageEmoji: "🫓",
    imageUrl: "https://palestineinadish.com/wp-content/uploads/2024/04/Zaatar-Manakeesh-main-photo-1-scaled.jpg",
    inStock: true,
  },
  {
    id: "prod_008",
    name: "Kofta Kebab",
    price: 1099,
    sku: "GRILL-KFTA-01",
    description: "Spiced minced lamb skewers grilled over charcoal, served with grilled tomatoes, onion salad and flatbread.",
    category: "Grills",
    imageEmoji: "🍢",
    imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&h=450&fit=crop&auto=format",
    inStock: true,
  },
  {
    id: "prod_009",
    name: "Mixed Grill Platter",
    price: 2499,
    sku: "GRILL-MIX-01",
    description: "Lavish platter of shish tawook, kofta, lamb chops and shrimp. Served with rice, salad and dips.",
    category: "Grills",
    imageEmoji: "🔥",
    imageUrl: "https://entertainingwithbeth.com/wp-content/uploads/2020/07/MixedGrillPartyHERO.jpg",
    inStock: true,
  },
  {
    id: "prod_010",
    name: "Harees",
    price: 899,
    sku: "BOWL-HAREES-01",
    description: "Traditional Emirati slow-cooked wheat porridge with tender lamb, ghee, and warming cinnamon.",
    category: "Bowls",
    imageEmoji: "🥣",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Armenian_Harisa.JPG/500px-Armenian_Harisa.JPG",
    inStock: true,
  },
  {
    id: "prod_011",
    name: "Margoog",
    price: 1299,
    sku: "STEW-MARG-01",
    description: "Hearty Emirati lamb and vegetable stew with thin regag bread, saffron and an aromatic blend of spices.",
    category: "Bowls",
    imageEmoji: "🫕",
    imageUrl: "https://www.arabnews.com/sites/default/files/styles/n_670_395/public/2023/04/10/3766356-53780238.jpg?itok=yz8WhGa6",
    inStock: true,
  },
  {
    id: "prod_012",
    name: "Baba Ganoush",
    price: 649,
    sku: "MEZZE-BABA-01",
    description: "Fire-roasted aubergine blended with tahini, lemon and garlic, topped with pomegranate seeds and olive oil.",
    category: "Mezze",
    imageEmoji: "🍆",
    imageUrl: "https://static01.nyt.com/images/2024/02/13/multimedia/MRS-Baba-Ganoush-zkpq/MRS-Baba-Ganoush-zkpq-threeByTwoMediumAt2X.jpg?quality=75&auto=webp",
    inStock: true,
  },
  {
    id: "prod_013",
    name: "Fattoush Salad",
    price: 749,
    sku: "SALAD-FTSH-01",
    description: "Crisp romaine, cucumber, radish, mint and crispy fried pita chips tossed in a tangy sumac dressing.",
    category: "Salads",
    imageEmoji: "🥗",
    imageUrl: "https://cdn.loveandlemons.com/wp-content/uploads/2023/06/fattoush-salad.jpg",
    inStock: true,
  },
  {
    id: "prod_014",
    name: "Kunafa",
    price: 899,
    sku: "DESSERT-KNFA-01",
    description: "Shredded kadaifi pastry filled with sweet white cheese, drenched in rose-water syrup and topped with crushed pistachios.",
    category: "Desserts",
    imageEmoji: "🍮",
    imageUrl: "https://chefjar.com/wp-content/uploads/2020/01/01-1.jpg",
    inStock: true,
  },
  {
    id: "prod_015",
    name: "Luqaimat",
    price: 599,
    sku: "DESSERT-LUQM-01",
    description: "Beloved Emirati street sweet — airy fried dough balls drizzled with date syrup and toasted sesame seeds.",
    category: "Desserts",
    imageEmoji: "🍡",
    imageUrl: "https://www.chocolatesandchai.com/wp-content/uploads/2024/10/Luqaimat-5.jpg",
    inStock: true,
  },
  {
    id: "prod_016",
    name: "Umm Ali",
    price: 799,
    sku: "DESSERT-UMALI-01",
    description: "Egypt's iconic bread pudding baked with puff pastry, milk, nuts, raisins and coconut — served warm.",
    category: "Desserts",
    imageEmoji: "🥮",
    imageUrl: "https://www.cookshideout.com/wp-content/uploads/2017/04/Umm-Ali_6S.jpg",
    inStock: true,
  },
  {
    id: "prod_017",
    name: "Karak Chai",
    price: 199,
    sku: "DRINK-KARAK-01",
    description: "The UAE's favourite — strong black tea brewed with cardamom, cinnamon and ginger, finished with evaporated milk.",
    category: "Drinks",
    imageEmoji: "🧋",
    imageUrl: "https://www.munatycooking.com/wp-content/uploads/2024/04/Three-glasses-filled-with-karak-chai.jpg",
    inStock: true,
  },
  {
    id: "prod_018",
    name: "Fresh Jallab",
    price: 399,
    sku: "DRINK-JALL-01",
    description: "Chilled grape and rose-water drink topped with pine nuts, raisins and a float of fresh cream.",
    category: "Drinks",
    imageEmoji: "🍇",
    imageUrl: "https://www.unioncoop.ae/media/recipe/jallap.jpg",
    inStock: true,
  },
  {
    id: "prod_019",
    name: "Gahwa Arabic Coffee",
    price: 249,
    sku: "DRINK-GAHWA-01",
    description: "Lightly roasted cardamom coffee served in a traditional dallah pot with Medjool dates on the side.",
    category: "Drinks",
    imageEmoji: "☕",
    imageUrl: "https://www.tasteatlas.com/images/ingredients/2f721ae6136845c8a9cd6c1abb5f2893.jpg?mw=1300",
    inStock: true,
  },
  {
    id: "prod_020",
    name: "Lamb Ouzi",
    price: 3299,
    sku: "RICE-OUZI-01",
    description: "Festive whole slow-roasted spiced lamb over a bed of fragrant rice loaded with nuts and caramelised onions. (Pre-order required.)",
    category: "Rice",
    imageEmoji: "🫕",
    imageUrl: "https://thehintofrosemary.com/wp-content/uploads/2023/04/Ouzi-lamb-recipe-cover-photo.jpg",
    inStock: false,
  },
];

async function main() {
  console.log("Seeding database...");

  // Upsert products
  for (const product of PRODUCTS) {
    await db.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        imageEmoji: product.imageEmoji,
        imageUrl: product.imageUrl,
        inStock: product.inStock,
      },
      create: product,
    });
  }
  console.log(`✓ Seeded ${PRODUCTS.length} products`);

  // Upsert admin user
  const adminEmail = "admin@foodswap.com";
  const passwordHash = await bcrypt.hash("admin123", 10);
  await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "admin" },
    create: {
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
    },
  });
  console.log("✓ Seeded admin user (admin@foodswap.com / admin123)");

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
