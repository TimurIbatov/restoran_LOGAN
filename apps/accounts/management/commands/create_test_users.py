from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.restaurant.models import Zone, Table, MenuCategory, MenuItem, RestaurantSettings

User = get_user_model()

class Command(BaseCommand):
    help = 'Создает тестовых пользователей и начальные данные'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Создание тестовых пользователей...'))
        
        # Создаем администратора
        admin_user, created = User.objects.get_or_create(
            email='admin@logan.com',
            defaults={
                'username': 'admin',
                'first_name': 'Администратор',
                'last_name': 'LOGAN',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_verified': True,
                'phone': '+998901234567'
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'✅ Создан администратор: admin@logan.com / admin123')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️ Администратор уже существует: admin@logan.com')
            )

        # Создаем обычного пользователя
        user, created = User.objects.get_or_create(
            email='user@logan.com',
            defaults={
                'username': 'user',
                'first_name': 'Иван',
                'last_name': 'Петров',
                'role': 'user',
                'is_verified': True,
                'phone': '+998901234568',
                'address': 'г. Ташкент, ул. Навои, 15'
            }
        )
        if created:
            user.set_password('user123')
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'✅ Создан пользователь: user@logan.com / user123')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️ Пользователь уже существует: user@logan.com')
            )

        # Создаем персонал
        staff_user, created = User.objects.get_or_create(
            email='staff@logan.com',
            defaults={
                'username': 'staff',
                'first_name': 'Мария',
                'last_name': 'Сидорова',
                'role': 'staff',
                'is_staff': True,
                'is_verified': True,
                'phone': '+998901234569'
            }
        )
        if created:
            staff_user.set_password('staff123')
            staff_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'✅ Создан сотрудник: staff@logan.com / staff123')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️ Сотрудник уже существует: staff@logan.com')
            )

        # Создаем настройки ресторана
        settings, created = RestaurantSettings.objects.get_or_create(
            defaults={
                'name': 'Ресторан "LOGAN"',
                'description': 'Лучший ресторан в городе с изысканной кухней и уютной атмосферой',
                'address': 'г. Ташкент, ул. Рудаки, 1',
                'phone': '+998 (93) 668-29-24',
                'email': 'info@restaurant-logan.com',
                'website': 'https://restaurant-logan.com'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Созданы настройки ресторана'))

        # Создаем зоны
        zones_data = [
            {'name': 'Основной зал', 'slug': 'main', 'description': 'Просторный основной зал с панорамными окнами'},
            {'name': 'VIP-зона', 'slug': 'vip', 'description': 'Эксклюзивная зона для особых гостей'},
            {'name': 'Терраса', 'slug': 'terrace', 'description': 'Открытая терраса с видом на город'},
        ]

        for zone_data in zones_data:
            zone, created = Zone.objects.get_or_create(
                slug=zone_data['slug'],
                defaults=zone_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ Создана зона: {zone.name}'))

        # Создаем столики
        main_zone = Zone.objects.get(slug='main')
        vip_zone = Zone.objects.get(slug='vip')
        terrace_zone = Zone.objects.get(slug='terrace')

        tables_data = [
            # Основной зал
            {'name': 'Столик №1', 'zone': main_zone, 'capacity': 2, 'position_x': 100, 'position_y': 150, 'deposit': 50000},
            {'name': 'Столик №2', 'zone': main_zone, 'capacity': 4, 'position_x': 200, 'position_y': 150, 'deposit': 75000},
            {'name': 'Столик №3', 'zone': main_zone, 'capacity': 6, 'position_x': 300, 'position_y': 150, 'deposit': 100000},
            {'name': 'Столик №4', 'zone': main_zone, 'capacity': 2, 'position_x': 150, 'position_y': 220, 'deposit': 50000},
            {'name': 'Столик №5', 'zone': main_zone, 'capacity': 4, 'position_x': 250, 'position_y': 220, 'deposit': 75000},
            
            # VIP-зона
            {'name': 'VIP №1', 'zone': vip_zone, 'capacity': 4, 'position_x': 550, 'position_y': 150, 'deposit': 150000, 'is_vip': True},
            {'name': 'VIP №2', 'zone': vip_zone, 'capacity': 6, 'position_x': 600, 'position_y': 150, 'deposit': 200000, 'is_vip': True},
            
            # Терраса
            {'name': 'Терраса №1', 'zone': terrace_zone, 'capacity': 2, 'position_x': 200, 'position_y': 400, 'deposit': 60000},
            {'name': 'Терраса №2', 'zone': terrace_zone, 'capacity': 4, 'position_x': 300, 'position_y': 400, 'deposit': 80000},
            {'name': 'Терраса №3', 'zone': terrace_zone, 'capacity': 6, 'position_x': 400, 'position_y': 400, 'deposit': 120000},
        ]

        for table_data in tables_data:
            table, created = Table.objects.get_or_create(
                name=table_data['name'],
                zone=table_data['zone'],
                defaults={
                    'capacity': table_data['capacity'],
                    'position_x': table_data['position_x'],
                    'position_y': table_data['position_y'],
                    'deposit': table_data['deposit'],
                    'is_vip': table_data.get('is_vip', False),
                    'features': ['Wi-Fi', 'Кондиционер'] if not table_data.get('is_vip') else ['Wi-Fi', 'Кондиционер', 'Персональный официант', 'Премиум сервис']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ Создан столик: {table.name}'))

        # Создаем категории меню
        categories_data = [
            {'name': 'Закуски', 'slug': 'starters', 'description': 'Легкие закуски для начала трапезы', 'sort_order': 1},
            {'name': 'Салаты', 'slug': 'salads', 'description': 'Свежие салаты из отборных ингредиентов', 'sort_order': 2},
            {'name': 'Супы', 'slug': 'soups', 'description': 'Горячие супы по домашним рецептам', 'sort_order': 3},
            {'name': 'Основные блюда', 'slug': 'main', 'description': 'Сытные основные блюда', 'sort_order': 4},
            {'name': 'Десерты', 'slug': 'desserts', 'description': 'Сладкие десерты от шеф-кондитера', 'sort_order': 5},
            {'name': 'Напитки', 'slug': 'drinks', 'description': 'Горячие и холодные напитки', 'sort_order': 6},
        ]

        for cat_data in categories_data:
            category, created = MenuCategory.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ Создана категория: {category.name}'))

        # Создаем блюда
        starters = MenuCategory.objects.get(slug='starters')
        salads = MenuCategory.objects.get(slug='salads')
        soups = MenuCategory.objects.get(slug='soups')
        main = MenuCategory.objects.get(slug='main')
        desserts = MenuCategory.objects.get(slug='desserts')
        drinks = MenuCategory.objects.get(slug='drinks')

        menu_items_data = [
            # Закуски
            {'name': 'Брускетта с томатами', 'category': starters, 'price': 25000, 'description': 'Хрустящий хлеб с сочными томатами и базиликом', 'cooking_time': 10},
            {'name': 'Сырная тарелка', 'category': starters, 'price': 45000, 'description': 'Ассорти из отборных сыров с медом и орехами', 'cooking_time': 5, 'is_special': True},
            
            # Салаты
            {'name': 'Салат Цезарь', 'category': salads, 'price': 35000, 'description': 'Классический салат с курицей, пармезаном и соусом цезарь', 'cooking_time': 15},
            {'name': 'Греческий салат', 'category': salads, 'price': 30000, 'description': 'Свежие овощи с сыром фета и оливками', 'cooking_time': 10, 'is_vegetarian': True},
            
            # Супы
            {'name': 'Борщ украинский', 'category': soups, 'price': 25000, 'description': 'Традиционный борщ с говядиной и сметаной', 'cooking_time': 20},
            {'name': 'Крем-суп из грибов', 'category': soups, 'price': 28000, 'description': 'Нежный крем-суп из лесных грибов', 'cooking_time': 15, 'is_vegetarian': True},
            
            # Основные блюда
            {'name': 'Стейк Рибай', 'category': main, 'price': 85000, 'description': 'Сочный стейк из говядины, приготовленный на гриле', 'cooking_time': 25, 'is_special': True},
            {'name': 'Лосось на гриле', 'category': main, 'price': 65000, 'description': 'Филе лосося с овощами на гриле', 'cooking_time': 20},
            {'name': 'Паста Карбонара', 'category': main, 'price': 40000, 'description': 'Классическая итальянская паста с беконом и сыром', 'cooking_time': 15},
            
            # Десерты
            {'name': 'Тирамису', 'category': desserts, 'price': 28000, 'description': 'Классический итальянский десерт', 'cooking_time': 5, 'is_special': True},
            {'name': 'Чизкейк Нью-Йорк', 'category': desserts, 'price': 25000, 'description': 'Нежный чизкейк с ягодным соусом', 'cooking_time': 5},
            
            # Напитки
            {'name': 'Эспрессо', 'category': drinks, 'price': 8000, 'description': 'Крепкий итальянский кофе', 'cooking_time': 3},
            {'name': 'Капучино', 'category': drinks, 'price': 12000, 'description': 'Кофе с молочной пенкой', 'cooking_time': 5},
            {'name': 'Свежевыжатый сок', 'category': drinks, 'price': 15000, 'description': 'Апельсиновый или яблочный сок', 'cooking_time': 3},
        ]

        for item_data in menu_items_data:
            item, created = MenuItem.objects.get_or_create(
                name=item_data['name'],
                category=item_data['category'],
                defaults={
                    'slug': item_data['name'].lower().replace(' ', '-').replace('№', 'no'),
                    'price': item_data['price'],
                    'description': item_data['description'],
                    'cooking_time': item_data['cooking_time'],
                    'is_special': item_data.get('is_special', False),
                    'is_vegetarian': item_data.get('is_vegetarian', False),
                    'weight': 250,  # примерный вес
                    'calories': 300,  # примерная калорийность
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ Создано блюдо: {item.name}'))

        self.stdout.write(
            self.style.SUCCESS('\n🎉 Все тестовые данные успешно созданы!\n')
        )
        
        self.stdout.write(
            self.style.SUCCESS('📋 ДАННЫЕ ДЛЯ ВХОДА:')
        )
        self.stdout.write('👨‍💼 Администратор:')
        self.stdout.write('   Email: admin@logan.com')
        self.stdout.write('   Пароль: admin123')
        self.stdout.write('')
        self.stdout.write('👤 Обычный пользователь:')
        self.stdout.write('   Email: user@logan.com')
        self.stdout.write('   Пароль: user123')
        self.stdout.write('')
        self.stdout.write('👥 Сотрудник:')
        self.stdout.write('   Email: staff@logan.com')
        self.stdout.write('   Пароль: staff123')
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS('🌐 Доступ к админ-панели Django: /admin/')
        )