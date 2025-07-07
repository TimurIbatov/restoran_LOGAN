#!/usr/bin/env python3
"""
Скрипт для создания тестовых данных
"""

import os
import sys
import django
from django.utils.text import slugify

# Добавляем корневую директорию проекта в Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurant_backend.settings')
django.setup()

from apps.restaurant.models import Zone, Table, MenuCategory, MenuItem, RestaurantSettings
from apps.accounts.models import User

def create_zones():
    """Создает зоны ресторана"""
    zones_data = [
        {'name': 'Основной зал', 'slug': 'main-hall', 'description': 'Просторный основной зал'},
        {'name': 'VIP зона', 'slug': 'vip-zone', 'description': 'Приватная VIP зона'},
        {'name': 'Терраса', 'slug': 'terrace', 'description': 'Открытая терраса'}
    ]

    created_zones = []
    for zone_data in zones_data:
        zone, created = Zone.objects.get_or_create(slug=zone_data['slug'], defaults=zone_data)
        created_zones.append(zone)
        print(f"{'\u2705' if created else '\u2139\ufe0f'} Зона: {zone.name}")
    return created_zones

def create_tables(zones):
    """Создает столики"""
    tables_data = [
        {'name': 'Стол 1', 'zone': zones[0], 'capacity': 2, 'price_per_hour': 50000, 'position_x': 100, 'position_y': 100},
        {'name': 'Стол 2', 'zone': zones[0], 'capacity': 4, 'price_per_hour': 80000, 'position_x': 200, 'position_y': 100},
        {'name': 'VIP 1', 'zone': zones[1], 'capacity': 4, 'price_per_hour': 200000, 'position_x': 150, 'position_y': 150, 'is_vip': True},
        {'name': 'Терраса 1', 'zone': zones[2], 'capacity': 2, 'price_per_hour': 60000, 'position_x': 120, 'position_y': 120},
    ]

    for table_data in tables_data:
        table, created = Table.objects.get_or_create(
            name=table_data['name'],
            zone=table_data['zone'],
            defaults=table_data
        )
        print(f"{'\u2705' if created else '\u2139\ufe0f'} Столик: {table.name}")

def create_menu():
    """Создает меню и блюда"""
    categories_data = [
        {'name': 'Закуски', 'slug': 'appetizers', 'sort_order': 1},
        {'name': 'Супы', 'slug': 'soups', 'sort_order': 2},
        {'name': 'Основные блюда', 'slug': 'main-dishes', 'sort_order': 3},
        {'name': 'Десерты', 'slug': 'desserts', 'sort_order': 4},
        {'name': 'Напитки', 'slug': 'beverages', 'sort_order': 5},
    ]

    categories = []
    for data in categories_data:
        category, _ = MenuCategory.objects.get_or_create(slug=data['slug'], defaults=data)
        categories.append(category)

    menu_items_data = [
        {'name': 'Салат Цезарь', 'category': categories[0], 'price': 35000, 'description': 'Классический салат'},
        {'name': 'Борщ украинский', 'category': categories[1], 'price': 28000, 'description': 'Борщ со сметаной'},
        {'name': 'Стейк Рибай', 'category': categories[2], 'price': 85000, 'description': 'Стейк средней прожарки'},
        {'name': 'Тирамису', 'category': categories[3], 'price': 22000, 'description': 'Итальянский десерт'},
        {'name': 'Капучино', 'category': categories[4], 'price': 15000, 'description': 'Кофе с пенкой'},
    ]

    for item in menu_items_data:
        slug = slugify(item['name'])
        item['slug'] = slug
        menu_item, created = MenuItem.objects.get_or_create(slug=slug, defaults=item)
        print(f"{'\u2705' if created else '\u2139\ufe0f'} Блюдо: {menu_item.name}")

def create_restaurant_settings():
    """Создает настройки ресторана"""
    settings, created = RestaurantSettings.objects.get_or_create(
        defaults={
            'name': 'Ресторан LOGAN',
            'address': 'г. Ташкент',
            'phone': '+998 90 123 45 67',
            'email': 'info@logan.uz',
        }
    )
    print("\u2705 Настройки ресторана" if created else "\u2139\ufe0f Настройки уже существуют")

def create_test_users():
    """Создает пользователей"""
    users_data = [
        {'username': 'testuser', 'email': 'test@example.com', 'password': 'test123'},
        {'username': 'staff', 'email': 'staff@example.com', 'password': 'staff123', 'is_staff': True, 'role': 'staff'},
    ]

    for data in users_data:
        password = data.pop('password')
        user, created = User.objects.get_or_create(username=data['username'], defaults=data)
        if created:
            user.set_password(password)
            user.save()
        print(f"{'\u2705' if created else '\u2139\ufe0f'} Пользователь: {user.username}")

def main():
    print("\U0001F680 Создание тестовых данных для ресторана")
    print("=" * 50)
    try:
        create_restaurant_settings()
        zones = create_zones()
        create_tables(zones)
        create_menu()
        create_test_users()
        print("=" * 50)
        print("\u2705 Все данные успешно созданы!")
    except Exception as e:
        print(f"\u274C Ошибка: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()