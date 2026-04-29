const products = [
  {
    id: '1',
    name: 'Monstera Deliciosa',
    image: 'https://placehold.co/400x300.png?text=Monstera+Deliciosa',
    description:
      'Known as the Swiss Cheese Plant, this tropical beauty is famous for its natural leaf holes. A perfect statement piece for any bright room.',
    category: 'Foliage',
    price: 49.99,
    countInStock: 15,
    lightRequirement: 'Bright Indirect',
    petFriendly: false,
    wateringFrequency: 'Weekly',
  },
  {
    id: '2',
    name: 'Snake Plant (Sansevieria)',
    image: 'https://placehold.co/400x300.png?text=Snake+Plant',
    description:
      'One of the most resilient indoor plants. It can survive low light levels and infrequent watering. Great for beginners!',
    category: 'Succulent',
    price: 29.99,
    countInStock: 30,
    lightRequirement: 'Low Light',
    petFriendly: false,
    wateringFrequency: 'Bi-weekly',
  },
  {
    id: '3',
    name: 'Boston Fern',
    image: 'https://placehold.co/400x300.png?text=Boston+Fern',
    description:
      'A lush, classic fern with gracefully arching fronds. Loves humidity, making it an excellent plant for bathrooms or kitchens.',
    category: 'Fern',
    price: 24.99,
    countInStock: 10,
    lightRequirement: 'Bright Indirect',
    petFriendly: true,
    wateringFrequency: 'Weekly',
  },
  {
    id: '4',
    name: 'String of Pearls',
    image: 'https://placehold.co/400x300.png?text=String+of+Pearls',
    description:
      'A beautiful trailing succulent with pea-shaped leaves. Looks absolutely stunning in a hanging basket or casually draped across a shelf.',
    category: 'Succulent',
    price: 19.99,
    countInStock: 25,
    lightRequirement: 'Direct Sun',
    petFriendly: false,
    wateringFrequency: 'Bi-weekly',
  },
  {
    id: '5',
    name: 'Parlor Palm',
    image: 'https://placehold.co/400x300.png?text=Parlor+Palm',
    description:
      'Bring a tropical paradise into your home with this compact palm. Highly adaptable and perfectly safe for your furry friends.',
    category: 'Tree',
    price: 34.99,
    countInStock: 5,
    lightRequirement: 'Bright Indirect',
    petFriendly: true,
    wateringFrequency: 'Weekly',
  },
];

// Ensure valid enum value for Parlor Palm
products[4].lightRequirement = 'Bright Indirect';

module.exports = products;
