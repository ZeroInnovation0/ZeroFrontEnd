from django.db import models
from accounts.models import User

class Hashtag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    caption = models.TextField(max_length=300)
    category = models.CharField(
        max_length=50,
        choices=[
            ('Art', 'Art'),
            ('Food', 'Food'),
            ('Travel', 'Travel'),
            ('Photography', 'Photography'),
            ('Design', 'Design'),
        ],
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    hashtags = models.ManyToManyField(Hashtag, blank=True, related_name='posts')
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)

    def __str__(self):
        return f"Post by {self.author.username} on {self.created_at}"

class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='images')
    file = models.FileField(upload_to='post_files/', null=True, blank=True)
    thumbnail = models.FileField(upload_to='thumbnails/', null=True, blank=True)
    alt_text = models.CharField(max_length=100, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image for post {self.post.id}"

class Reaction(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reactions')
    text = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.text} on {self.post}"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    likes = models.ManyToManyField(User, related_name='comment_likes', blank=True)  # Added from previous response
    depth = models.IntegerField(default=0)  # Add depth field

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post}"