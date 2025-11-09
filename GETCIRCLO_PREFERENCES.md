# GetCirclo User Preferences

## Preference Fields

Based on GetCirclo API documentation, user preferences include:

### Niches
- `preferredNiches`: Array of niche categories
- Examples from docs:
  - "Tech Reviewer"
  - "Blogger"
  - "Foodie"
  - "Travel"
  - "Lifestyle"
  - "Fashion"
  - "Fitness"
  - etc.

### Keywords
- `preferredKeywords`: Array of keywords user is interested in
- Examples: ["keyword1", "keyword2"]

### Profiles
- `preferredProfiles`: Array of profile objects
  - `profile_id`: UUID
  - `profile_name`: String
  - `profile_niche`: String (e.g., "Tech Reviewer")

### Visual Representation
- `visualRepresentationAffinities`: Array of visual styles
- Examples from docs:
  - "white_aesthetic"
  - "minimalist"
  - "vibrant"
  - "dark_mode"
  - etc.

### Genders
- `preferredGenders`: Array of gender preferences
- Examples: ["Male", "Female", "Non-binary"]

### Negative Signals
- `negativeSignals`: Object with:
  - `niches`: Array of niches to avoid
  - `keywords`: Array of keywords to avoid

### Engagement
- `engagementRatio`: Float (0-1)
- `activeHours`: Array of time strings (e.g., ["12:00 UTC", "18:00 UTC"])

## Common Niches for Video Content

Based on GetCirclo ecosystem:
1. **Tech Reviewer** - Technology reviews, gadgets, software
2. **Foodie** - Cooking, recipes, restaurant reviews
3. **Travel** - Travel vlogs, destination guides
4. **Lifestyle** - Daily life, routines, wellness
5. **Fashion** - Style, outfits, trends
6. **Fitness** - Workouts, health tips
7. **Beauty** - Makeup, skincare
8. **Gaming** - Game reviews, gameplay
9. **Education** - Tutorials, how-tos
10. **Entertainment** - Comedy, skits, reactions
11. **Business** - Entrepreneurship, productivity
12. **Art & Design** - Creative content, DIY

## Visual Aesthetics

Common visual styles:
- **white_aesthetic** - Clean, bright, minimalist
- **dark_aesthetic** - Moody, dramatic
- **vibrant** - Colorful, energetic
- **minimalist** - Simple, uncluttered
- **cinematic** - Film-like, professional
- **vintage** - Retro, nostalgic
- **modern** - Contemporary, sleek
