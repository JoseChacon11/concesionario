#!/usr/bin/env python3
"""
Backend Testing Suite for MotoDealer SaaS Multi-tenant System
Tests Supabase integration, authentication, multi-tenancy, and CRUD operations
"""

import os
import sys
import json
import requests
import asyncio
from datetime import datetime
import uuid

# Add the app directory to Python path
sys.path.append('/app')

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv('/app/.env')
except ImportError:
    # If python-dotenv is not available, manually load .env
    with open('/app/.env', 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

class MotoDealer_Backend_Tester:
    def __init__(self):
        # Load environment variables
        self.base_url = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://motodealer-app.preview.emergentagent.com')
        self.api_url = f"{self.base_url}/api"
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_anon_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        self.supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        # Test users
        self.test_users = [
            {
                'email': 'motostachira@gmail.com',
                'password': 'password123',
                'dealership_slug': 'motostachira',
                'dealership_id': 'd1111111-1111-1111-1111-111111111111'
            },
            {
                'email': 'eklasvegas@gmail.com', 
                'password': 'password123',
                'dealership_slug': 'eklasvegas',
                'dealership_id': 'd2222222-2222-2222-2222-222222222222'
            }
        ]
        
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'MotoDealer-Backend-Tester/1.0'
        })
        
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_environment_variables(self):
        """Test 1: Verify environment variables are present"""
        print("\n=== TESTING ENVIRONMENT VARIABLES ===")
        
        required_vars = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
            'SUPABASE_SERVICE_ROLE_KEY',
            'NEXT_PUBLIC_BASE_URL'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            self.log_test(
                "Environment Variables",
                False,
                f"Missing variables: {', '.join(missing_vars)}",
                {'missing': missing_vars}
            )
        else:
            self.log_test(
                "Environment Variables", 
                True,
                "All required environment variables present",
                {
                    'supabase_url': self.supabase_url,
                    'base_url': self.base_url
                }
            )
    
    def test_api_health(self):
        """Test 2: Basic API health check"""
        print("\n=== TESTING API HEALTH ===")
        
        try:
            # Test root endpoint
            response = self.session.get(f"{self.api_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == "MotoDealer SaaS API":
                    self.log_test(
                        "API Root Endpoint",
                        True,
                        "API is running and responding correctly",
                        data
                    )
                else:
                    self.log_test(
                        "API Root Endpoint",
                        False,
                        "API responding but unexpected message",
                        data
                    )
            else:
                self.log_test(
                    "API Root Endpoint",
                    False,
                    f"API returned status {response.status_code}",
                    {'status_code': response.status_code, 'response': response.text}
                )
                
            # Test health endpoint
            response = self.session.get(f"{self.api_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == "healthy":
                    self.log_test(
                        "API Health Endpoint",
                        True,
                        "Health check passed",
                        data
                    )
                else:
                    self.log_test(
                        "API Health Endpoint",
                        False,
                        "Health endpoint responding but status not healthy",
                        data
                    )
            else:
                self.log_test(
                    "API Health Endpoint",
                    False,
                    f"Health endpoint returned status {response.status_code}",
                    {'status_code': response.status_code}
                )
                
        except Exception as e:
            self.log_test(
                "API Health Check",
                False,
                f"Failed to connect to API: {str(e)}",
                {'error': str(e)}
            )
    
    def test_supabase_connection(self):
        """Test 3: Test Supabase connection"""
        print("\n=== TESTING SUPABASE CONNECTION ===")
        
        try:
            # Test Supabase REST API connection
            headers = {
                'apikey': self.supabase_anon_key,
                'Authorization': f'Bearer {self.supabase_anon_key}',
                'Content-Type': 'application/json'
            }
            
            # Test connection by querying dealerships table
            response = self.session.get(
                f"{self.supabase_url}/rest/v1/dealerships?select=id,slug,name,is_active&is_active=eq.true",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                dealerships = response.json()
                if isinstance(dealerships, list) and len(dealerships) >= 2:
                    self.log_test(
                        "Supabase Connection",
                        True,
                        f"Successfully connected to Supabase, found {len(dealerships)} active dealerships",
                        {'dealerships': [d['slug'] for d in dealerships]}
                    )
                else:
                    self.log_test(
                        "Supabase Connection",
                        False,
                        f"Connected but unexpected data: {dealerships}",
                        {'response': dealerships}
                    )
            else:
                self.log_test(
                    "Supabase Connection",
                    False,
                    f"Supabase connection failed with status {response.status_code}",
                    {'status_code': response.status_code, 'response': response.text}
                )
                
        except Exception as e:
            self.log_test(
                "Supabase Connection",
                False,
                f"Failed to connect to Supabase: {str(e)}",
                {'error': str(e)}
            )
    
    def test_supabase_auth(self):
        """Test 4: Test Supabase authentication with test users"""
        print("\n=== TESTING SUPABASE AUTHENTICATION ===")
        
        for user in self.test_users:
            try:
                # Attempt to authenticate using Supabase Auth API
                auth_data = {
                    'email': user['email'],
                    'password': user['password']
                }
                
                headers = {
                    'apikey': self.supabase_anon_key,
                    'Content-Type': 'application/json'
                }
                
                response = self.session.post(
                    f"{self.supabase_url}/auth/v1/token?grant_type=password",
                    headers=headers,
                    json=auth_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    auth_response = response.json()
                    if 'access_token' in auth_response:
                        self.log_test(
                            f"Authentication - {user['email']}",
                            True,
                            "Successfully authenticated with Supabase",
                            {
                                'user_id': auth_response.get('user', {}).get('id'),
                                'email': auth_response.get('user', {}).get('email')
                            }
                        )
                        
                        # Test getting user dealership info
                        self.test_user_dealership_info(auth_response['access_token'], user)
                        
                    else:
                        self.log_test(
                            f"Authentication - {user['email']}",
                            False,
                            "Authentication response missing access_token",
                            auth_response
                        )
                else:
                    self.log_test(
                        f"Authentication - {user['email']}",
                        False,
                        f"Authentication failed with status {response.status_code}",
                        {'status_code': response.status_code, 'response': response.text}
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Authentication - {user['email']}",
                    False,
                    f"Authentication error: {str(e)}",
                    {'error': str(e)}
                )
    
    def test_user_dealership_info(self, access_token, user):
        """Test getting user dealership information (multi-tenancy)"""
        try:
            headers = {
                'apikey': self.supabase_anon_key,
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Get user info with dealership
            response = self.session.get(
                f"{self.supabase_url}/rest/v1/users?select=*,dealerships(*)",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                users_data = response.json()
                if users_data and len(users_data) > 0:
                    user_data = users_data[0]
                    dealership = user_data.get('dealerships')
                    
                    if dealership and dealership.get('slug') == user['dealership_slug']:
                        self.log_test(
                            f"Multi-tenancy - {user['email']}",
                            True,
                            f"User correctly linked to dealership '{dealership['name']}'",
                            {
                                'dealership_id': dealership['id'],
                                'dealership_slug': dealership['slug'],
                                'dealership_name': dealership['name']
                            }
                        )
                    else:
                        self.log_test(
                            f"Multi-tenancy - {user['email']}",
                            False,
                            "User not properly linked to expected dealership",
                            {'expected_slug': user['dealership_slug'], 'actual': dealership}
                        )
                else:
                    self.log_test(
                        f"Multi-tenancy - {user['email']}",
                        False,
                        "No user data returned",
                        {'response': users_data}
                    )
            else:
                self.log_test(
                    f"Multi-tenancy - {user['email']}",
                    False,
                    f"Failed to get user info, status {response.status_code}",
                    {'status_code': response.status_code}
                )
                
        except Exception as e:
            self.log_test(
                f"Multi-tenancy - {user['email']}",
                False,
                f"Error getting user dealership info: {str(e)}",
                {'error': str(e)}
            )
    
    def test_crud_operations(self):
        """Test 5: Test CRUD operations using service role key"""
        print("\n=== TESTING CRUD OPERATIONS ===")
        
        # Use service role key for admin operations
        headers = {
            'apikey': self.supabase_service_key,
            'Authorization': f'Bearer {self.supabase_service_key}',
            'Content-Type': 'application/json'
        }
        
        test_dealership_id = self.test_users[0]['dealership_id']
        
        # Test Categories CRUD
        self.test_categories_crud(headers, test_dealership_id)
        
        # Test Subcategories CRUD
        self.test_subcategories_crud(headers, test_dealership_id)
        
        # Test Products CRUD
        self.test_products_crud(headers, test_dealership_id)
        
        # Test Employees CRUD
        self.test_employees_crud(headers, test_dealership_id)
        
        # Test Site Settings CRUD
        self.test_site_settings_crud(headers, test_dealership_id)
    
    def test_categories_crud(self, headers, dealership_id):
        """Test Categories CRUD operations"""
        try:
            # CREATE Category
            category_data = {
                'dealership_id': dealership_id,
                'name': 'Motos Test',
                'slug': 'motos-test',
                'description': 'Categoría de prueba para motos'
            }
            
            response = self.session.post(
                f"{self.supabase_url}/rest/v1/categories",
                headers=headers,
                json=category_data,
                timeout=10
            )
            
            if response.status_code == 201:
                created_category = response.json()[0]
                category_id = created_category['id']
                
                self.log_test(
                    "Categories CREATE",
                    True,
                    "Successfully created test category",
                    {'category_id': category_id, 'name': created_category['name']}
                )
                
                # READ Categories
                response = self.session.get(
                    f"{self.supabase_url}/rest/v1/categories?dealership_id=eq.{dealership_id}",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    categories = response.json()
                    test_category = next((c for c in categories if c['id'] == category_id), None)
                    
                    if test_category:
                        self.log_test(
                            "Categories READ",
                            True,
                            f"Successfully retrieved categories, found test category",
                            {'total_categories': len(categories)}
                        )
                    else:
                        self.log_test(
                            "Categories READ",
                            False,
                            "Test category not found in results",
                            {'categories_count': len(categories)}
                        )
                else:
                    self.log_test(
                        "Categories READ",
                        False,
                        f"Failed to read categories, status {response.status_code}",
                        {'status_code': response.status_code}
                    )
                
                # UPDATE Category
                update_data = {'description': 'Categoría actualizada de prueba'}
                response = self.session.patch(
                    f"{self.supabase_url}/rest/v1/categories?id=eq.{category_id}",
                    headers=headers,
                    json=update_data,
                    timeout=10
                )
                
                if response.status_code == 204:
                    self.log_test(
                        "Categories UPDATE",
                        True,
                        "Successfully updated test category",
                        {'category_id': category_id}
                    )
                else:
                    self.log_test(
                        "Categories UPDATE",
                        False,
                        f"Failed to update category, status {response.status_code}",
                        {'status_code': response.status_code}
                    )
                
                # DELETE Category
                response = self.session.delete(
                    f"{self.supabase_url}/rest/v1/categories?id=eq.{category_id}",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 204:
                    self.log_test(
                        "Categories DELETE",
                        True,
                        "Successfully deleted test category",
                        {'category_id': category_id}
                    )
                else:
                    self.log_test(
                        "Categories DELETE",
                        False,
                        f"Failed to delete category, status {response.status_code}",
                        {'status_code': response.status_code}
                    )
                    
            else:
                self.log_test(
                    "Categories CREATE",
                    False,
                    f"Failed to create category, status {response.status_code}",
                    {'status_code': response.status_code, 'response': response.text}
                )
                
        except Exception as e:
            self.log_test(
                "Categories CRUD",
                False,
                f"Error in categories CRUD: {str(e)}",
                {'error': str(e)}
            )
    
    def test_subcategories_crud(self, headers, dealership_id):
        """Test Subcategories CRUD operations"""
        try:
            # First create a category for the subcategory
            category_data = {
                'dealership_id': dealership_id,
                'name': 'Motos Parent',
                'slug': 'motos-parent',
                'description': 'Categoría padre para subcategorías'
            }
            
            response = self.session.post(
                f"{self.supabase_url}/rest/v1/categories",
                headers=headers,
                json=category_data,
                timeout=10
            )
            
            if response.status_code == 201:
                parent_category = response.json()[0]
                category_id = parent_category['id']
                
                # CREATE Subcategory
                subcategory_data = {
                    'dealership_id': dealership_id,
                    'category_id': category_id,
                    'name': 'Clásicas Test',
                    'slug': 'clasicas-test',
                    'description': 'Subcategoría de prueba'
                }
                
                response = self.session.post(
                    f"{self.supabase_url}/rest/v1/subcategories",
                    headers=headers,
                    json=subcategory_data,
                    timeout=10
                )
                
                if response.status_code == 201:
                    created_subcategory = response.json()[0]
                    subcategory_id = created_subcategory['id']
                    
                    self.log_test(
                        "Subcategories CREATE",
                        True,
                        "Successfully created test subcategory",
                        {'subcategory_id': subcategory_id, 'name': created_subcategory['name']}
                    )
                    
                    # READ Subcategories
                    response = self.session.get(
                        f"{self.supabase_url}/rest/v1/subcategories?dealership_id=eq.{dealership_id}",
                        headers=headers,
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        subcategories = response.json()
                        test_subcategory = next((s for s in subcategories if s['id'] == subcategory_id), None)
                        
                        if test_subcategory:
                            self.log_test(
                                "Subcategories READ",
                                True,
                                "Successfully retrieved subcategories",
                                {'total_subcategories': len(subcategories)}
                            )
                        else:
                            self.log_test(
                                "Subcategories READ",
                                False,
                                "Test subcategory not found",
                                {'subcategories_count': len(subcategories)}
                            )
                    
                    # Cleanup
                    self.session.delete(f"{self.supabase_url}/rest/v1/subcategories?id=eq.{subcategory_id}", headers=headers)
                    self.session.delete(f"{self.supabase_url}/rest/v1/categories?id=eq.{category_id}", headers=headers)
                    
                else:
                    self.log_test(
                        "Subcategories CREATE",
                        False,
                        f"Failed to create subcategory, status {response.status_code}",
                        {'status_code': response.status_code}
                    )
            else:
                self.log_test(
                    "Subcategories CRUD",
                    False,
                    "Failed to create parent category for subcategory test",
                    {'status_code': response.status_code}
                )
                
        except Exception as e:
            self.log_test(
                "Subcategories CRUD",
                False,
                f"Error in subcategories CRUD: {str(e)}",
                {'error': str(e)}
            )
    
    def test_products_crud(self, headers, dealership_id):
        """Test Products CRUD operations"""
        try:
            # CREATE Product
            product_data = {
                'dealership_id': dealership_id,
                'name': 'Honda CBR 500 Test',
                'slug': 'honda-cbr-500-test',
                'brand': 'Honda',
                'model': 'CBR 500',
                'year': 2024,
                'price': 15000.00,
                'description': 'Moto deportiva de prueba',
                'status': 'available'
            }
            
            response = self.session.post(
                f"{self.supabase_url}/rest/v1/products",
                headers=headers,
                json=product_data,
                timeout=10
            )
            
            if response.status_code == 201:
                created_product = response.json()[0]
                product_id = created_product['id']
                
                self.log_test(
                    "Products CREATE",
                    True,
                    "Successfully created test product",
                    {'product_id': product_id, 'name': created_product['name']}
                )
                
                # READ Products
                response = self.session.get(
                    f"{self.supabase_url}/rest/v1/products?dealership_id=eq.{dealership_id}",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    products = response.json()
                    test_product = next((p for p in products if p['id'] == product_id), None)
                    
                    if test_product:
                        self.log_test(
                            "Products READ",
                            True,
                            "Successfully retrieved products",
                            {'total_products': len(products)}
                        )
                    else:
                        self.log_test(
                            "Products READ",
                            False,
                            "Test product not found",
                            {'products_count': len(products)}
                        )
                
                # Cleanup
                self.session.delete(f"{self.supabase_url}/rest/v1/products?id=eq.{product_id}", headers=headers)
                
            else:
                self.log_test(
                    "Products CREATE",
                    False,
                    f"Failed to create product, status {response.status_code}",
                    {'status_code': response.status_code, 'response': response.text}
                )
                
        except Exception as e:
            self.log_test(
                "Products CRUD",
                False,
                f"Error in products CRUD: {str(e)}",
                {'error': str(e)}
            )
    
    def test_employees_crud(self, headers, dealership_id):
        """Test Employees CRUD operations"""
        try:
            # CREATE Employee
            employee_data = {
                'dealership_id': dealership_id,
                'full_name': 'Juan Pérez Test',
                'position': 'Vendedor',
                'phone': '+58 414 123 4567',
                'whatsapp': '+58 414 123 4567',
                'email': 'juan.test@motostachira.com',
                'is_active': True
            }
            
            response = self.session.post(
                f"{self.supabase_url}/rest/v1/employees",
                headers=headers,
                json=employee_data,
                timeout=10
            )
            
            if response.status_code == 201:
                created_employee = response.json()[0]
                employee_id = created_employee['id']
                
                self.log_test(
                    "Employees CREATE",
                    True,
                    "Successfully created test employee",
                    {'employee_id': employee_id, 'name': created_employee['full_name']}
                )
                
                # READ Employees
                response = self.session.get(
                    f"{self.supabase_url}/rest/v1/employees?dealership_id=eq.{dealership_id}",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    employees = response.json()
                    test_employee = next((e for e in employees if e['id'] == employee_id), None)
                    
                    if test_employee:
                        self.log_test(
                            "Employees READ",
                            True,
                            "Successfully retrieved employees",
                            {'total_employees': len(employees)}
                        )
                    else:
                        self.log_test(
                            "Employees READ",
                            False,
                            "Test employee not found",
                            {'employees_count': len(employees)}
                        )
                
                # Cleanup
                self.session.delete(f"{self.supabase_url}/rest/v1/employees?id=eq.{employee_id}", headers=headers)
                
            else:
                self.log_test(
                    "Employees CREATE",
                    False,
                    f"Failed to create employee, status {response.status_code}",
                    {'status_code': response.status_code, 'response': response.text}
                )
                
        except Exception as e:
            self.log_test(
                "Employees CRUD",
                False,
                f"Error in employees CRUD: {str(e)}",
                {'error': str(e)}
            )
    
    def test_site_settings_crud(self, headers, dealership_id):
        """Test Site Settings CRUD operations"""
        try:
            # READ existing site settings
            response = self.session.get(
                f"{self.supabase_url}/rest/v1/site_settings?dealership_id=eq.{dealership_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                settings = response.json()
                
                if settings and len(settings) > 0:
                    # UPDATE existing settings
                    settings_id = settings[0]['id']
                    update_data = {
                        'hero_title': 'Título de prueba actualizado',
                        'hero_subtitle': 'Subtítulo de prueba',
                        'main_whatsapp': '+58 414 999 8888'
                    }
                    
                    response = self.session.patch(
                        f"{self.supabase_url}/rest/v1/site_settings?id=eq.{settings_id}",
                        headers=headers,
                        json=update_data,
                        timeout=10
                    )
                    
                    if response.status_code == 204:
                        self.log_test(
                            "Site Settings UPDATE",
                            True,
                            "Successfully updated site settings",
                            {'settings_id': settings_id}
                        )
                    else:
                        self.log_test(
                            "Site Settings UPDATE",
                            False,
                            f"Failed to update settings, status {response.status_code}",
                            {'status_code': response.status_code}
                        )
                else:
                    # CREATE new settings if none exist
                    settings_data = {
                        'dealership_id': dealership_id,
                        'hero_title': 'Título de prueba',
                        'hero_subtitle': 'Subtítulo de prueba',
                        'footer_text': 'Footer de prueba',
                        'main_whatsapp': '+58 414 999 8888'
                    }
                    
                    response = self.session.post(
                        f"{self.supabase_url}/rest/v1/site_settings",
                        headers=headers,
                        json=settings_data,
                        timeout=10
                    )
                    
                    if response.status_code == 201:
                        self.log_test(
                            "Site Settings CREATE",
                            True,
                            "Successfully created site settings",
                            {'dealership_id': dealership_id}
                        )
                    else:
                        self.log_test(
                            "Site Settings CREATE",
                            False,
                            f"Failed to create settings, status {response.status_code}",
                            {'status_code': response.status_code}
                        )
                
                self.log_test(
                    "Site Settings READ",
                    True,
                    f"Successfully retrieved site settings",
                    {'settings_count': len(settings)}
                )
            else:
                self.log_test(
                    "Site Settings READ",
                    False,
                    f"Failed to read site settings, status {response.status_code}",
                    {'status_code': response.status_code}
                )
                
        except Exception as e:
            self.log_test(
                "Site Settings CRUD",
                False,
                f"Error in site settings CRUD: {str(e)}",
                {'error': str(e)}
            )
    
    def test_public_landing_page(self):
        """Test 6: Test public landing page access"""
        print("\n=== TESTING PUBLIC LANDING PAGE ===")
        
        for user in self.test_users:
            try:
                # Test public catalog page
                catalog_url = f"{self.base_url}/catalogo/{user['dealership_slug']}"
                response = self.session.get(catalog_url, timeout=15)
                
                if response.status_code == 200:
                    # Check if page contains expected content
                    content = response.text
                    if 'MotoDealer' in content or user['dealership_slug'] in content:
                        self.log_test(
                            f"Public Landing Page - {user['dealership_slug']}",
                            True,
                            "Landing page loads successfully",
                            {'url': catalog_url, 'status_code': response.status_code}
                        )
                    else:
                        self.log_test(
                            f"Public Landing Page - {user['dealership_slug']}",
                            False,
                            "Landing page loads but missing expected content",
                            {'url': catalog_url, 'content_length': len(content)}
                        )
                else:
                    self.log_test(
                        f"Public Landing Page - {user['dealership_slug']}",
                        False,
                        f"Landing page returned status {response.status_code}",
                        {'url': catalog_url, 'status_code': response.status_code}
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Public Landing Page - {user['dealership_slug']}",
                    False,
                    f"Error accessing landing page: {str(e)}",
                    {'error': str(e), 'url': catalog_url}
                )
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting MotoDealer SaaS Backend Testing Suite")
        print("=" * 60)
        
        # Run all tests
        self.test_environment_variables()
        self.test_api_health()
        self.test_supabase_connection()
        self.test_supabase_auth()
        self.test_crud_operations()
        self.test_public_landing_page()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("🏁 TESTING SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for test in self.test_results:
                if not test['success']:
                    print(f"  • {test['test']}: {test['message']}")
        
        print("\n✅ PASSED TESTS:")
        for test in self.test_results:
            if test['success']:
                print(f"  • {test['test']}: {test['message']}")
        
        # Save detailed results to file
        with open('/app/backend_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': total_tests,
                    'passed_tests': passed_tests,
                    'failed_tests': failed_tests,
                    'success_rate': (passed_tests/total_tests)*100
                },
                'test_results': self.test_results,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")

if __name__ == "__main__":
    tester = MotoDealer_Backend_Tester()
    tester.run_all_tests()