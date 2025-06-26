from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from profiles.models import Profile


@login_required
def temp_home_page(request):
    try:
        profile = Profile.objects.get(user=request.user)
    except Profile.DoesNotExist:
        profile = None  # Or handle differently if needed

    return render(request, 'home/home.html', {'profile': profile})