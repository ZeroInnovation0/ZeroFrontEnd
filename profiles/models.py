from django.db import models
from django.utils.text import slugify

# Core Profile model for all users
class Profile(models.Model):
    # Reference the User model from the accounts app using a string to avoid import issues
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE)
    slug = models.SlugField(unique=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    position = models.CharField(max_length=100)
    description = models.TextField()
    story = models.TextField()
    video_thumbnail = models.ImageField(upload_to='video_thumbnails/', blank=True, null=True)
    video = models.FileField(upload_to='videos/', blank=True, null=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.user.user_type}"
    

class GalleryImage(models.Model):
    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='gallery_images'
    )
    image = models.ImageField(upload_to='profile_gallery/')
    caption = models.CharField(max_length=100, blank=True)
    original_filename = models.CharField(max_length=255, blank=True, null=True, help_text="Stores the original name of the file as uploaded by the user.")
    order = models.PositiveSmallIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image for {self.profile.user.username} - {self.original_filename or self.image.name}"

# Model for experience milestones
class Experience(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='experiences')
    title = models.CharField(max_length=100)
    duration = models.CharField(max_length=50)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.profile})"

# Model for education milestones
class Education(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='educations')
    title = models.CharField(max_length=100)
    duration = models.CharField(max_length=50)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.profile})"

# Model for quick facts
class Fact(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='facts')
    title = models.CharField(max_length=50)
    answer = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.title}: {self.answer} ({self.profile})"

# Model for investor contributions (specific to investors)
class Contribution(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='contributions')
    title = models.CharField(max_length=50)
    description = models.TextField()

    def __str__(self):
        return f"{self.title} ({self.profile})"