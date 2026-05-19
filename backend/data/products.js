const products = [
  {
    "id": "1",
    "name": "Kadupul (Queen of the Night)",
    "image": "/images/plants/kadupul-queen-of-the-night--flower.jpg",
    "images": [
      "/images/plants/kadupul-queen-of-the-night--flower.jpg"
    ],
    "description": "The world's most expensive and rare flower, blooming only at night. Endemic to Sri Lanka.",
    "category": "Flower Plants",
    "price": 1250,
    "countInStock": 2,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "2",
    "name": "Vesak Orchid",
    "image": "/images/plants/vesak-orchid-flower.png",
    "images": [
      "/images/plants/vesak-orchid-flower.png"
    ],
    "description": "A rare endemic orchid from Sri Lankan rainforests. Highly valued for its soft purple blooms.",
    "category": "Flower Plants",
    "price": 850,
    "countInStock": 5,
    "lightRequirement": "Partial Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "3",
    "name": "Binara (Blue Flower)",
    "image": "/images/plants/binara-flower.png",
    "images": [
      "/images/plants/binara-flower.png"
    ],
    "description": "A stunning endemic wildflower with vibrant blue petals, found in the misty highlands.",
    "category": "Flower Plants",
    "price": 450,
    "countInStock": 10,
    "lightRequirement": "Bright Indirect",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "4",
    "name": "Nil Manel (Blue Water Lily)",
    "image": "/images/plants/nil-manel-blue-water-lily--flower.jpg",
    "images": [
      "/images/plants/nil-manel-blue-water-lily--flower.jpg"
    ],
    "description": "Sri Lanka's national flower, symbolizing purity. A premium aquatic plant.",
    "category": "Flower Plants",
    "price": 350,
    "countInStock": 15,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "11",
    "name": "Frangipani (Araliya)",
    "image": "/images/plants/frangipani-araliya--flower.jpg",
    "images": [
      "/images/plants/frangipani-araliya--flower.jpg"
    ],
    "description": "Highly fragrant blossoms often found near Sri Lankan temples. Elegant and calming.",
    "category": "Flower Plants",
    "price": 650,
    "countInStock": 25,
    "lightRequirement": "Direct Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "12",
    "name": "Hibiscus (Pokuru Wada)",
    "image": "/images/plants/hibiscus-pokuru-wada--flower.jpg",
    "images": [
      "/images/plants/hibiscus-pokuru-wada--flower.jpg"
    ],
    "description": "Large, colorful flowers that thrive in tropical heat. Vibrant red petals.",
    "category": "Flower Plants",
    "price": 220,
    "countInStock": 40,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "13",
    "name": "Jasmine (Pichcha)",
    "image": "/images/plants/jasmine-pichcha--flower.jpg",
    "images": [
      "/images/plants/jasmine-pichcha--flower.jpg"
    ],
    "description": "Intense sweet fragrance with delicate white flowers. Perfect for evening gardens.",
    "category": "Flower Plants",
    "price": 180,
    "countInStock": 30,
    "lightRequirement": "Bright Indirect",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "15",
    "name": "Bougainvillea (Mixed)",
    "image": "/images/plants/bougainvillea-mixed--flower.jpg",
    "images": [
      "/images/plants/bougainvillea-mixed--flower.jpg"
    ],
    "description": "A riot of color with papery bracts. Extremely hardy and drought tolerant.",
    "category": "Flower Plants",
    "price": 320,
    "countInStock": 15,
    "lightRequirement": "Direct Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "16",
    "name": "Ixora (Rathmal)",
    "image": "/images/plants/ixora-rathmal--flower.jpg",
    "images": [
      "/images/plants/ixora-rathmal--flower.jpg"
    ],
    "description": "Dense clusters of small red flowers. Attracts butterflies and birds.",
    "category": "Flower Plants",
    "price": 150,
    "countInStock": 50,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "17",
    "name": "Spider Lily",
    "image": "/images/plants/spider-lily-flower.jpg",
    "images": [
      "/images/plants/spider-lily-flower.jpg"
    ],
    "description": "Elegant white petals with a spider-like appearance. Striking garden feature.",
    "category": "Flower Plants",
    "price": 280,
    "countInStock": 12,
    "lightRequirement": "Partial Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "18",
    "name": "Canna Lily (Orange)",
    "image": "/images/plants/canna-lily-orange-flower.jpg",
    "images": [
      "/images/plants/canna-lily-orange-flower.jpg"
    ],
    "description": "Broad, tropical foliage with vibrant orange spikes. Water-loving.",
    "category": "Flower Plants",
    "price": 320,
    "countInStock": 18,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "20",
    "name": "Zinnia (Profusion)",
    "image": "/images/plants/zinnia-profusion--flower.jpg",
    "images": [
      "/images/plants/zinnia-profusion--flower.jpg"
    ],
    "description": "Long-blooming and colorful. Very easy to grow for beginners.",
    "category": "Flower Plants",
    "price": 150,
    "countInStock": 60,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "21",
    "name": "Petunia (Galaxy)",
    "image": "/images/plants/petunia-galaxy--flower.jpg",
    "images": [
      "/images/plants/petunia-galaxy--flower.jpg"
    ],
    "description": "Night sky patterns on purple petals. Extraordinary aesthetic appeal.",
    "category": "Flower Plants",
    "price": 450,
    "countInStock": 10,
    "lightRequirement": "Partial Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "23",
    "name": "Garden Rose (White)",
    "image": "/images/plants/garden-rose-white--flower.jpg",
    "images": [
      "/images/plants/garden-rose-white--flower.jpg"
    ],
    "description": "Timeless beauty with multiple layers of white petals. Classic elegance.",
    "category": "Flower Plants",
    "price": 450,
    "countInStock": 15,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "24",
    "name": "Clematis (Purple)",
    "image": "/images/plants/clematis-purple--flower.jpg",
    "images": [
      "/images/plants/clematis-purple--flower.jpg"
    ],
    "description": "Climbing vine with large, dramatic purple blooms. Perfect for fences.",
    "category": "Flower Plants",
    "price": 550,
    "countInStock": 8,
    "lightRequirement": "Partial Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "25",
    "name": "Plumeria (Pink)",
    "image": "/images/plants/plumeria-pink--flower.jpg",
    "images": [
      "/images/plants/plumeria-pink--flower.jpg"
    ],
    "description": "Soft pink Plumeria with yellow centers. Tropical paradise vibes.",
    "category": "Flower Plants",
    "price": 750,
    "countInStock": 12,
    "lightRequirement": "Direct Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "26",
    "name": "Sunflower (Giant)",
    "image": "/images/plants/sunflower-giant--flower.jpg",
    "images": [
      "/images/plants/sunflower-giant--flower.jpg"
    ],
    "description": "Tall, majestic sunflowers that follow the sun. Cheerful and bold.",
    "category": "Flower Plants",
    "price": 250,
    "countInStock": 25,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "39",
    "name": "Lavender (English)",
    "image": "/images/plants/lavender-english--flower.jpg",
    "images": [
      "/images/plants/lavender-english--flower.jpg"
    ],
    "description": "Calming purple blooms with a relaxing scent. Perfect for aromatic gardens.",
    "category": "Flower Plants",
    "price": 350,
    "countInStock": 25,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "40",
    "name": "Tulip (Red Emperor)",
    "image": "/images/plants/tulip-red-emperor--flower.jpg",
    "images": [
      "/images/plants/tulip-red-emperor--flower.jpg"
    ],
    "description": "Vibrant red petals that signal the start of spring. Bold and elegant.",
    "category": "Flower Plants",
    "price": 400,
    "countInStock": 15,
    "lightRequirement": "Partial Sun",
    "petFriendly": false,
    "wateringFrequency": "Daily"
  },
  {
    "id": "41",
    "name": "Orchid (Cattleya)",
    "image": "/images/plants/orchid-cattleya--flower.jpg",
    "images": [
      "/images/plants/orchid-cattleya--flower.jpg"
    ],
    "description": "Large, showy flowers with a heavenly fragrance. The queen of orchids.",
    "category": "Flower Plants",
    "price": 950,
    "countInStock": 5,
    "lightRequirement": "Bright Indirect",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "14",
    "name": "Anthurium (Premium Red)",
    "image": "/images/plants/anthurium-premium-red--flower.jpg",
    "images": [
      "/images/plants/anthurium-premium-red--flower.jpg"
    ],
    "description": "Heart-shaped, glossy red spathes. Long-lasting and sophisticated indoor plant.",
    "category": "Flower Plants",
    "price": 450,
    "countInStock": 20,
    "lightRequirement": "Low Light",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "19",
    "name": "Marigold (French)",
    "image": "/images/plants/marigold-french--flower.jpg",
    "images": [
      "/images/plants/marigold-french--flower.jpg"
    ],
    "description": "Cheery yellow and orange flowers. Great for pest control in gardens.",
    "category": "Flower Plants",
    "price": 120,
    "countInStock": 100,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "22",
    "name": "Periwinkle (Vinca)",
    "image": "/images/plants/periwinkle-vinca--flower.jpg",
    "images": [
      "/images/plants/periwinkle-vinca--flower.jpg"
    ],
    "description": "Hardy ground cover with delicate lavender flowers. Low maintenance.",
    "category": "Flower Plants",
    "price": 120,
    "countInStock": 80,
    "lightRequirement": "Direct Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "52",
    "name": "King Protea",
    "image": "/images/plants/king-protea-flower.jpg",
    "images": [
      "/images/plants/king-protea-flower.jpg"
    ],
    "description": "The national flower of South Africa. Features a massive flower head.",
    "category": "Flower Plants",
    "price": 1200,
    "countInStock": 8,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "7",
    "name": "Ceylon Mango",
    "image": "/images/plants/ceylon-mango-fruit.jpg",
    "images": [
      "/images/plants/ceylon-mango-fruit.jpg"
    ],
    "description": "The most famous and delicious mango variety from Sri Lanka.",
    "category": "Fruit Plants",
    "price": 450,
    "countInStock": 20,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "8",
    "name": "Mangosteen",
    "image": "/images/plants/mangosteen-fruit.jpg",
    "images": [
      "/images/plants/mangosteen-fruit.jpg"
    ],
    "description": "Known as the 'Queen of Fruits', sweet and tangy tropical fruit.",
    "category": "Fruit Plants",
    "price": 650,
    "countInStock": 8,
    "lightRequirement": "Bright Indirect",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "9",
    "name": "Malwana Rambutan",
    "image": "/images/plants/malwana-rambutan-fruit.jpg",
    "images": [
      "/images/plants/malwana-rambutan-fruit.jpg"
    ],
    "description": "Superior quality Rambutan from the Malwana region. Sweet and crunchy.",
    "category": "Fruit Plants",
    "price": 550,
    "countInStock": 12,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "27",
    "name": "Sri Lankan Papaya",
    "image": "/images/plants/sri-lankan-papaya-fruit.jpg",
    "images": [
      "/images/plants/sri-lankan-papaya-fruit.jpg"
    ],
    "description": "Fast-growing dwarf papaya. Produces sweet, red-fleshed fruit.",
    "category": "Fruit Plants",
    "price": 320,
    "countInStock": 35,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "28",
    "name": "Guava (Bangkok)",
    "image": "/images/plants/guava-bangkok--fruit.jpg",
    "images": [
      "/images/plants/guava-bangkok--fruit.jpg"
    ],
    "description": "Large, seedless guava variety. Crunchy and rich in Vitamin C.",
    "category": "Fruit Plants",
    "price": 280,
    "countInStock": 15,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "29",
    "name": "Pomegranate (Red)",
    "image": "/images/plants/pomegranate-red--fruit.jpg",
    "images": [
      "/images/plants/pomegranate-red--fruit.jpg"
    ],
    "description": "Rich in antioxidants. Vibrant red fruit with juicy arils.",
    "category": "Fruit Plants",
    "price": 650,
    "countInStock": 10,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "30",
    "name": "Starfruit (Kamaranka)",
    "image": "/images/plants/starfruit-kamaranka--fruit.jpg",
    "images": [
      "/images/plants/starfruit-kamaranka--fruit.jpg"
    ],
    "description": "Exotic star-shaped fruit. Sweet and sour profile, very ornamental.",
    "category": "Fruit Plants",
    "price": 350,
    "countInStock": 22,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "31",
    "name": "Soursop (Anoda)",
    "image": "/images/plants/soursop-anoda--fruit.jpg",
    "images": [
      "/images/plants/soursop-anoda--fruit.jpg"
    ],
    "description": "Famous for its medicinal properties. Creamy white pulp.",
    "category": "Fruit Plants",
    "price": 480,
    "countInStock": 14,
    "lightRequirement": "Bright Indirect",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "32",
    "name": "Avocado (Butter)",
    "image": "/images/plants/avocado-butter--fruit.jpg",
    "images": [
      "/images/plants/avocado-butter--fruit.jpg"
    ],
    "description": "Rich, buttery avocado variety. Grafted for faster fruiting.",
    "category": "Fruit Plants",
    "price": 850,
    "countInStock": 6,
    "lightRequirement": "Direct Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "33",
    "name": "Water Apple (Jambu)",
    "image": "/images/plants/water-apple-jambu--fruit.jpg",
    "images": [
      "/images/plants/water-apple-jambu--fruit.jpg"
    ],
    "description": "Refreshing bell-shaped fruits. Very productive and ornamental.",
    "category": "Fruit Plants",
    "price": 250,
    "countInStock": 28,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "5",
    "name": "Sri Lankan Sandalwood",
    "image": "/images/plants/sandalwood.jpg",
    "images": [
      "/images/plants/sandalwood.jpg"
    ],
    "description": "Genuine Sandalwood specimen, divine fragrance and high medicinal value.",
    "category": "Other",
    "price": 1500,
    "countInStock": 3,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Monthly"
  },
  {
    "id": "34",
    "name": "Monstera Deliciosa",
    "image": "/images/plants/monstera.jpg",
    "images": [
      "/images/plants/monstera.jpg"
    ],
    "description": "The iconic Swiss Cheese plant. Dramatic foliage for a modern garden.",
    "category": "Other",
    "price": 650,
    "countInStock": 15,
    "lightRequirement": "Bright Indirect",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "35",
    "name": "Fiddle Leaf Fig",
    "image": "/images/plants/fiddle-leaf-fig.jpg",
    "images": [
      "/images/plants/fiddle-leaf-fig.jpg"
    ],
    "description": "Large, violin-shaped leaves. A premium statement plant for your home.",
    "category": "Other",
    "price": 850,
    "countInStock": 10,
    "lightRequirement": "Bright Indirect",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "36",
    "name": "Snake Plant (Sansevieria)",
    "image": "/images/plants/snake-plant.jpg",
    "images": [
      "/images/plants/snake-plant.jpg"
    ],
    "description": "Indestructible and air-purifying. Perfect architectural form.",
    "category": "Other",
    "price": 250,
    "countInStock": 40,
    "lightRequirement": "Low Light",
    "petFriendly": false,
    "wateringFrequency": "Monthly"
  },
  {
    "id": "37",
    "name": "Areca Palm (Golden Cane)",
    "image": "/images/plants/areca-palm.jpg",
    "images": [
      "/images/plants/areca-palm.jpg"
    ],
    "description": "Feathery fronds that create a tropical screen. Very graceful.",
    "category": "Other",
    "price": 450,
    "countInStock": 25,
    "lightRequirement": "Partial Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "38",
    "name": "Calathea Orbifolia",
    "image": "/images/plants/calathea-orbifolia.jpg",
    "images": [
      "/images/plants/calathea-orbifolia.jpg"
    ],
    "description": "Large round leaves with silver stripes. A stunning prayer plant.",
    "category": "Other",
    "price": 550,
    "countInStock": 12,
    "lightRequirement": "Low Light",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "42",
    "name": "Meyer Lemon",
    "image": "/images/plants/meyer-lemon-fruit.jpg",
    "images": [
      "/images/plants/meyer-lemon-fruit.jpg"
    ],
    "description": "Sweet and tangy lemons from a compact tree. Great for patios.",
    "category": "Fruit Plants",
    "price": 550,
    "countInStock": 12,
    "lightRequirement": "Direct Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "43",
    "name": "Blueberry (Duke)",
    "image": "/images/plants/blueberry-duke--fruit.jpg",
    "images": [
      "/images/plants/blueberry-duke--fruit.jpg"
    ],
    "description": "Clusters of sweet, antioxidant-rich berries. Thrives in acidic soil.",
    "category": "Fruit Plants",
    "price": 480,
    "countInStock": 20,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "44",
    "name": "Dwarf Banana (Ambul)",
    "image": "/images/plants/dwarf-banana-ambul--fruit.jpg",
    "images": [
      "/images/plants/dwarf-banana-ambul--fruit.jpg"
    ],
    "description": "A smaller banana variety that produces sweet, flavorful fruit.",
    "category": "Fruit Plants",
    "price": 380,
    "countInStock": 15,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "45",
    "name": "Aloe Vera (Barbadensis)",
    "image": "/images/plants/aloe-vera.jpg",
    "images": [
      "/images/plants/aloe-vera.jpg"
    ],
    "description": "Fleshy leaves with healing gel. A must-have for every home.",
    "category": "Other",
    "price": 220,
    "countInStock": 50,
    "lightRequirement": "Bright Indirect",
    "petFriendly": false,
    "wateringFrequency": "Monthly"
  },
  {
    "id": "46",
    "name": "Boston Fern",
    "image": "/images/plants/boston-fern.jpg",
    "images": [
      "/images/plants/boston-fern.jpg"
    ],
    "description": "Lush, feathery fronds that purify the air. Loves humidity.",
    "category": "Other",
    "price": 320,
    "countInStock": 30,
    "lightRequirement": "Low Light",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "47",
    "name": "Lucky Bamboo",
    "image": "/images/plants/lucky-bamboo.jpg",
    "images": [
      "/images/plants/lucky-bamboo.jpg"
    ],
    "description": "Easy-to-grow stalks that bring good luck. Thrives in water or soil.",
    "category": "Other",
    "price": 150,
    "countInStock": 100,
    "lightRequirement": "Low Light",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "48",
    "name": "Blue Poppy (Meconopsis)",
    "image": "/images/plants/blue-poppy-meconopsis--flower.jpg",
    "images": [
      "/images/plants/blue-poppy-meconopsis--flower.jpg"
    ],
    "description": "A rare and stunning Himalayan flower with vibrant sky-blue petals. A true collector's item.",
    "category": "Flower Plants",
    "price": 850,
    "countInStock": 5,
    "lightRequirement": "Partial Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "49",
    "name": "Bird of Paradise",
    "image": "/images/plants/bird-of-paradise-flower.jpg",
    "images": [
      "/images/plants/bird-of-paradise-flower.jpg"
    ],
    "description": "An exotic tropical plant known for its unique orange and blue flowers that resemble a bird in flight.",
    "category": "Flower Plants",
    "price": 550,
    "countInStock": 10,
    "lightRequirement": "Direct Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "50",
    "name": "Dragon Fruit (Pitaya)",
    "image": "/images/plants/dragon-fruit-pitaya--fruit.jpg",
    "images": [
      "/images/plants/dragon-fruit-pitaya--fruit.jpg"
    ],
    "description": "A stunning cactus plant that produces vibrant pink fruit with a refreshing, sweet taste.",
    "category": "Fruit Plants",
    "price": 450,
    "countInStock": 15,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "51",
    "name": "Cherry Blossom (Sakura)",
    "image": "/images/plants/cherry-blossom-sakura--flower.jpg",
    "images": [
      "/images/plants/cherry-blossom-sakura--flower.jpg"
    ],
    "description": "Iconic spring-blooming tree with delicate pink blossoms. Brings a serene beauty to any garden.",
    "category": "Flower Plants",
    "price": 950,
    "countInStock": 3,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "52",
    "name": "Money Tree",
    "image": "/images/plants/money-tree.jpg",
    "images": [
      "/images/plants/money-tree.jpg"
    ],
    "description": "Features a beautifully braided trunk and lush green foliage. Believed to bring good luck and prosperity.",
    "category": "Other",
    "price": 480,
    "countInStock": 20,
    "lightRequirement": "Bright Indirect",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "53",
    "name": "ZZ Plant",
    "image": "/images/plants/zz-plant.jpg",
    "images": [
      "/images/plants/zz-plant.jpg"
    ],
    "description": "Extremely hardy indoor plant with glossy, waxy leaves. Perfect for low-light environments.",
    "category": "Other",
    "price": 280,
    "countInStock": 25,
    "lightRequirement": "Low Light",
    "petFriendly": false,
    "wateringFrequency": "Monthly"
  },
  {
    "id": "54",
    "name": "King Protea",
    "image": "/images/plants/king-protea-flower.jpg",
    "images": [
      "/images/plants/king-protea-flower.jpg"
    ],
    "description": "Massive, dramatic blooms with a prehistoric look. The national flower of South Africa.",
    "category": "Flower Plants",
    "price": 750,
    "countInStock": 8,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "55",
    "name": "Passion Fruit",
    "image": "/images/plants/passion-fruit-botanical.png",
    "images": [
      "/images/plants/passion-fruit-botanical.png"
    ],
    "description": "A vigorous climbing vine that produces fragrant flowers and delicious, tangy tropical fruit.",
    "category": "Fruit Plants",
    "price": 320,
    "countInStock": 12,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "56",
    "name": "Lychee Tree",
    "image": "/images/plants/lychee-tree-fruit.jpg",
    "images": [
      "/images/plants/lychee-tree-fruit.jpg"
    ],
    "description": "Evergreen tree producing clusters of sweet, aromatic fruit with a translucent flesh.",
    "category": "Fruit Plants",
    "price": 650,
    "countInStock": 6,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "57",
    "name": "Rubber Plant (Burgundy)",
    "image": "/images/plants/rubber-plant.jpg",
    "images": [
      "/images/plants/rubber-plant.jpg"
    ],
    "description": "Striking indoor plant with deep burgundy, glossy leaves. Bold and easy to care for.",
    "category": "Other",
    "price": 420,
    "countInStock": 18,
    "lightRequirement": "Bright Indirect",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "59",
    "name": "Fig Tree (Black Mission)",
    "image": "/images/plants/fig-tree-black-mission--fruit.jpg",
    "images": [
      "/images/plants/fig-tree-black-mission--fruit.jpg"
    ],
    "description": "Produces sweet, teardrop-shaped fruits with a jammy center and purple skin.",
    "category": "Fruit Plants",
    "price": 650,
    "countInStock": 8,
    "lightRequirement": "Direct Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "60",
    "name": "Mulberry (Black)",
    "image": "/images/plants/mulberry-black--fruit.jpg",
    "images": [
      "/images/plants/mulberry-black--fruit.jpg"
    ],
    "description": "Fast-growing bush producing clusters of sweet, dark purple, antioxidant-rich berries.",
    "category": "Fruit Plants",
    "price": 380,
    "countInStock": 25,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "61",
    "name": "Wood Apple (Divul)",
    "image": "/images/plants/wood-apple-divul--fruit.jpg",
    "images": [
      "/images/plants/wood-apple-divul--fruit.jpg"
    ],
    "description": "A popular local fruit with a hard woody shell and a tart, aromatic pulp used for juices.",
    "category": "Fruit Plants",
    "price": 250,
    "countInStock": 30,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "63",
    "name": "Star Gooseberry (Rata Nelli)",
    "image": "/images/plants/star-gooseberry-rata-nelli--fruit.jpg",
    "images": [
      "/images/plants/star-gooseberry-rata-nelli--fruit.jpg"
    ],
    "description": "Ornamental tree bearing abundant clusters of pale yellow, tart, rib-edged fruits.",
    "category": "Fruit Plants",
    "price": 200,
    "countInStock": 15,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "64",
    "name": "Custard Apple (Weli Anoda)",
    "image": "/images/plants/custard-apple-weli-anoda--fruit.jpg",
    "images": [
      "/images/plants/custard-apple-weli-anoda--fruit.jpg"
    ],
    "description": "Creamy, sweet pulp inside a scaly brown-green fruit. Very popular dessert fruit.",
    "category": "Fruit Plants",
    "price": 320,
    "countInStock": 18,
    "lightRequirement": "Direct Sun",
    "petFriendly": false,
    "wateringFrequency": "Weekly"
  },
  {
    "id": "66",
    "name": "Mangrove Apple (Kirala)",
    "image": "/images/plants/mangrove-apple-kirala--fruit.jpg",
    "images": [
      "/images/plants/mangrove-apple-kirala--fruit.jpg"
    ],
    "description": "Found in coastal wetlands, producing acidic green fruits used for traditional milkshakes.",
    "category": "Fruit Plants",
    "price": 280,
    "countInStock": 12,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  },
  {
    "id": "67",
    "name": "Red Banana (Rath Ambul)",
    "image": "/images/plants/red-banana-rath-ambul--fruit.jpg",
    "images": [
      "/images/plants/red-banana-rath-ambul--fruit.jpg"
    ],
    "description": "A unique banana variety with purplish-red skin and a soft, sweet, cream-colored flesh.",
    "category": "Fruit Plants",
    "price": 490,
    "countInStock": 15,
    "lightRequirement": "Direct Sun",
    "petFriendly": true,
    "wateringFrequency": "Daily"
  }
];

module.exports = products;
