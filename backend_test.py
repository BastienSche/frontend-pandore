#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime
import time

class PandoreAPITester:
    def __init__(self, base_url="https://direct-music-shop.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", endpoint=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "endpoint": endpoint
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details, endpoint)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}", endpoint)
            return None

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        user_data = {
            "email": f"test.user.{timestamp}@example.com",
            "password": "TestPass123!",
            "name": "Test User",
            "artist_name": None
        }
        
        result = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if result:
            self.user_id = result.get('user_id')
            return user_data
        return None

    def test_artist_registration(self):
        """Test artist registration"""
        timestamp = int(time.time())
        artist_data = {
            "email": f"test.artist.{timestamp}@example.com",
            "password": "TestPass123!",
            "name": "Test Artist",
            "artist_name": "Test Artist Name"
        }
        
        result = self.run_test(
            "Artist Registration",
            "POST",
            "auth/register",
            200,
            data=artist_data
        )
        
        return artist_data if result else None

    def test_user_login(self, user_data):
        """Test user login"""
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        result = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if result and 'token' in result:
            self.token = result['token']
            self.user_id = result['user']['user_id']
            return True
        return False

    def test_get_current_user(self):
        """Test get current user"""
        result = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return result is not None

    def test_role_switch(self):
        """Test role switching"""
        # Switch to artist
        result = self.run_test(
            "Switch to Artist Role",
            "PUT",
            "auth/role?artist_name=Test Artist Name",
            200
        )
        
        if result:
            # Switch back to user
            result2 = self.run_test(
                "Switch to User Role",
                "PUT",
                "auth/role",
                200
            )
            return result2 is not None
        return False

    def test_tracks_endpoints(self):
        """Test tracks CRUD operations"""
        # Get tracks (public endpoint)
        self.run_test(
            "Get Tracks List",
            "GET",
            "tracks",
            200
        )
        
        # Create track (requires artist role)
        track_data = {
            "title": "Test Track",
            "price": 9.99,
            "genre": "Electronic",
            "description": "A test track"
        }
        
        # First switch to artist role
        self.run_test(
            "Switch to Artist for Track Creation",
            "PUT",
            "auth/role?artist_name=Test Artist Name",
            200
        )
        
        track_result = self.run_test(
            "Create Track",
            "POST",
            "tracks",
            200,
            data=track_data
        )
        
        if track_result:
            track_id = track_result.get('track_id')
            
            # Get specific track
            self.run_test(
                "Get Specific Track",
                "GET",
                f"tracks/{track_id}",
                200
            )
            
            # Update track
            update_data = {"title": "Updated Test Track"}
            self.run_test(
                "Update Track",
                "PUT",
                f"tracks/{track_id}",
                200,
                data=update_data
            )
            
            # Delete track
            self.run_test(
                "Delete Track",
                "DELETE",
                f"tracks/{track_id}",
                200
            )

    def test_albums_endpoints(self):
        """Test albums CRUD operations"""
        # Get albums (public endpoint)
        self.run_test(
            "Get Albums List",
            "GET",
            "albums",
            200
        )
        
        # Create album (requires artist role)
        album_data = {
            "title": "Test Album",
            "price": 19.99,
            "description": "A test album"
        }
        
        album_result = self.run_test(
            "Create Album",
            "POST",
            "albums",
            200,
            data=album_data
        )
        
        if album_result:
            album_id = album_result.get('album_id')
            
            # Get specific album
            self.run_test(
                "Get Specific Album",
                "GET",
                f"albums/{album_id}",
                200
            )

    def test_artists_endpoints(self):
        """Test artists endpoints"""
        self.run_test(
            "Get Artists List",
            "GET",
            "artists",
            200
        )
        
        if self.user_id:
            self.run_test(
                "Get Specific Artist",
                "GET",
                f"artists/{self.user_id}",
                200
            )

    def test_library_endpoints(self):
        """Test library/purchase endpoints"""
        # Switch back to user role for purchases
        self.run_test(
            "Switch to User for Library Test",
            "PUT",
            "auth/role",
            200
        )
        
        self.run_test(
            "Get User Library",
            "GET",
            "purchases/library",
            200
        )

    def test_playlists_endpoints(self):
        """Test playlist endpoints"""
        # Create playlist
        playlist_data = {
            "name": "Test Playlist",
            "description": "A test playlist"
        }
        
        playlist_result = self.run_test(
            "Create Playlist",
            "POST",
            "playlists",
            200,
            data=playlist_data
        )
        
        # Get playlists
        self.run_test(
            "Get User Playlists",
            "GET",
            "playlists",
            200
        )
        
        if playlist_result:
            playlist_id = playlist_result.get('playlist_id')
            
            # Update playlist tracks
            self.run_test(
                "Update Playlist Tracks",
                "PUT",
                f"playlists/{playlist_id}/tracks",
                200,
                data=[]
            )
            
            # Delete playlist
            self.run_test(
                "Delete Playlist",
                "DELETE",
                f"playlists/{playlist_id}",
                200
            )

    def test_likes_endpoints(self):
        """Test likes endpoints"""
        self.run_test(
            "Get User Likes",
            "GET",
            "likes",
            200
        )

    def test_logout(self):
        """Test logout"""
        self.run_test(
            "User Logout",
            "POST",
            "auth/logout",
            200
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Pandore API Tests...")
        print(f"Backend URL: {self.base_url}")
        print("=" * 50)
        
        # Test user registration and login
        user_data = self.test_user_registration()
        if not user_data:
            print("❌ Cannot proceed without user registration")
            return False
        
        # Test artist registration
        self.test_artist_registration()
        
        # Test login
        if not self.test_user_login(user_data):
            print("❌ Cannot proceed without login")
            return False
        
        # Test authenticated endpoints
        self.test_get_current_user()
        self.test_role_switch()
        self.test_tracks_endpoints()
        self.test_albums_endpoints()
        self.test_artists_endpoints()
        self.test_library_endpoints()
        self.test_playlists_endpoints()
        self.test_likes_endpoints()
        self.test_logout()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if success_rate < 70:
            print("⚠️  Many tests failed - backend may have issues")
            return False
        elif success_rate < 90:
            print("⚠️  Some tests failed - minor issues detected")
            return True
        else:
            print("✅ Most tests passed - backend looks good")
            return True

def main():
    tester = PandoreAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            'tests_passed': tester.tests_passed,
            'tests_run': tester.tests_run,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())