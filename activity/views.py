from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Post, PostImage, Hashtag
from accounts.models import User

@login_required
def publish_post(request):
    if request.method == 'POST':
        # Get the current user
        user = request.user

        # Extract form data
        caption = request.POST.get('caption', '').strip()
        category = request.POST.get('category', '')

        # Validate required fields
        if not caption:
            messages.error(request, "Caption is required.")
            return render(request, 'activity/publish.html')

        # Create a new Post instance
        post = Post.objects.create(
            author=user,
            caption=caption,
            category=category if category else None
        )

        # Handle uploaded images
        if 'images' in request.FILES:
            images = request.FILES.getlist('images')
            for index, image in enumerate(images):
                PostImage.objects.create(
                    post=post,
                    image=image,
                    alt_text=f"Image {index + 1}",
                    order=index
                )

        # Handle hashtags (assuming they're extracted from caption or a separate field if added later)
        # For now, we'll extract hashtags from caption using a simple regex
        import re
        hashtag_pattern = r'#(\w+)'
        hashtags = re.findall(hashtag_pattern, caption)
        for hashtag_name in hashtags:
            hashtag, created = Hashtag.objects.get_or_create(name=hashtag_name.lower())
            post.hashtags.add(hashtag)

        messages.success(request, "Post published successfully!")
        # Redirect to the user's profile page (using the slug from the profile app)
        from profiles.models import Profile
        profile = Profile.objects.get(user=user)
        return redirect('profiles:profile_detail', slug=profile.slug)

    # GET request: render the publish form
    return render(request, 'activity/publish.html')