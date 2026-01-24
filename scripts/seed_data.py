#!/usr/bin/env python3
"""
Script pour générer des données de test pour Pandore
"""
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
import uuid
import random

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import bcrypt

# Charger les variables d'environnement
ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Fake data
GENRES = ["Hip-Hop", "Electronic", "Jazz", "Rock", "Pop", "R&B", "Soul", "House", "Techno", "Ambient", "Classical", "Indie", "Folk"]

ARTIST_NAMES = [
    "Luna Waves", "Midnight Echo", "Solar Beats", "Urban Pulse", "Neon Dreams",
    "Crystal Sound", "Velvet Voice", "Electric Soul", "Cosmic Groove", "Analog Heart",
    "Digital Dawn", "Echo Chamber", "Frequency Lab", "Sound Architect", "Beat Surgeon",
    "Rhythm Doctor", "Bass Dealer", "Synth Wizard", "Melody Maker", "Harmony Hunter",
    "Phoenix Rising", "Ocean Drift", "Thunder Beats", "Starlight Mix", "Shadow Walker",
    "Golden Hour", "Silver Tone", "Crimson Wave", "Azure Dreams", "Violet Pulse",
    "Arctic Flow", "Desert Storm", "Forest Echo", "Mountain Peak", "River Sound",
    "Sky Dancer", "Earth Mover", "Fire Breather", "Water Bearer", "Wind Chaser",
    "Night Rider", "Day Dreamer", "Time Keeper", "Space Traveler", "Soul Searcher",
    "Mind Bender", "Heart Breaker", "Dream Weaver", "Star Gazer", "Moon Walker"
]

TRACK_PREFIXES = [
    "Midnight", "Golden", "Electric", "Cosmic", "Urban", "Crystal", "Velvet", "Neon", "Digital", "Analog",
    "Silent", "Loud", "Deep", "High", "Lost", "Found", "Hidden", "Visible", "Dark", "Bright",
    "Cold", "Warm", "Fast", "Slow", "Wild", "Calm", "Heavy", "Light", "Sweet", "Bitter"
]
TRACK_SUFFIXES = [
    "Dreams", "Vibes", "Echoes", "Waves", "Flow", "Pulse", "Lights", "Nights", "Days", "Moments",
    "Stories", "Tales", "Memories", "Feelings", "Emotions", "Thoughts", "Ideas", "Visions", "Sounds", "Rhythms",
    "Beats", "Melodies", "Harmonies", "Symphonies", "Jams", "Grooves", "Loops", "Tracks", "Tunes", "Songs"
]

MASTERING_ENGINEERS = ["John Smith", "Sarah Johnson", "Mike Davis", "Emily Chen", "David Brown", "Lisa Anderson"]
MASTERING_STUDIOS = ["Abbey Road Studios", "Electric Lady Studios", "Capitol Studios", "Sunset Sound", "The Hit Factory"]

