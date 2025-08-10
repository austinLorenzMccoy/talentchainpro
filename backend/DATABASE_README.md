# TalentChain Pro Backend Database Setup

## Overview

The TalentChain Pro backend supports both PostgreSQL (production) and SQLite (development) databases with automatic fallback functionality. This allows you to start development immediately without setting up PostgreSQL, while maintaining compatibility for production deployment.

## Database Configuration

### Automatic Fallback (Default)

By default, the backend will:

1. Try to connect to PostgreSQL using the configured `DATABASE_URL`
2. If PostgreSQL is not available, automatically fallback to SQLite
3. Use SQLite database file: `talentchainpro.db` in the backend directory

### Environment Variables

```bash
# PostgreSQL configuration (for production)
DATABASE_URL=postgresql://user:password@localhost:5432/talentchainpro

# SQLite fallback (for development)
SQLITE_DATABASE_URL=sqlite:///./talentchainpro.db

# Enable/disable automatic fallback
DATABASE_AUTO_FALLBACK=true

# Enable SQL query logging (for debugging)
DATABASE_ECHO=false
```

## Quick Start (Development with SQLite)

1. **Start the backend directly** - SQLite will be used automatically:

   ```bash
   cd backend
   python start_server.py
   ```

2. **The database will be created automatically** with all required tables

3. **Access the API documentation** at: http://localhost:8000/docs

## Production Setup (PostgreSQL)

### 1. Install PostgreSQL

**macOS (with Homebrew):**

```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE talentchainpro;
CREATE USER talentchain WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE talentchainpro TO talentchain;
\q
```

### 3. Update Environment Variables

```bash
# Update .env file
DATABASE_URL=postgresql://talentchain:your_secure_password@localhost:5432/talentchainpro
DATABASE_AUTO_FALLBACK=false  # Optional: disable fallback for production
```

### 4. Test Connection

```bash
cd backend
python test_database.py
```

## Database Schema

The backend includes comprehensive models for:

- **Skill Tokens**: Soulbound NFTs for skill verification
- **Job Pools**: Job postings and talent matching
- **Applications**: Pool applications and matches
- **Governance**: DAO proposals and voting
- **Reputation**: Work evaluations and oracle consensus
- **Audit Logs**: System activity tracking

## Database Operations

### Initialize Database

```bash
cd backend
python -c "from app.database import init_database; init_database()"
```

### Check Database Health

```bash
cd backend
python -c "from app.database import check_database_health; print(check_database_health())"
```

### Reset Database (Development Only)

```bash
cd backend
rm -f talentchainpro.db  # Remove SQLite file
python start_server.py   # Will recreate tables
```

## Migration (Future)

When you're ready to move from SQLite to PostgreSQL:

1. Set up PostgreSQL as described above
2. Update `DATABASE_URL` in `.env`
3. Restart the application - tables will be created automatically
4. Optionally, export/import data if needed

## Troubleshooting

### SQLite Issues

- **File permissions**: Ensure the backend directory is writable
- **Concurrent access**: SQLite handles multiple readers but single writer

### PostgreSQL Issues

- **Connection refused**: Check if PostgreSQL is running
- **Authentication failed**: Verify username/password in `DATABASE_URL`
- **Database not found**: Create the database using `createdb talentchainpro`

### Redis Cache (Optional)

- Redis is used for caching but gracefully degrades if not available
- Install Redis for production: `brew install redis` (macOS) or `sudo apt install redis-server` (Ubuntu)

## Files

- `app/database.py` - Database connection and session management
- `app/models/database.py` - SQLAlchemy ORM models
- `app/config.py` - Configuration with database fallback logic
- `test_database.py` - Database setup testing script
- `start_server.py` - Application startup with database initialization
