#!/usr/bin/env python
"""
Скрипт для создания миграций Django
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurant_backend.settings')
    django.setup()
    
    # Создаем миграции для всех приложений
    apps = ['accounts', 'restaurant', 'bookings', 'reviews']
    
    for app in apps:
        print(f"Создание миграций для {app}...")
        execute_from_command_line(['manage.py', 'makemigrations', app])
    
    print("Применение миграций...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    print("Миграции созданы и применены успешно!")