async def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_artists(count=20):
    """Créer des artistes avec profils"""
    print(f"Creating {count} artists...")
    artists = []
    
    for i in range(count):
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        artist_name = ARTIST_NAMES[i] if i < len(ARTIST_NAMES) else f"Artist {i+1}"
        
        # Créer user
        user_doc = {
            "user_id": user_id,
            "email": f"{artist_name.lower().replace(' ', '.')}@pandore.com",
            "password_hash": await hash_password("artist123"),
            "name": artist_name,
            "picture": f"https://i.pravatar.cc/300?img={i+1}",
            "role": "artist",
            "artist_name": artist_name,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user_doc)
        
        # Créer profil artiste
        profile_id = f"profile_{uuid.uuid4().hex[:12]}"
        bios = [
            f"Producer and musician based in Paris. Creating {random.choice(GENRES).lower()} music since 2015.",
            f"Electronic music artist exploring the boundaries of sound. Influenced by {random.choice(GENRES)} and {random.choice(GENRES)}.",
            f"Multi-instrumentalist and producer. Bringing fresh {random.choice(GENRES).lower()} vibes to the world.",
            f"Sound designer and composer. Crafting unique {random.choice(GENRES).lower()} experiences.",
            f"DJ and producer specializing in {random.choice(GENRES).lower()} music. Released on major labels."
        ]
        
        profile_doc = {
            "profile_id": profile_id,
            "user_id": user_id,
            "name": artist_name,
            "bio": random.choice(bios),
            "avatar_url": f"https://i.pravatar.cc/300?img={i+1}",
            "links": [
                f"https://instagram.com/{artist_name.lower().replace(' ', '')}",
                f"https://soundcloud.com/{artist_name.lower().replace(' ', '')}"
            ],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.artist_profiles.insert_one(profile_doc)
        
        artists.append({
            "user_id": user_id,
            "artist_name": artist_name
        })
    
    print(f"✅ Created {count} artists")
    return artists

async def create_tracks(artists, tracks_per_artist=5):
    """Créer des tracks pour chaque artiste"""
    total = len(artists) * tracks_per_artist
    print(f"Creating {total} tracks...")
    
    tracks = []
    cover_images = [
        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500",
        "https://images.unsplash.com/photo-1619983081563-430f63602796?w=500",
        "https://images.unsplash.com/photo-1608433319511-dfe8ea4cbd3c?w=500",
        "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=500",
        "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500",
        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500",
    ]
    
    for artist in artists:
        for i in range(tracks_per_artist):
            track_id = f"track_{uuid.uuid4().hex[:12]}"
            
            title = f"{random.choice(TRACK_PREFIXES)} {random.choice(TRACK_SUFFIXES)}"
            genre = random.choice(GENRES)
            price = random.choice([99, 149, 199, 249, 299])  # En cents
            duration = random.randint(120, 300)  # 2-5 minutes
            
            # Mastering info
            mastering = {
                "engineer": random.choice(MASTERING_ENGINEERS),
                "details": f"Mastered at {random.choice(MASTERING_STUDIOS)}"
            } if random.random() > 0.3 else None
            
            # Splits
            splits = []
            if random.random() > 0.5:
                split_count = random.randint(1, 3)
                if split_count == 1:
                    splits.append({"party": artist["artist_name"], "percent": 100})
                else:
                    remaining = 100
                    for j in range(split_count):
                        if j == split_count - 1:
                            percent = remaining
                        else:
                            max_percent = remaining - (split_count - j - 1) * 10
                            if max_percent < 10:
                                max_percent = remaining
                            percent = random.randint(10, max(10, max_percent))
                            remaining -= percent
                        
                        party_names = [artist["artist_name"], "Producer", "Co-Writer", "Studio", "Label"]
                        splits.append({
                            "party": party_names[j] if j < len(party_names) else f"Party {j+1}",
                            "percent": percent
                        })
            
            descriptions = [
                f"A {genre.lower()} track that blends modern production with classic influences.",
                f"Exploring new sonic territories with this {genre.lower()} production.",
                f"Deep {genre.lower()} vibes perfect for late night listening.",
                f"High-energy {genre.lower()} track with punchy drums and atmospheric synths.",
                f"Melodic {genre.lower()} journey through space and time."
            ]
            
            track_doc = {
                "track_id": track_id,
                "title": title,
                "artist_id": artist["user_id"],
                "artist_name": artist["artist_name"],
                "album_id": None,
                "price": price,
                "duration": duration,
                "preview_url": f"https://example.com/preview/{track_id}.mp3",
                "preview_start_time": random.randint(0, 60),
                "preview_duration": 15,
                "file_url": f"https://example.com/files/{track_id}.mp3",
                "cover_url": random.choice(cover_images),
                "genre": genre,
                "description": random.choice(descriptions),
                "mastering": mastering,
                "splits": splits,
                "status": "published",
                "likes_count": random.randint(0, 1000),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.tracks.insert_one(track_doc)
            tracks.append(track_doc)
    
    print(f"✅ Created {total} tracks")
    return tracks

async def create_albums(artists, albums_per_artist=2):
    """Créer des albums pour chaque artiste"""
    total = len(artists) * albums_per_artist
    print(f"Creating {total} albums...")
    
    albums = []
    album_titles = [
        "Midnight Sessions", "Electric Dreams", "Urban Tales", "Cosmic Journey",
        "Velvet Nights", "Crystal Visions", "Digital Horizons", "Analog Stories"
    ]
    
    for artist in artists[:len(artists)//2]:  # Seulement la moitié des artistes ont des albums
        for i in range(albums_per_artist):
            album_id = f"album_{uuid.uuid4().hex[:12]}"
            
            # Récupérer quelques tracks de cet artiste
            artist_tracks = await db.tracks.find({
                "artist_id": artist["user_id"]
            }, {"_id": 0, "track_id": 1}).limit(random.randint(3, 6)).to_list(100)
            
            track_ids = [t["track_id"] for t in artist_tracks]
            
            album_doc = {
                "album_id": album_id,
                "title": f"{random.choice(album_titles)} Vol. {i+1}",
                "artist_id": artist["user_id"],
                "artist_name": artist["artist_name"],
                "price": random.randint(599, 1499),  # En cents
                "cover_url": f"https://images.unsplash.com/photo-{random.randint(1600000000000, 1700000000000)}?w=500",
                "description": f"A collection of {len(track_ids)} tracks showcasing the artistic vision of {artist['artist_name']}.",
                "track_ids": track_ids,
                "status": "published",
                "likes_count": random.randint(0, 500),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.albums.insert_one(album_doc)
            albums.append(album_doc)
    
    print(f"✅ Created {len(albums)} albums")
    return albums

async def create_users_and_purchases(count=30):
    """Créer des users normaux avec quelques achats"""
    print(f"Creating {count} users with purchases...")
    
    for i in range(count):
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        user_doc = {
            "user_id": user_id,
            "email": f"user{i+1}@example.com",
            "password_hash": await hash_password("user123"),
            "name": f"User {i+1}",
            "picture": f"https://i.pravatar.cc/150?img={i+50}",
            "role": "user",
            "artist_name": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user_doc)
        
        # Créer quelques achats aléatoires
        if random.random() > 0.3:  # 70% des users ont acheté quelque chose
            num_purchases = random.randint(1, 5)
            random_tracks = await db.tracks.aggregate([
                {"$sample": {"size": num_purchases}}
            ]).to_list(num_purchases)
            
            for track in random_tracks:
                purchase_id = f"purchase_{uuid.uuid4().hex[:12]}"
                purchase_doc = {
                    "purchase_id": purchase_id,
                    "user_id": user_id,
                    "item_type": "track",
                    "item_id": track["track_id"],
                    "price_paid": track["price"],
                    "purchased_at": datetime.now(timezone.utc).isoformat()
                }
                await db.purchases.insert_one(purchase_doc)
    
    print(f"✅ Created {count} users with purchases")

async def create_playlists(count=50):
    """Créer des playlists pour les users"""
    print(f"Creating {count} playlists...")
    
    users = await db.users.find({"role": "user"}, {"_id": 0, "user_id": 1}).to_list(100)
    
    playlist_names = [
        "Chill Vibes", "Workout Mix", "Late Night Sessions", "Morning Energy",
        "Focus Music", "Party Hits", "Road Trip", "Study Beats", "Sunset Grooves",
        "Deep Focus", "Happy Vibes", "Rainy Day", "Sunday Morning", "Night Drive"
    ]
    
    for i in range(count):
        if not users:
            break
            
        user = random.choice(users)
        playlist_id = f"playlist_{uuid.uuid4().hex[:12]}"
        
        # Sélectionner des tracks aléatoires
        num_tracks = random.randint(5, 20)
        random_tracks = await db.tracks.aggregate([
            {"$sample": {"size": num_tracks}}
        ]).to_list(num_tracks)
        
        track_ids = [t["track_id"] for t in random_tracks]
        
        playlist_doc = {
            "playlist_id": playlist_id,
            "user_id": user["user_id"],
            "name": random.choice(playlist_names),
            "description": f"A curated selection of {num_tracks} tracks",
            "track_ids": track_ids,
            "visibility": random.choice(["private", "public"]),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.playlists.insert_one(playlist_doc)
    
    print(f"✅ Created {count} playlists")

async def main():
    print("🎵 Starting Pandore data seeding...")
    print("=" * 50)
    
    # Nettoyer les données existantes (optionnel)
    response = input("Clear existing data? (y/N): ")
    if response.lower() == 'y':
        print("Clearing existing data...")
        await db.users.delete_many({"email": {"$regex": "@pandore.com|@example.com"}})
        await db.artist_profiles.delete_many({})
        await db.tracks.delete_many({})
        await db.albums.delete_many({})
        await db.purchases.delete_many({})
        await db.playlists.delete_many({})
        print("✅ Data cleared")
    
    # Créer les données - AUGMENTATION DES QUANTITÉS
    artists = await create_artists(50)  # 20 -> 50 artistes
    tracks = await create_tracks(artists, tracks_per_artist=10)  # 5 -> 10 tracks par artiste
    albums = await create_albums(artists, albums_per_artist=3)  # 2 -> 3 albums par artiste
    await create_users_and_purchases(100)  # 30 -> 100 users
    await create_playlists(150)  # 50 -> 150 playlists
    
    print("=" * 50)
    print("✅ Seeding completed successfully!")
    print(f"📊 Summary:")
    print(f"  - Artists: {len(artists)}")
    print(f"  - Tracks: {len(tracks)}")
    print(f"  - Albums: {len(albums)}")
    print(f"  - Users: 100")
    print(f"  - Playlists: 150")
    print(f"\n🎵 TOTAL CONTENT: {len(tracks)} tracks from {len(artists)} artists!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
