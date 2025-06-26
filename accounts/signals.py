from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User
from profiles.models import Profile
from django.utils.text import slugify

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    # 1. Ensure a Profile exists for every User
    profile, profile_created = Profile.objects.get_or_create(user=instance)

    # 2. Update the slug logic ONLY if first_name or last_name have values
    # or if the slug is currently based on username and needs to be updated.
    
    # Check if the user has a first or last name
    has_full_name_data = bool(instance.first_name and instance.first_name.strip()) or \
                         bool(instance.last_name and instance.last_name.strip())

    initial_username_slug = slugify(instance.username.split('@')[0])
    

    needs_slug_update = created or \
                        not profile.slug or \
                        profile.slug == initial_username_slug

    if has_full_name_data and profile.slug != slugify(f"{instance.first_name} {instance.last_name}"):
        needs_slug_update = True
    elif not has_full_name_data and profile.slug != initial_username_slug:
        # If no full name, but slug is NOT username slug, don't force it to username slug
        # unless it was never set or was explicitly username based.
        pass # Let existing non-username slug stay if first/last become empty
    
    if needs_slug_update:
        # **Use instance.first_name and instance.last_name directly for slug generation**
        desired_name_for_slug = f"{instance.first_name} {instance.last_name}".strip()

        if desired_name_for_slug:
            base_slug = slugify(desired_name_for_slug)
        else:
            base_slug = initial_username_slug

        slug = base_slug
        counter = 1
        # Use profile.id to exclude the current profile when checking for uniqueness
        while Profile.objects.filter(slug=slug).exclude(id=profile.id).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        profile.slug = slug
        profile.save(update_fields=['slug']) # Save only the slug field