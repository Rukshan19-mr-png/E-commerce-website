const CareGuides = () => {
  const guides = [
    {
      title: 'Light & Placement',
      emoji: '☀️',
      description: 'Most houseplants thrive in bright, indirect light. Keep them near east- or west-facing windows and avoid harsh midday sun on delicate leaves.',
    },
    {
      title: 'Watering Rhythm',
      emoji: '💧',
      description: 'Water when the top inch of soil feels dry. Overwatering is the most common issue, so let the soil slightly dry before the next drink.',
    },
    {
      title: 'Soil & Drainage',
      emoji: '🪴',
      description: 'Use a loose, well-draining potting mix and a pot with drainage holes to prevent root rot and keep roots happy.',
    },
    {
      title: 'Humidity & Air',
      emoji: '🌿',
      description: 'Most tropical plants love humidity. Group plants together, mist leaves occasionally, or use a pebble tray for extra moisture.',
    },
    {
      title: 'Feeding & Growth',
      emoji: '🌱',
      description: 'Feed with a balanced liquid fertilizer every 4-6 weeks during the spring and summer growing season.',
    },
    {
      title: 'Repotting Tips',
      emoji: '🔄',
      description: 'Repot when roots start to crowd the pot. Choose a container one size larger and refresh the soil for new growth.',
    },
  ];

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <section className="glass-card" style={{ padding: '3rem', marginBottom: '3rem', background: 'linear-gradient(135deg, rgba(45, 106, 79, 0.1), rgba(216, 243, 220, 0.5))' }}>
        <p className="eyebrow" style={{ color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>Expert Knowledge</p>
        <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Grow your green thumb with easy care tips</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '800px' }}>
          Learn the basics for light, water, soil, humidity, feeding, and repotting so your plants stay healthy and vibrant in the Sri Lankan climate.
        </p>
      </section>

      <div className="guide-grid">
        {guides.map((guide) => (
          <article key={guide.title} className="guide-card glass-card">
            <span className="guide-emoji">{guide.emoji}</span>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>{guide.title}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{guide.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default CareGuides;
