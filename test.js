const cleanString = (str) => {
  return str
    .replace(/\\/g, '')      // Remove all backslashes
    .replace(/\n/g, '')
    .replace(/```/g, '')      // Remove all newlines
    .replace(/json/g, '');   // Remove all instances of 'json'
};

// Usage with your data
const data = [{ "output": "json\n{\n  \"no\": \"3\",\n  \"artifact Name\": \"Bronze Nataraja\",\n  \"Title\": \"A Dance of Cosmic Proportions: The Chola Bronze Collection\",\n  \"Short Description\": \"This iconic Chola bronze figurine captures Lord Shiva in his Anandatandava pose, symbolizing the cosmic dance of creation and destruction. A masterpiece of South Indian artistry, it embodies the cyclical nature of existence and Shiva's divine power.\",\n  \"Story\": \"Step into the South Indian Art Gallery, where your gaze is immediately drawn to the majestic form of the Bronze Nataraja. Cast during the 10th-11th Century CE, this exquisite Chola bronze captures Lord Shiva in his dynamic Anandatandava pose. With one leg raised high, his multiple arms performing cosmic gestures, Shiva Nataraja embodies the rhythm of the universe—the powerful cycle of creation, preservation, and destruction. This isn't merely a static sculpture; it's a frozen moment of divine energy, inviting contemplation on the profound philosophical concepts of life and cosmic order.\n\nTo your left, you'll encounter the intricate designs of Harappan Jewelry, a testament to the early craftsmanship and aesthetic sensibilities of a much older civilization. As you stand before the Nataraja, consider the evolution of artistic expression and cultural beliefs over millennia. Then, turning your attention to the right, you'll find Tipu Sultan's Sword, a potent symbol of valor and resistance from a later historical period. These neighboring artifacts offer a fascinating journey through time, from ancient adornments to medieval divine artistry, and finally to a symbol of 18th-century martial prowess.\",\n  \"Recommendations\": \"Continue your exploration by observing the Harappan Jewelry to your left, showcasing ancient craftsmanship. Afterward, proceed to your right to marvel at Tipu Sultan's Sword, an artifact from a later period of Indian history.\"\n}\n"}];

const cleaned = cleanString(data[0].output);
console.log(cleaned);