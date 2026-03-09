from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.birthdays.models import ReferralProduct

PRODUCTS = [
    {
        "name": "Sony WH-1000XM5 Headphones",
        "category": "TECH",
        "description": "Industry-leading noise cancelling wireless headphones with 30-hour battery.",
        "price": "279.00",
        "currency": "GBP",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        "affiliate_url": "https://www.amazon.co.uk/dp/B09XS7JWHH",
        "merchant_name": "Amazon UK",
    },
    {
        "name": "Dyson Airwrap Complete Styler",
        "category": "BEAUTY",
        "description": "The Dyson Airwrap multi-styler for multiple hair types and styles.",
        "price": "479.99",
        "currency": "GBP",
        "image_url": "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400",
        "affiliate_url": "https://www.dyson.co.uk/hair-care/stylers/dyson-airwrap",
        "merchant_name": "Dyson",
    },
    {
        "name": "LEGO Architecture London Skyline",
        "category": "HOME",
        "description": "Build London's iconic skyline with this 468-piece LEGO set.",
        "price": "49.99",
        "currency": "GBP",
        "image_url": "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=400",
        "affiliate_url": "https://www.lego.com/en-gb/product/london-21034",
        "merchant_name": "LEGO",
    },
    {
        "name": "Ottolenghi Simple Cookbook",
        "category": "BOOKS",
        "description": "Over 130 recipes each with no more than 8 ingredients, from Yotam Ottolenghi.",
        "price": "20.00",
        "currency": "GBP",
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
        "affiliate_url": "https://www.waterstones.com/book/simple/yotam-ottolenghi/9781785031168",
        "merchant_name": "Waterstones",
    },
    {
        "name": "Fortnum & Mason Afternoon Tea Hamper",
        "category": "FOOD",
        "description": "A luxury hamper with Fortnum's finest teas, biscuits and preserves.",
        "price": "75.00",
        "currency": "GBP",
        "image_url": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400",
        "affiliate_url": "https://www.fortnumandmason.com/hampers",
        "merchant_name": "Fortnum & Mason",
    },
    {
        "name": "Nike Air Max 270",
        "category": "FASHION",
        "description": "Lifestyle shoe featuring the tallest Air unit to date for a super-cushioned ride.",
        "price": "134.95",
        "currency": "GBP",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        "affiliate_url": "https://www.nike.com/gb/t/air-max-270-shoes",
        "merchant_name": "Nike",
    },
    {
        "name": "Virgin Experience — Hot Air Balloon Ride",
        "category": "EXPERIENCE",
        "description": "Soar above the British countryside in a breathtaking hot air balloon adventure.",
        "price": "149.00",
        "currency": "GBP",
        "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        "affiliate_url": "https://www.virginexperiencedays.co.uk/hot-air-balloon-rides",
        "merchant_name": "Virgin Experience Days",
    },
]


class Command(BaseCommand):
    help = "Seed referral products for the birthday wishlist marketplace."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Clear existing referral products first.")

    def handle(self, *args, **options):
        if options["clear"]:
            count, _ = ReferralProduct.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Cleared {count} existing referral products."))

        created = 0
        updated = 0
        for data in PRODUCTS:
            slug = slugify(data["name"])
            obj, was_created = ReferralProduct.objects.update_or_create(
                slug=slug,
                defaults={**data, "slug": slug},
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Done. {created} created, {updated} updated.")
        )
