import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting seed...")

  // ─── Clean up existing test data ──────────────────────────────────────────
  // IMPORTANT: These deletions are scoped to products marked isSeed=true.
  // Since the Product model doesn't have an isSeed field, we use a naming
  // convention — all seed products start with "[TEST]" in the name.
  // Admin can filter and delete them easily.
  await prisma.orderItem.deleteMany({
    where: { product: { name: { startsWith: "[TEST]" } } },
  })
  await prisma.savedItem.deleteMany({
    where: { product: { name: { startsWith: "[TEST]" } } },
  })
  await prisma.review.deleteMany({
    where: { product: { name: { startsWith: "[TEST]" } } },
  })
  await prisma.product.deleteMany({
    where: { name: { startsWith: "[TEST]" } },
  })
  console.log("🗑️  Cleared previous test products")

  // ─── Test Products ─────────────────────────────────────────────────────────
  // Using real Unsplash images that reliably exist
  const products = [

    // ── BAKING Category ───────────────────────────────────────────────────
    {
      name: "[TEST] Iyosi Foods Premium Baking Flour 25kg",
      description: "High-quality baking flour milled from premium wheat grains. Perfect for bread, cakes, pastries, and all baking needs. Fine texture ensures consistent results every time. Trusted by professional bakers across Nigeria.",
      price: 18500,
      stock: 120,
      category: "BAKING" as const,
      image: "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods Bread Flour 10kg",
      description: "High-protein bread flour for professional and home bakers. Higher gluten content produces perfectly risen, chewy loaves with a golden crust. Ideal for artisan bread, pizza dough, and rolls.",
      price: 7800,
      stock: 85,
      category: "BAKING" as const,
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods Pastry Flour 5kg",
      description: "Finely milled low-protein flour ideal for pastries, biscuits, and delicate cakes. Produces tender, flaky results. Preferred by pastry chefs for consistently light textures.",
      price: 4200,
      stock: 60,
      category: "BAKING" as const,
      image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods Self-Rising Flour 2kg",
      description: "Convenient self-rising flour with pre-measured leavening agents. Perfect for pancakes, waffles, muffins, and quick breads. No need for separate baking powder — saves time and ensures perfect rise.",
      price: 2100,
      stock: 200,
      category: "BAKING" as const,
      image: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },

    // ── WHEAT Category ────────────────────────────────────────────────────
    {
      name: "[TEST] Iyosi Foods Whole Wheat Flour 25kg",
      description: "Stone-ground whole wheat flour made from 100% Nigerian wheat. Rich in fibre, vitamins, and minerals. Perfect for whole wheat bread, chapati, and healthy baking. Nutty flavour, dense nutrition.",
      price: 19000,
      stock: 95,
      category: "WHEAT" as const,
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods Durum Wheat Flour 10kg",
      description: "Premium durum wheat flour specifically milled for pasta making. High semolina content gives pasta its golden colour and firm texture. Also excellent for pizza bases and Mediterranean breads.",
      price: 9500,
      stock: 45,
      category: "WHEAT" as const,
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods Wheat Germ 1kg",
      description: "Pure toasted wheat germ, the most nutritious part of the wheat kernel. Rich in vitamin E, folate, and essential fatty acids. Add to smoothies, yoghurt, cereals, or baked goods for a nutritional boost.",
      price: 3800,
      stock: 30,
      category: "WHEAT" as const,
      image: "https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },

    // ── ALL_PURPOSE Category ──────────────────────────────────────────────
    {
      name: "[TEST] Iyosi Foods All-Purpose Flour 50kg",
      description: "The workhorse of the kitchen. Versatile all-purpose flour suitable for virtually any recipe — bread, cakes, cookies, thickening sauces, coating fried foods, and more. 50kg bulk bag for restaurants and caterers.",
      price: 38000,
      stock: 55,
      category: "ALL_PURPOSE" as const,
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods All-Purpose Flour 10kg",
      description: "Our flagship all-purpose flour in a convenient 10kg bag for home bakers and small food businesses. Consistent quality batch after batch. Suitable for all cooking and baking applications.",
      price: 8200,
      stock: 180,
      category: "ALL_PURPOSE" as const,
      image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods All-Purpose Flour 5kg",
      description: "Perfect household size all-purpose flour. Same premium quality as our larger bags in a more manageable 5kg pack. Great for everyday cooking, thickening soups and stews, and occasional baking.",
      price: 4600,
      stock: 250,
      category: "ALL_PURPOSE" as const,
      image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods Cake Flour 2kg",
      description: "Ultra-fine, low-protein cake flour for impossibly tender cakes, cupcakes, and delicate baked goods. Produces a lighter crumb and softer texture than regular flour. The secret of professional cake bakers.",
      price: 2400,
      stock: 70,
      category: "ALL_PURPOSE" as const,
      image: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },

    // ── SEMOLINA Category ─────────────────────────────────────────────────
    {
      name: "[TEST] Iyosi Foods Fine Semolina 10kg",
      description: "Premium fine-grind semolina made from durum wheat. Perfect for Nigerian tuwo, ugali, couscous, pasta, and North African breads. Smooth texture, golden colour, rich flavour. A staple in every Nigerian kitchen.",
      price: 9200,
      stock: 110,
      category: "SEMOLINA" as const,
      image: "https://images.unsplash.com/photo-1612187029105-97c64b11bd9c?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods Coarse Semolina 5kg",
      description: "Coarse-grind semolina for traditional African porridges, puddings, and rustic bread. The larger granules create a distinctive hearty texture loved in Northern Nigeria. Also excellent for coating fried fish and meat.",
      price: 4800,
      stock: 90,
      category: "SEMOLINA" as const,
      image: "https://images.unsplash.com/photo-1586688882408-6e4ee9a60cc2?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods Semolina 25kg Bulk",
      description: "Restaurant and caterer-grade semolina in a 25kg bulk bag. Our most popular product for commercial kitchens, canteens, and food manufacturers. Consistent grind size for reliable results every time. Cost-effective for high-volume operations.",
      price: 22500,
      stock: 40,
      category: "SEMOLINA" as const,
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods Instant Semolina 1kg",
      description: "Precooked instant semolina that cooks in under 5 minutes. Just add boiling water and stir. Perfect for quick weekday meals, school lunches, and office cooking. Same great taste and nutrition as traditional semolina.",
      price: 1850,
      stock: 3,
      category: "SEMOLINA" as const,
      image: "https://images.unsplash.com/photo-1585537775715-8e34d2f2044c?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "[TEST] Iyosi Foods Enriched Semolina 2kg",
      description: "Nutritionally enriched semolina fortified with iron, folic acid, and vitamin B12. Recommended for growing children and families seeking extra nutrition without changing their traditional diet. Same great taste, better nutrition.",
      price: 2900,
      stock: 0,
      category: "SEMOLINA" as const,
      image: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=400&h=400&fit=crop&q=80",
      isActive: true,
    },
  ]

  // ─── Insert products ────────────────────────────────────────────────────────
  const created = await prisma.$transaction(
    products.map(p => prisma.product.create({ data: p }))
  )
  console.log(`✅ Created ${created.length} test products`)

  // ─── Add sample reviews to first 8 products ────────────────────────────────
  // Find or create a test reviewer user
  let reviewer = await prisma.user.findFirst({
    where: { email: "test-reviewer@Iyosi Foods.test" },
  })
  if (!reviewer) {
    reviewer = await prisma.user.create({
      data: {
        name: "Test Reviewer",
        email: "test-reviewer@Iyosi Foods.test",
        password: await bcrypt.hash("TestReviewer123!", 12),
        role: "USER",
        isActive: true,
        emailVerified: new Date(),
      },
    })
    console.log("✅ Created test reviewer user")
  }

  const reviewSentences = [
    { rating: 5, comment: "Excellent quality flour! My bread has never risen so well. Highly recommend to all bakers." },
    { rating: 5, comment: "Best flour I have used in years. Consistent quality every time I order. Will keep buying." },
    { rating: 4, comment: "Very good product. Delivery was fast and packaging was intact. Good value for money." },
    { rating: 4, comment: "Great flour for my bakery business. My customers always compliment the texture of the bread." },
    { rating: 5, comment: "Outstanding! The quality is far superior to what I was buying before. Switched permanently." },
    { rating: 3, comment: "Decent product. Does the job well. Nothing spectacular but reliable and consistent quality." },
    { rating: 5, comment: "This semolina is so smooth and cooks beautifully. My family loves it. Fast delivery too!" },
    { rating: 4, comment: "Good quality. Packaging could be better but the product inside is excellent. Will reorder." },
  ]

  const reviewedProducts = created.slice(0, 8)
  for (let i = 0; i < reviewedProducts.length; i++) {
    await prisma.review.create({
      data: {
        productId: reviewedProducts[i].id,
        userId: reviewer.id,
        rating: reviewSentences[i].rating,
        comment: reviewSentences[i].comment,
      },
    })
  }
  console.log("✅ Added sample reviews to first 8 products")

  // ─── Create a test admin user (if not exists) ──────────────────────────────
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@Iyosi Foods.test",
        password: await bcrypt.hash("Admin@123456!", 12),
        role: "ADMIN",
        isActive: true,
        emailVerified: new Date(),
      },
    })
    console.log("✅ Created test admin: admin@Iyosi Foods.test / Admin@123456!")
  } else {
    console.log("ℹ️  Admin already exists — skipping admin creation")
  }

  // ─── Create a test customer user (if not exists) ──────────────────────────
  const existingCustomer = await prisma.user.findFirst({
    where: { email: "customer@Iyosi Foods.test" },
  })
  if (!existingCustomer) {
    await prisma.user.create({
      data: {
        name: "Amaka Johnson",
        email: "customer@Iyosi Foods.test",
        password: await bcrypt.hash("Customer@123!", 12),
        role: "USER",
        isActive: true,
        emailVerified: new Date(),
      },
    })
    console.log("✅ Created test customer: customer@Iyosi Foods.test / Customer@123!")
  }

  console.log("\n🎉 Seed complete!")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`📦 ${created.length} test products added (names start with [TEST])`)
  console.log("👤 Admin login: admin@Iyosi Foods.test / Admin@123456!")
  console.log("🛒 Customer login: customer@Iyosi Foods.test / Customer@123!")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🗑️  TO DELETE TEST DATA: Go to Admin → Products → filter by '[TEST]'")

  // ─── Demo Press Releases ───────────────────────────────────────────────────
  await prisma.pressRelease.deleteMany({ where: { title: { contains: "[DEMO]" } } })

  const demoPressReleases = [
    {
      title: "[DEMO] Iyosi Foods LTD Reports Record Revenue Growth in 2025",
      slug: "iyosi-foods-record-revenue-2025",
      category: "Financial Results",
      excerpt: "Iyosi Foods LTD achieves unprecedented revenue growth of over 20% and expands distribution across all 36 Nigerian states.",
      content: "Iyosi Foods LTD is proud to announce record revenue growth in 2025...\n\nOur profit after tax rose significantly, driven by strong demand for our premium flour and semolina products.\n\nWe remain committed to quality and innovation across all product lines.",
      published: true,
      publishedAt: new Date("2025-03-15"),
    },
    {
      title: "[DEMO] Iyosi Foods LTD Expands Flour Milling Operations to Abuja",
      slug: "flour-milling-expansion-abuja-2025",
      category: "Expansion",
      excerpt: "Commissioning of new flour milling facility in Abuja to increase production capacity and serve the North-Central market.",
      content: "Iyosi Foods LTD has commissioned a state-of-the-art flour milling facility in the Federal Capital Territory...\n\nThis expansion reflects our commitment to bringing quality products closer to every Nigerian household.\n\nThe new facility will create over 200 direct jobs.",
      published: true,
      publishedAt: new Date("2025-06-01"),
    },
    {
      title: "[DEMO] Iyosi Foods LTD Wins Best FMCG Brand 2025",
      slug: "best-fmcg-brand-award-2025",
      category: "Awards",
      excerpt: "Recognised as Best FMCG Brand and Most Trusted Food Company at the annual Industry Excellence Awards 2025.",
      content: "Iyosi Foods LTD has been recognised as the Best FMCG Brand at the 2025 Industry Excellence Awards...\n\nThis recognition reflects the trust our customers and partners have placed in us over the years.\n\nWe dedicate this award to our hardworking team across all facilities.",
      published: true,
      publishedAt: new Date("2025-09-10"),
    },
    {
      title: "[DEMO] Strategic Partnership with West African Agriculture Consortium",
      slug: "west-africa-agriculture-partnership-2025",
      category: "Partnership",
      excerpt: "Iyosi Foods LTD signs landmark agreement with the West African Agriculture Consortium to source premium grains across the region.",
      content: "Iyosi Foods LTD has entered into a strategic partnership with the West African Agriculture Consortium...\n\nThis partnership will strengthen our supply chain and support thousands of local farmers.\n\nThe agreement covers grain sourcing across Nigeria, Ghana, and Côte d'Ivoire.",
      published: true,
      publishedAt: new Date("2025-11-20"),
    },
    {
      title: "[DEMO] Iyosi Foods LTD Achieves NAFDAC Recertification",
      slug: "nafdac-recertification-2026",
      category: "Quality",
      excerpt: "All Iyosi Foods LTD product lines receive renewed NAFDAC certification, reaffirming our commitment to food safety.",
      content: "Iyosi Foods LTD is pleased to announce the successful renewal of all NAFDAC certifications across our product range...\n\nThis recertification process involved rigorous inspection of all our production facilities.\n\nWe remain committed to meeting the highest standards of food safety for Nigerian consumers.",
      published: true,
      publishedAt: new Date("2026-01-08"),
    },
    {
      title: "[DEMO] Launch of Premium Enriched Semolina Product Line",
      slug: "enriched-semolina-launch-2026",
      category: "Product Launch",
      excerpt: "Iyosi Foods LTD introduces a new range of iron-fortified, vitamin-enriched semolina to combat nutritional deficiencies in West Africa.",
      content: "Iyosi Foods LTD is proud to launch our Premium Enriched Semolina product line...\n\nFortified with iron, folic acid, and vitamin B12, this range addresses the nutritional needs of growing families.\n\nThe products are now available at leading supermarkets and distributors nationwide.",
      published: true,
      publishedAt: new Date("2026-03-01"),
    },
  ]

  for (const pr of demoPressReleases) {
    await prisma.pressRelease.upsert({
      where: { slug: pr.slug },
      update: pr,
      create: pr,
    })
  }
  console.log("✅ Demo press releases seeded")
  console.log("   Or run: npx prisma db execute --stdin <<< \"DELETE FROM \\\"Product\\\" WHERE name LIKE '[TEST]%'\"")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
