from django.contrib import admin
from .models import Profile, GalleryImage

class GalleryImageInline(admin.TabularInline):
    model = GalleryImage
    extra = 1
    fields = ['order', 'image', 'caption']

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    inlines = [GalleryImageInline]