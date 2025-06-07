from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def temp_home_page(request):
    return render(request, 'temp_home/tmphome.html')