# Daggerheart MUD

A text-based multiplayer dungeon adventure game powered by AI, built with Next.js, Supabase, and Gemini AI.

## 🎮 Features

- **AI Dungeon Master**: Powered by Gemini AI with full Daggerheart SRD knowledge
- **ASCII Terminal Interface**: Classic MUD experience with modern web technology
- **Character Creation**: Full Daggerheart character system with ancestries, classes, and traits
- **Campaign System**: AI-generated campaigns with multiple story lengths
- **Combat System**: Turn-based combat with Daggerheart dice mechanics
- **Inventory Management**: Equipment system with weapons, armor, and consumables
- **Save System**: Chapter-based saves with persistent world state
- **Guest Mode**: Play without creating an account

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Gemini API key

### 1. Database Setup
```bash
# Create Supabase project and run schema
# See docs/SETUP.md for detailed instructions
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your API keys
npm run dev
```

### 3. Frontend Setup
```bash
npm install
cp env.local.example .env.local
# Edit .env.local with your URLs
npm run dev
```

## 🏗️ Architecture

### Frontend (Next.js + Vercel)
- **Terminal Interface**: xterm.js for ASCII terminal emulation
- **Game Components**: React components for UI panels
- **WebSocket Client**: Real-time communication with backend
- **Guest Mode**: SessionStorage-based temporary sessions

### Backend (Node.js + Render)
- **WebSocket Server**: Socket.io for real-time communication
- **AI Integration**: Gemini AI with SRD context loading
- **Game Logic**: Command parsing, combat, inventory management
- **Database**: Supabase for persistent storage

### Database (Supabase)
- **Characters**: Player data and stats
- **Campaigns**: Campaign instances and progress
- **Items**: Equipment database from scraped data
- **Game State**: AI context and world state

## 🎯 Game Commands

### Basic Commands
- `look` - Examine surroundings
- `move <direction>` - Move in a direction
- `inventory` - View items
- `stats` - Character statistics
- `help` - Command list

### Combat Commands
- `attack <target>` - Attack a target
- `defend` - Take defensive stance
- `flee` - Attempt to flee

### System Commands
- `save` - Create manual save point
- `rest` - Recover HP and stress

## 📁 Project Structure

```
daggerheartmud/
├── app/                    # Next.js frontend
│   ├── components/         # React components
│   ├── page.tsx           # Main entry point
│   └── globals.css        # Terminal styling
├── backend/               # Node.js backend
│   ├── services/          # Game logic services
│   ├── routes/            # WebSocket handlers
│   ├── config/            # Database & AI config
│   └── server.js          # Main server
├── supabase/              # Database schema
│   ├── schema.sql         # Table definitions
│   ├── policies.sql       # RLS policies
│   └── seed.sql           # Equipment data
├── supporting_functions/  # Data processing
│   └── Results/           # SRD & equipment data
└── docs/                  # Documentation
    ├── SETUP.md           # Setup instructions
    └── COMMANDS.md        # Player commands
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🚀 Deployment

### Backend (Render)
1. Connect GitHub repository
2. Set environment variables
3. Deploy using `render.yaml`

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Player Commands](docs/COMMANDS.md) - Complete command reference
- [Tech Stack Reference](docs/Tech%20Stack%20Reference%20Documents) - Technology links

## 🎮 How to Play

1. **Start Game**: Click "Play as Guest" or create account
2. **Create Character**: Choose ancestry, class, and traits
3. **Begin Adventure**: AI DM generates your campaign
4. **Explore**: Use commands to interact with the world
5. **Combat**: Fight enemies with turn-based combat
6. **Progress**: Complete chapters and save your progress

## 🛠️ Development

### Local Development
```bash
# Start backend
cd backend && npm run dev

# Start frontend
npm run dev
```

### Testing
- Test WebSocket connection
- Verify AI responses
- Check database operations
- Test save/load functionality

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section in docs/SETUP.md
2. Review error logs
3. Verify environment configuration
4. Ensure all services are running

## 🎯 Roadmap

- [ ] Multiplayer support
- [ ] Character customization
- [ ] Advanced AI features
- [ ] Mobile optimization
- [ ] Sound effects
- [ ] Graphics mode
