from django.shortcuts import render, redirect

def landing_page(request):
    # if request.user.is_authenticated:
    #     return redirect('temp')
    print("DEBUG: temp_home_page view was hit!") # Add this line
    return render(request, 'landing/landing.html')

def zero_auth_view(request):
    return render(request, 'accounts/zeroSL.html')