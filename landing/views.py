from django.shortcuts import render, redirect

def landing_page(request):
    if request.user.is_authenticated:
        return redirect('temp')  # Redirect authenticated users to /temp/
    return render(request, 'landing/landing.html')

def zero_auth_view(request):
    return render(request, 'accounts/zeroSL.html')