"""
Script to create a superuser for Django admin.
Run this with: python manage.py shell < create_superuser.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

# Create superuser
email = 'admin@fordham.edu'
password = 'admin123'
full_name = 'Admin User'

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(
        username='admin',
        email=email,
        password=password,
        full_name=full_name,
        is_email_verified=True,
        campus='RH'
    )
    print('Superuser created successfully!')
    print(f'Email: {email}')
    print(f'Password: {password}')
else:
    print(f'Superuser with email {email} already exists.')
